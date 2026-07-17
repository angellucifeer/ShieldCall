import { useEffect, useRef, useState } from "react";
import { supabase } from "../services/supabase";

export default function useWebRTC(
    callId,
    isCaller,
    isVideoCall,
    callStatus
) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  
  const peerConnection = useRef(null);
  const localStreamRef = useRef(null);

  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  useEffect(() => {
    if (!callId) return;
    if (callStatus !== "accepted") {
    console.log("Waiting for call to be accepted...");
    return;
}

    let channel = null;

    async function initMediaAndWebRTC() {
      try {
        // Fetch current user ID once to prevent async racing conflicts inside loop
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id;
        
        if (!currentUserId) {
          console.error("No authenticated user found for WebRTC signaling.");
          return;
        }

        // 1. Capture local audio and video streams
      console.log("Opening camera/mic...");

const stream = await navigator.mediaDevices.getUserMedia({
  audio: true,
  video: isVideoCall,
});

console.log("Camera/mic opened successfully");

        setLocalStream(stream);
        localStreamRef.current = stream;

        // 2. Initialize the RTCPeerConnection object
        if (peerConnection.current) {
    peerConnection.current.close();
}
        peerConnection.current = new RTCPeerConnection(iceServers);

        // 3. Attach local media tracks to the peer connection
        stream.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, stream);
        });

        // 4. Handle incoming remote stream tracks
       peerConnection.current.ontrack = (event) => {

    console.log("Remote track received", event);

    if (event.streams.length > 0) {
        setRemoteStream(event.streams[0]);
    }

};

        // 5. Handle local ICE Candidate generation safely without async conflicts
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            console.log("Generated local ICE candidate:", event.candidate);
            supabase.from("call_signals").insert({
              call_id: callId,
              type: "candidate",
              payload: event.candidate.toJSON(),
              sender_id: currentUserId,
            }).then(({ error }) => {
              if (error) console.error("Error inserting ICE candidate:", error);
            });
          }
        };

        // 6. If you are the caller, create the WebRTC SDP Offer

        console.log("About to create offer");
console.log("isCaller =", isCaller);
console.log("callId =", callId);

        if (isCaller) {
          console.log("ENTERED OFFER BLOCK");
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          
          console.log("Caller sending SDP Offer...");

const { data, error } = await supabase
  .from("call_signals")
  .insert({
    call_id: callId,
    type: "offer",
    payload: offer,
    sender_id: currentUserId,
  })
  .select();

console.log("Offer insert result:", data);
console.log("Offer insert error:", error);
        }

        // 7. Subscribe to real-time signaling exchanges
channel = supabase
  .channel(`signaling:${callId}`)
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "call_signals",
      filter: `call_id=eq.${callId}`,
    },
    async (payload) => {
      const newSignal = payload.new;

      // Ignore your own signals
      if (newSignal.sender_id === currentUserId) return;

      console.log(
        `Received WebRTC Signal (${newSignal.type})`,
        newSignal
      );

      try {

        // ================= RECEIVER =================
        if (newSignal.type === "offer" && !isCaller) {

          console.log("========== RECEIVER ==========");
          console.log("Received OFFER");

          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(newSignal.payload)
          );

          console.log("Remote description set");

          const answer =
            await peerConnection.current.createAnswer();

          console.log("Answer created");

          await peerConnection.current.setLocalDescription(answer);

          console.log("Local description set");

          const { data, error } = await supabase
            .from("call_signals")
            .insert({
              call_id: callId,
              type: "answer",
              payload: answer,
              sender_id: currentUserId,
            });

          if (error) {
            console.error(error);
          }

          console.log("Answer sent");
        }

        // ================= CALLER =================
        else if (newSignal.type === "answer" && isCaller) {

          console.log("========== CALLER ==========");
          console.log("Received ANSWER");

          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(newSignal.payload)
          );

          console.log("Remote description applied");
        }

        // ================= ICE =================
        else if (newSignal.type === "candidate") {

          console.log("Received ICE candidate");

          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(newSignal.payload)
          );

          console.log("ICE candidate added");
        }

      } catch (err) {
        console.error("Signaling Error:", err);
      }
    }
  )
  .subscribe();

  const { data: signals } = await supabase
  .from("call_signals")
  .select("*")
  .eq("call_id", callId)
  .order("created_at", { ascending: true });

if (signals) {
  for (const signal of signals) {
    if (signal.sender_id === currentUserId) continue;

    console.log("Found existing signal:", signal.type);

    if (signal.type === "offer" && !isCaller) {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(signal.payload)
      );

      const answer = await peerConnection.current.createAnswer();

      await peerConnection.current.setLocalDescription(answer);

      await supabase.from("call_signals").insert({
        call_id: callId,
        type: "answer",
        payload: answer,
        sender_id: currentUserId,
      });
    }

    if (signal.type === "answer" && isCaller) {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(signal.payload)
      );
    }
  }
}

      } catch (err) {
        console.error("Failed to initialize WebRTC streams:", err);
      }
    }

    initMediaAndWebRTC();

    // Cleanup tracks and connections when unmounting
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      if (channel) {
    channel.unsubscribe();
}
    };
}, [callId, isCaller, callStatus, isVideoCall]);

  return { localStream, remoteStream };
}