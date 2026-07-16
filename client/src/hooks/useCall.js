import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listenIncomingCalls, acceptCall, declineCall } from "../services/call/callService";

export default function useCall(user) {
  const navigate = useNavigate();
  const [incomingCall, setIncomingCall] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    console.log("Subscribing to global incoming call channel for user:", user.id);

    // Listen for live database call rows targeting this user
    const channel = listenIncomingCalls(user.id, (callData) => {
      console.log("Incoming call received via Supabase Realtime:", callData);
      setIncomingCall(callData);
    });

    return () => {
      if (channel) {
        console.log("Cleaning up global incoming call subscription for user:", user.id);
        channel.unsubscribe();
      }
    };
  }, [user]);

  // Answer sequence for the receiver
  async function answer() {
    if (!incomingCall) return;
    setLoading(true);
    setError(null);
    try {
      console.log("Answering call with ID:", incomingCall.id);
      const updatedCall = await acceptCall(incomingCall.id);
      
      const activeCall = updatedCall || { ...incomingCall, status: "accepted" };
      setIncomingCall(null);

      // Route the receiver instantly to the Call Screen with state
      navigate("/call", {
        state: {
          call: activeCall,
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

  // Decline sequence for the receiver
  async function decline() {
    if (!incomingCall) return;
    setLoading(true);
    setError(null);
    try {
      console.log("Declining call with ID:", incomingCall.id);
      await declineCall(incomingCall.id);
      setIncomingCall(null);
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