import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listenIncomingCalls, acceptCall, declineCall } from "../services/call/callService";

export default function useCall(user) {
  const navigate = useNavigate();
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    // Listen for live database call rows targeting this user
    const channel = listenIncomingCalls(user.id, (callData) => {
      setIncomingCall(callData);
    });

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [user]);

  async function answer() {
    if (!incomingCall) return;
    try {
      await acceptCall(incomingCall.id);
      
      const activeCall = { ...incomingCall, status: "accepted" };
      setIncomingCall(null);

      // Route the receiver instantly to the Call Screen
      navigate("/call", {
        state: {
          call: activeCall,
          isCaller: false,
        },
      });
    } catch (err) {
      console.error("Failed to answer call:", err);
    }
  }

  async function decline() {
    if (!incomingCall) return;
    try {
      await declineCall(incomingCall.id);
      setIncomingCall(null);
    } catch (err) {
      console.error("Failed to decline call:", err);
    }
  }

  return {
    incomingCall,
    answer,
    decline,
  };
}