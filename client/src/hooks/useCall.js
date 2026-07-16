import { useEffect, useState } from "react";

import {
  listenIncomingCalls,
  acceptCall,
  declineCall,
  endCall,
} from "../services/call/callService";

export default function useCall(user) {

  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {

    if (!user) return;

    const channel = listenIncomingCalls(

      user.id,

      (call) => {

        console.log(
          "Incoming Call:",
          call
        );

        setIncomingCall(call);

      }

    );

    return () => {

      channel.unsubscribe();

    };

  }, [user]);

  //--------------------------------------------------
  // Accept
  //--------------------------------------------------

  async function answer() {

    if (!incomingCall) return;

    await acceptCall(
      incomingCall.id
    );

  }

  //--------------------------------------------------
  // Decline
  //--------------------------------------------------

  async function decline() {

    if (!incomingCall) return;

    await declineCall(
      incomingCall.id
    );

    setIncomingCall(null);

  }

  //--------------------------------------------------
  // End
  //--------------------------------------------------

  async function end() {

    if (!incomingCall) return;

    await endCall(
      incomingCall.id
    );

    setIncomingCall(null);

  }

  return {

    incomingCall,

    answer,

    decline,

    end,

  };

}