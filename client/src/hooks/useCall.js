import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listenIncomingCalls, acceptCall, declineCall } from "../services/call/callService";
import { supabase } from "../services/supabase"; 

export default function useCall(user) {
  const navigate = useNavigate();
  const [incomingCall, setIncomingCall] = useState(null);
  const [callerProfile, setCallerProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    console.log("Subscribing to global incoming call channel for user:", user.id);

    const channel = listenIncomingCalls(user.id, async (callData) => {
      console.log("Incoming call received via Supabase Realtime:", callData);
      
      // ONLY trigger incoming call overlay if the call row status is actually pending/ringing
      if (callData && (callData.status === "ringing" || callData.status === "pending")) {
        setIncomingCall(callData);

        if (callData?.caller_id) {
          try {
            const { data } = await supabase
              .from("profiles")
              .select("display_name")
              .eq("id", callData.caller_id)
              .single();

            if (data) {
              setCallerProfile(data);
            }
          } catch (err) {
            console.error("Error fetching caller profile details:", err);
          }
        }
      } else if (callData && (callData.status === "accepted" || callData.status === "ended" || callData.status === "declined")) {
        // Clear out the temporary banner instantly if status changes globally
        setIncomingCall(null);
        setCallerProfile(null);
      }
    });

    return () => {
      if (channel) {
        console.log("Cleaning up global incoming call subscription for user:", user.id);
        channel.unsubscribe();
      }
    };
  }, [user]);

  async function answer() {
    if (!incomingCall) return;
    setLoading(true);
    setError(null);
    try {
      console.log("Answering call with ID:", incomingCall.id);
      
      // Save reference and clear state BEFORE navigating to avoid double component rendering
      const currentCall = incomingCall;
      const currentProfile = callerProfile;
      
      setIncomingCall(null);
      setCallerProfile(null);

      const updatedCall = await acceptCall(currentCall.id);
      const activeCall = updatedCall || { ...currentCall, status: "accepted" };

      navigate("/call", {
        state: {
          call: activeCall,
          partner: currentProfile || { display_name: "Kritikamukhia09" },
          isCaller: false,
        },
      });
    } catch (err) {
      console.error("Failed to answer call:", err);
      setError(err.message || "Failed to answer call");
    } finally {
      setLoading(false);
    }
  }

  async function decline() {
    if (!incomingCall) return;
    setLoading(true);
    setError(null);
    try {
      console.log("Declining call with ID:", incomingCall.id);
      await declineCall(incomingCall.id);
      setIncomingCall(null);
      setCallerProfile(null);
    } catch (err) {
      console.error("Failed to decline call:", err);
      setError(err.message || "Failed to decline call");
    } finally {
      setLoading(false);
    }
  }

  return {
    incomingCall,
    answer,
    decline,
    loading,
    error,
  };
}