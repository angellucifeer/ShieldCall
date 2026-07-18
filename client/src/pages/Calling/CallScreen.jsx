import { useEffect, useState, useRef } from "react";
import { FiPhoneOff, FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhone } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import { endCall, acceptCall, declineCall, subscribeCallUpdates } from "../../services/call/callService";
import { supabase } from "../../services/supabase";
import useWebRTC from "../../hooks/useWebRTC";

export default function CallScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { call: initialCall, partner: initialPartner, isCaller } = location.state || {};

  const [currentCall, setCurrentCall] = useState(initialCall);
  useEffect(() => {
    if (initialCall) {
      setCurrentCall(initialCall);
    }
  }, [initialCall]);

  const callStatus = currentCall?.status;
  const isConnected = callStatus === "accepted" || callStatus === "Connected";
  const isRinging = callStatus === "ringing";
  
  const isVideoCall = currentCall?.type === "video" || currentCall?.call_type === "video";

  const [duration, setDuration] = useState(0);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(isVideoCall);
  const [partnerProfile, setPartnerProfile] = useState(initialPartner || null);
  const [myId, setMyId] = useState(null);

  useEffect(() => {
    async function getCurrentUser() {
      const { data } = await supabase.auth.getUser();
      setMyId(data.user?.id);
    }
    getCurrentUser();
  }, []);

  const { localStream, remoteStream } = useWebRTC(
    currentCall?.id,
    isCaller,
    isVideoCall,
    currentCall?.status
  );
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const audioPlaybackRef = useRef(null);

  // Bind local video element tracks
  useEffect(() => {
    if (localVideoRef.current && localStream && isVideoCall) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoCall]);

  // Bind remote video element tracks
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream && isVideoCall) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isVideoCall]);

  // FIX: Dynamic structural routing block explicitly attaching audio streams to the audio ref element node
 useEffect(() => {
  if (!audioPlaybackRef.current) return;
  if (!remoteStream) return;

  const audio = audioPlaybackRef.current;

  audio.srcObject = remoteStream;
  audio.muted = false;
  audio.volume = 1.0;

  const playAudio = async () => {
    try {
      await audio.play();
      console.log("Remote audio playing");
    } catch (err) {
      console.error("Audio play failed:", err);
    }
  };

  playAudio();
}, [remoteStream]);

  // Handle hardware muting controls
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = micEnabled);
    }
  }, [micEnabled, localStream]);

  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoCall && cameraEnabled;
      });
    }
  }, [cameraEnabled, localStream, isVideoCall]);

  useEffect(() => {
    setCameraEnabled(isVideoCall);
  }, [isVideoCall]);

  useEffect(() => {
    async function fetchPartnerDetails() {
      if (!currentCall) return;
      const targetUserId = isCaller ? currentCall.receiver_id : currentCall.caller_id;
      if (!targetUserId) return;

      try {
        const { data } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", targetUserId)
          .single();

        if (data) setPartnerProfile(data);
      } catch (err) {
        console.error("Error fetching partner details:", err);
      }
    }

    if (!partnerProfile) {
      fetchPartnerDetails();
    }
  }, [currentCall, isCaller, partnerProfile]);

  useEffect(() => {
    if (!isConnected) return;
    const answeredAt = new Date(currentCall.answered_at).getTime();
    const updateTimer = () => {
      const now = Date.now();
      setDuration(Math.floor((now - answeredAt) / 1000));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isConnected, currentCall?.answered_at]);

  useEffect(() => {
    if (!currentCall?.id) return;
    const channel = subscribeCallUpdates(currentCall.id, (updatedCall) => {
      setCurrentCall(updatedCall);
      if (updatedCall.status === "ended" || updatedCall.status === "declined") {
        navigate("/chat");
      }
    });
    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [currentCall?.id, navigate]);

  async function handleAccept() {
    if (!currentCall?.id) return;
    try {
      const updated = await acceptCall(currentCall.id);
      setCurrentCall(updated);
    } catch (err) {
      console.error("Error accepting call:", err);
    }
  }

  async function handleDecline() {
    if (!currentCall?.id) return;
    try {
      await declineCall(currentCall.id);
      navigate("/chat");
    } catch (err) {
      console.error("Error declining call:", err);
    }
  }

  async function handleEndCall() {
    if (!currentCall?.id) return;
    try {
      await endCall(currentCall.id);
      navigate("/chat");
    } catch (err) {
      console.error("Error ending call:", err);
    }
  }

  async function toggleCallType() {
    if (!currentCall?.id) return;
    const nextType = isVideoCall ? "voice" : "video";
    try {
      const { data, error } = await supabase
        .from("call_history")
        .update({ type: nextType })
        .eq("id", currentCall.id)
        .select()
        .single();

      if (error) throw error;
      if (data) setCurrentCall(data);
    } catch (err) {
      console.error("Failed to toggle call mode type:", err);
    }
  }

  const minutes = String(Math.floor(duration / 60)).padStart(2, "0");
  const seconds = String(duration % 60).padStart(2, "0");
  const partnerName = partnerProfile?.display_name || "Kritikamukhia09";
  const avatarLetter = partnerName.charAt(0).toUpperCase();
  const isIncomingCallPending = currentCall?.receiver_id === myId && currentCall?.status === "ringing";

  return (
    <div className="relative h-screen bg-zinc-950 text-white flex flex-col items-center justify-center overflow-hidden">
      
      {/* 1. Remote Layout Framework */}
      {isVideoCall && isConnected && remoteStream ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      ) : (
        /* Standby Audio UI Backdrop */
        <div className="flex flex-col items-center z-10">
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-5xl font-bold shadow-xl animate-pulse">
            {avatarLetter}
          </div>
          <h1 className="text-3xl font-bold mt-8 tracking-wide">{partnerName}</h1>
          <p className="text-zinc-400 mt-2 font-medium tracking-wider text-sm bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">
            {isConnected ? "Connected" : isRinging ? "Calling..." : callStatus}
          </p>
          {isConnected && (
            <p className="text-xl font-mono mt-4 bg-zinc-900 px-4 py-1.5 rounded-xl border border-zinc-800 text-cyan-400">
              {minutes}:{seconds}
            </p>
          )}
        </div>
      )}

      {/* 2. Self View Frame overlay */}
      {isVideoCall && localStream && cameraEnabled && (
        <div className="absolute top-6 right-6 w-32 h-48 md:w-40 md:h-56 rounded-2xl overflow-hidden border-2 border-zinc-800 shadow-2xl z-20 bg-zinc-900">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        </div>
      )}

      {/* 3. Controls Layout Container */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex items-center gap-6 z-30 bg-zinc-900/40 backdrop-blur-lg px-6 py-4 rounded-3xl border border-zinc-800/50 shadow-2xl">
        <button
          onClick={() => setMicEnabled(!micEnabled)}
          className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-200 ${
            micEnabled ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white" : "bg-red-500/20 border-red-500 text-red-500"
          }`}
        >
          {micEnabled ? <FiMic size={22} /> : <FiMicOff size={22} />}
        </button>

        {isIncomingCallPending ? (
          <>
            <button onClick={handleDecline} className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white"><FiPhoneOff size={26} /></button>
            <button onClick={handleAccept} className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-white"><FiPhone size={26} /></button>
          </>
        ) : (
          <button onClick={handleEndCall} className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white"><FiPhoneOff size={26} /></button>
        )}

        <button
          onClick={toggleCallType}
          disabled={!isConnected}
          className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-200 ${
            isVideoCall ? "bg-cyan-600 border-cyan-500 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-400"
          } ${!isConnected ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          {isVideoCall ? <FiVideo size={22} /> : <FiVideoOff size={22} />}
        </button>
      </div>

      {/* FIX: Unconditional persistent audio component rendering layout to support both voice and video fallback tracks instantly */}
      <audio
  ref={audioPlaybackRef}
  autoPlay
  playsInline
  controls={false}
  muted={false}
  className="hidden"
/>

    </div>
  );
}