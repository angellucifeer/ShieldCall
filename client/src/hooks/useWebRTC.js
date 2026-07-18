import { useEffect, useRef, useState } from "react";
import { supabase } from "../services/supabase";

export default function useWebRTC(callId, isCaller, isVideoCall, callStatus) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  
  const peerConnection = useRef(null);
  const localStreamRef = useRef(null);

  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
    ],
  };

  useEffect(() => {
    if (!callId) return;
    
    const normalizedStatus = String(callStatus).toLowerCase();
    if (normalizedStatus !== "connected" && normalizedStatus !== "accepted") {
      console.log("Waiting for call to be accepted/connected before WebRTC...", callStatus);
      return;
    }

    let channel = null;
    const processedSignals = new Set();

    async function initMediaAndWebRTC() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id;
        
        if (!currentUserId) {
          console.error("No authenticated user found.");
          return;
        }

        // 1. Capture hardware media tracks cleanly
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isVideoCall,
        });

        console.log("Local camera/mic tracks captured successfully");
        setLocalStream(stream);
        localStreamRef.current = stream;

        if (peerConnection.current) {
          peerConnection.current.close();
        }
        
        peerConnection.current = new RTCPeerConnection(iceServers);

        // 2. Add local tracks to the connection frame
        stream.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, stream);
        });

        // 3. Track listener explicitly catches incoming media tracks
        peerConnection.current.ontrack = (event) => {
  console.log("CRITICAL: Remote track injected:", event.track.kind);

  console.log(
    "Remote Audio Tracks:",
    event.streams[0].getAudioTracks()
  );

  console.log(
    "Remote Video Tracks:",
    event.streams[0].getVideoTracks()
  );

  if (event.streams && event.streams[0]) {
    setRemoteStream(event.streams[0]);
  }
};

        // 4. Handle generating ICE candidates
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
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

        // Core central signal handler routine
        async function handleIncomingSignal(signal) {
          if (processedSignals.has(signal.id)) return;
          processedSignals.add(signal.id);

          try {
            if (signal.type === "offer" && !isCaller) {
              console.log("Receiver setting remote SDP offer...");
              await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal.payload));
              
              const answer = await peerConnection.current.createAnswer();
              await peerConnection.current.setLocalDescription(answer);

              await supabase.from("call_signals").insert({
                call_id: callId,
                type: "answer",
                payload: answer,
                sender_id: currentUserId,
              });
            } else if (signal.type === "answer" && isCaller) {
              console.log("Caller applying remote SDP answer...");
              await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal.payload));
            } else if (signal.type === "candidate") {
              console.log("Adding trickle ICE candidate...");
              await peerConnection.current.addIceCandidate(new RTCIceCandidate(signal.payload));
            }
          } catch (err) {
            console.error("Signaling processing error:", err);
          }
        }

        // FIX: Start listening BEFORE pushing offers/answers to eliminate the candidate race condition
        channel = supabase
          .channel(`signaling:${callId}`)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "call_signals", filter: `call_id=eq.${callId}` },
            (payload) => {
              if (payload.new.sender_id === currentUserId) return;
              handleIncomingSignal(payload.new);
            }
          )
          .subscribe(async (status) => {
            if (status === "SUBSCRIBED") {
              console.log("Signaling channel ready. Commencing SDP generation.");
              
              // If Caller, initialize the initial SDP offer inside the safe channel subscription scope
              if (isCaller) {
                const offer = await peerConnection.current.createOffer();
                await peerConnection.current.setLocalDescription(offer);
                
                await supabase.from("call_signals").insert({
                  call_id: callId,
                  type: "offer",
                  payload: offer,
                  sender_id: currentUserId,
                });
              }

              // Fetch any missed historical rows safely
              const { data: historicalSignals } = await supabase
                .from("call_signals")
                .select("*")
                .eq("call_id", callId)
                .order("created_at", { ascending: true });

              if (historicalSignals) {
                for (const signal of historicalSignals) {
                  if (signal.sender_id === currentUserId) continue;
                  await handleIncomingSignal(signal);
                }
              }
            }
          });

      } catch (err) {
        console.error("Failed to initialize WebRTC engine streams:", err);
      }
    }

    initMediaAndWebRTC();

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