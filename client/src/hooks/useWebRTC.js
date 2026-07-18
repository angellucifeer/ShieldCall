import { useEffect, useRef, useState } from "react";
import { supabase } from "../services/supabase";

export default function useWebRTC(callId, isCaller, isVideoCall, callStatus) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  
  const peerConnection = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCandidates = useRef([]);

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

        // 1. Capture hardware tracks cleanly with iOS Audio constraints
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
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
          console.log("Sending Track:", track.kind, track.enabled, track.readyState);
          peerConnection.current.addTrack(track, stream);
        });

        // 3. Track listener explicitly catches incoming media tracks (iOS Optimized)
        peerConnection.current.ontrack = (event) => {
          console.log("CRITICAL: Remote track injected:", event.track.kind);

          if (event.streams && event.streams[0]) {
            setRemoteStream(event.streams[0]);
          } else {
            // Fallback for Safari if streams container array is evaluated as empty
            console.log("Constructing standalone media stream container fallback for iOS Safari");
            const fallbackStream = new MediaStream([event.track]);
            setRemoteStream(fallbackStream);
          }
        };

        // iOS Optimization: Force state re-evaluation on track mutation events
        peerConnection.current.onremovetrack = () => {
          console.log("Remote track removal sequence processed.");
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

              while (pendingCandidates.current.length > 0) {
                const candidate = pendingCandidates.current.shift();
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
              }
              
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
              while (pendingCandidates.current.length > 0) {
                const candidate = pendingCandidates.current.shift();
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
              }
            } 
            else if (signal.type === "candidate") {
              if (!peerConnection.current.remoteDescription) {
                console.log("Remote description not ready. Queueing ICE candidate.");
                pendingCandidates.current.push(signal.payload);
                return;
              }

              console.log("Adding ICE candidate");
              await peerConnection.current.addIceCandidate(new RTCIceCandidate(signal.payload));
            }
          } catch (err) {
            console.error("Signaling processing error:", err);
          }
        }

        // Listen for updates in call_signals
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