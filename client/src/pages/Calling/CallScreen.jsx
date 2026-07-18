import { useEffect, useState, useRef } from "react";
import { FiPhoneOff, FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhone, FiVolume2, FiVolumeX } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import { endCall, acceptCall, declineCall, subscribeCallUpdates } from "../../services/call/callService";
import { supabase } from "../../services/supabase";
import useWebRTC from "../../hooks/useWebRTC";

export default function CallScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { call: initialCall, partner: initialPartner, isCaller: initialIsCaller } = location.state || {};

  const [currentCall, setCurrentCall] = useState(initialCall);
  const [myId, setMyId] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(initialPartner || null);
  
  const [duration, setDuration] = useState(0);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);

  // Sync initial state updates cleanly
  useEffect(() => {
    if (initialCall) setCurrentCall(initialCall);
  }, [initialCall]);

  // Fetch current authenticating identity early 
  useEffect(() => {
    async function getCurrentUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setMyId(data.user.id);
    }
    getCurrentUser();
  }, []);

  const callStatus = currentCall?.status;
  const isConnected = callStatus === "accepted" || callStatus === "Connected";
  const isRinging = callStatus === "ringing";
  const isVideoCall = currentCall?.type === "video" || currentCall?.call_type === "video";

  // Control camera default initialization state based on dynamic call metadata
  useEffect(() => {
    setCameraEnabled(isVideoCall);
  }, [isVideoCall]);

  // Derive caller/receiver states cleanly on every status snapshot update
  const isActualCaller = initialIsCaller ?? (myId ? currentCall?.caller_id === myId : false);
  const isIncomingCallPending = !isActualCaller && isRinging;

  const { localStream, remoteStream } = useWebRTC(
    currentCall?.id,
    isActualCaller,
    isVideoCall,
    callStatus
  );
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const audioPlaybackRef = useRef(null);


  const [previewPosition, setPreviewPosition] = useState({
  x: window.innerWidth - 170,
  y: 30,
});

