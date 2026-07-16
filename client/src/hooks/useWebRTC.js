import { useEffect, useRef, useState } from "react";
import { supabase } from "../services/supabase";

export default function useWebRTC(callId, isCaller) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  
  const peerConnection = useRef(null);
  const localStreamRef = useRef(null);

  // Standard public Google STUN servers for NAT traversal
  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  useEffect(() => {
    if (!callId) return;

    async function initMediaAndWebRTC() {
      try {
        // 1. Capture local audio and video streams
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        setLocalStream(stream);
        localStreamRef.current = stream;

        // 2. Initialize the RTCPeerConnection object
        peerConnection.current = new RTCPeerConnection(iceServers);

        // 3. Attach local media tracks to the peer connection
        stream.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, stream);
        });

        // 4. Handle incoming remote stream tracks
        peerConnection.current.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            setRemoteStream(event.streams[0]);
          }
        };

        // 5. Handle local ICE Candidate generation and upload them to Supabase
        peerConnection.current.onicecandidate = async (event) => {
          if (event.candidate) {
            console.log("Generated local ICE candidate:", event.candidate);
            await supabase.from("call_signals").insert({
              call_id: callId,
              type: "candidate",
              payload: event.candidate.toJSON(),
              sender_id: (await supabase.auth.getUser()).data.user?.id,
            });
          }
        };

        // 6. If you are the caller, create the WebRTC SDP Offer
        if (isCaller) {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          
          console.log("Caller sending SDP Offer...");
          await supabase.from("call_signals").insert({
            call_id: callId,
            type: "offer",
            payload: offer,
            sender_id: (await supabase.auth.getUser()).data.user?.id,
          });
        }

        // 7. Subscribe to real-time signaling exchanges from the database
        subscribeToSignalingChannel();

      } catch (err) {
        console.error("Failed to initialize WebRTC streams:", err);
      }
    }

    // Subscribe to incoming database signals (Offers, Answers, and Candidates)
    function subscribeToSignalingChannel() {
      const channel = supabase
        .channel(`signaling:${callId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "call_signals", filter: `call_id=eq.${callId}` },
          async (payload) => {
            const currentUserId = (await supabase.auth.getUser()).data.user?.id;
            const newSignal = payload.new;

            // Ignore signals sent by yourself
            if (newSignal.sender_id === currentUserId) return;

            console.log(`Received WebRTC Signal (${newSignal.type}):`, newSignal);

            try {
              if (newSignal.type === "offer" && !isCaller) {
                // Receiver handling the offer
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(newSignal.payload));
                const answer = await peerConnection.current.createAnswer();
                await peerConnection.current.setLocalDescription(answer);

                await supabase.from("call_signals").insert({
                  call_id: callId,
                  type: "answer",
                  payload: answer,
                  sender_id: currentUserId,
                });
              } else if (newSignal.type === "answer" && isCaller) {
                // Caller handling the answer
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(newSignal.payload));
              } else if (newSignal.type === "candidate") {
                // Add trickle ICE candidate to connection
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(newSignal.payload));
              }
            } catch (err) {
              console.error("Error processing incoming signaling data:", err);
            }
          }
        )
        .subscribe();

      return channel;
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
      supabase.channel(`signaling:${callId}`).unsubscribe();
    };
  }, [callId, isCaller]);

  return { localStream, remoteStream };
}