const [snapSide, setSnapSide] = useState(null);
const dragRef = useRef(false);
const dragOffset = useRef({
  x: 0,
  y: 0,
});

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

  // iOS/Safari Audio Context Binding Fix
  useEffect(() => {
  if (!audioPlaybackRef.current) return;
  if (!remoteStream) return;

  const audio = audioPlaybackRef.current;

  audio.srcObject = remoteStream;
  audio.autoplay = true;
  audio.muted = false;
  audio.volume = 1.0;

  const playAudio = async () => {
    try {
      await audio.play();
      console.log("Remote audio started");
    } catch (err) {
      console.error("Audio play failed", err);
    }
  };

  playAudio();
}, [remoteStream]);

  // Hardware control track syncs
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = micEnabled);
    }
  }, [micEnabled, localStream]);

  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = cameraEnabled;
      });
    }
  }, [cameraEnabled, localStream]);

  // Fetch partner profile information cleanly
  useEffect(() => {
    async function fetchPartnerDetails() {
      if (!currentCall || !myId) return;
      const targetUserId = currentCall.caller_id === myId ? currentCall.receiver_id : currentCall.caller_id;
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

    if (!partnerProfile && myId) {
      fetchPartnerDetails();
    }
  }, [currentCall, myId, partnerProfile]);

  // Call duration counter setup
  useEffect(() => {
    if (!isConnected || !currentCall?.answered_at) return;
    const answeredAt = new Date(currentCall.answered_at).getTime();
    
    const updateTimer = () => {
      setDuration(Math.floor((Date.now() - answeredAt) / 1000));
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isConnected, currentCall?.answered_at]);

  // Supabase Realtime Call Update Channel Subscriber
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

  const startDrag = (e) => {
  dragRef.current = true;

  const point = e.touches ? e.touches[0] : e;

  dragOffset.current = {
    x: point.clientX - previewPosition.x,
    y: point.clientY - previewPosition.y,
  };
};

// 👇 ADD THIS HERE
const onDrag = (e) => {
  if (!dragRef.current) return;

  const point = e.touches ? e.touches[0] : e;

  const previewWidth = window.innerWidth >= 768 ? 160 : 128;
  const previewHeight = window.innerWidth >= 768 ? 224 : 192;

  const margin = 10;
  const bottomReservedSpace =
  window.innerWidth < 768 ? 180 : 140;

  const minX = margin;
  const maxX = window.innerWidth - previewWidth - margin;

  const minY = 20;
  const maxY =
    window.innerHeight -
    previewHeight -
    bottomReservedSpace;

  let newX = point.clientX - dragOffset.current.x;
  let newY = point.clientY - dragOffset.current.y;

  newX = Math.max(minX, Math.min(maxX, newX));
  newY = Math.max(minY, Math.min(maxY, newY));

  setPreviewPosition({
    x: newX,
    y: newY,
  });
};

const stopDrag = () => {
  dragRef.current = false;

  const previewWidth = window.innerWidth >= 768 ? 160 : 128;

  let x = previewPosition.x;
  let side = null;

  if (x < window.innerWidth / 2) {
    x = 10;
    side = "left";
  } else {
    x = window.innerWidth - previewWidth - 10;
    side = "right";
  }

  setSnapSide(side);

  setPreviewPosition((prev) => ({
    ...prev,
    x,
  }));
};

  const minutes = String(Math.floor(duration / 60)).padStart(2, "0");
  const seconds = String(duration % 60).padStart(2, "0");
  const partnerName = partnerProfile?.display_name || "Partner";
  const avatarLetter = partnerName.charAt(0).toUpperCase();

  return (
    <div className="relative h-screen bg-zinc-950 text-white flex flex-col items-center justify-center overflow-hidden">
      
      {/* Remote Video Stream display or Audio avatar backdrop */}
      {isVideoCall && isConnected && remoteStream ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      ) : (
        <div className="flex flex-col items-center z-10">
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-5xl font-bold shadow-xl animate-pulse">
            {avatarLetter}
          </div>
          <h1 className="text-3xl font-bold mt-8 tracking-wide">{partnerName}</h1>
          <p className="text-zinc-400 mt-2 font-medium tracking-wider text-sm bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">
            {isConnected ? "Connected" : isIncomingCallPending ? "Incoming Call..." : isRinging ? "Calling..." : callStatus}
          </p>
          {isConnected && (
            <p className="text-xl font-mono mt-4 bg-zinc-900 px-4 py-1.5 rounded-xl border border-zinc-800 text-cyan-400">
              {minutes}:{seconds}
            </p>
          )}
        </div>
      )}

      {/* Local Webcam Picture-in-Picture Frame Layer */}
{isVideoCall && localStream && cameraEnabled && (
  <div
  style={{
    left: previewPosition.x,
    top: previewPosition.y,
    touchAction: "none",
    WebkitUserSelect: "none",
  }}
  className="absolute z-20
w-32 h-48
md:w-40 md:h-56
rounded-2xl
overflow-hidden
border-2
border-zinc-800
shadow-2xl
bg-zinc-900
transition-all
duration-300"
  onMouseDown={startDrag}
  onMouseMove={onDrag}
  onMouseUp={stopDrag}

  onTouchStart={(e) => {
    e.preventDefault();
    startDrag(e);
  }}
  onTouchMove={(e) => {
    e.preventDefault();
    onDrag(e);
  }}
  onTouchEnd={stopDrag}
>
  <video
    ref={localVideoRef}
    autoPlay
    playsInline
    muted
    className="w-full h-full object-cover scale-x-[-1]"
  />
</div>
)}

      {/* Control Actions Tray Overlay */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-30 bg-zinc-900/40 backdrop-blur-lg px-6 py-4 rounded-3xl border border-zinc-800/50 shadow-2xl">
        
        {/* Toggle Audio Track Mute Status */}
        <button
          onClick={() => setMicEnabled(!micEnabled)}
          className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-200 ${
            micEnabled ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white" : "bg-red-500/20 border-red-500 text-red-500"
          }`}
        >
          {micEnabled ? <FiMic size={22} /> : <FiMicOff size={22} />}
        </button>

        {/* Loudspeaker toggle */}
        <button
          onClick={() => setSpeakerOn(!speakerOn)}
          disabled={!isConnected}
          className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-200 ${
            !isConnected ? "opacity-30 cursor-not-allowed" : ""
          } ${
            speakerOn ? "bg-green-600 border-green-500 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
          }`}
        >
          {speakerOn ? <FiVolume2 size={22} /> : <FiVolumeX size={22} />}
        </button>

        {/* Unified Call Lifecycle Controls */}
        {isIncomingCallPending ? (
          <>
            <button onClick={handleDecline} className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white hover:bg-red-700 shadow-lg">
              <FiPhoneOff size={26} />
            </button>
            <button onClick={handleAccept} className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-white hover:bg-green-700 shadow-lg">
              <FiPhone size={26} />
            </button>
          </>
        ) : (
          <button onClick={handleEndCall} className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white hover:bg-red-700 shadow-lg">
            <FiPhoneOff size={26} />
          </button>
        )}

        {/* Toggle Video Stream View mode */}
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

      {/* Hidden iOS Audio Stream Context Holder */}
      {/* FIXED AUDIO INJECTION LAYER FOR WIRELESS EARBUDS & LOUDSPEAKER ROUTING */}
<audio
  ref={audioPlaybackRef}
  autoPlay
  playsInline
  controls={false}
  muted={false}
  preload="auto"
  style={{
  position: "absolute",
  width: 0,
  height: 0,
  opacity: 0
}}
/>
    </div>
  );
}