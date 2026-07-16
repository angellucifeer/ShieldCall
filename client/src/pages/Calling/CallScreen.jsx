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

  // Keep track of the live call object to monitor type upgrades (audio -> video)
  const [currentCall, setCurrentCall] = useState(initialCall);
  
  // Explicitly check for video types
  const isVideoCall = currentCall?.type === "video" || currentCall?.call_type === "video";

  const [callStatus, setCallStatus] = useState(
    initialCall?.status === "accepted" ? "Connected" : (isCaller ? "Calling..." : "Incoming Call")
  );
  
  const [duration, setDuration] = useState(0);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(isVideoCall);
  const [partnerProfile, setPartnerProfile] = useState(initialPartner || null);

  // Initialize WebRTC hook
  const { localStream, remoteStream } = useWebRTC(currentCall?.id, isCaller);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Bind video element streams
  useEffect(() => {
    if (localVideoRef.current && localStream && isVideoCall) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoCall]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream && isVideoCall) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isVideoCall]);

  // Handle hardware muting toggles
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

  // Sync initial camera state if call type changes live
  useEffect(() => {
    setCameraEnabled(isVideoCall);
  }, [isVideoCall]);

  // Fetch partner details if missing
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

  // Timer configuration
  useEffect(() => {
    if (callStatus !== "Connected") return;

    const timer = setInterval(() => {
      setDuration((t) => t + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [callStatus]);

  // Subscribe to real-time database updates for changes
  useEffect(() => {
    if (!currentCall?.id) return;

    const channel = subscribeCallUpdates(currentCall.id, (updatedCall) => {
      console.log("Realtime call row update:", updatedCall);
      setCurrentCall(updatedCall);
      
      if (updatedCall.status === "accepted") {
        setCallStatus("Connected");
      }
      if (updatedCall.status === "declined" || updatedCall.status === "ended") {
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
      setCallStatus("Connected"); // Set instantly to clear UI blocking states
      await acceptCall(currentCall.id);
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

  // Quick Switch: Function to dynamic toggle between Voice and Video modes mid-call
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

  // Strict local control checking for incoming screens
  const isIncomingCallPending = callStatus === "Incoming Call" && !isCaller;

  return (
    <div className="relative h-screen bg-zinc-950 text-white flex flex-col items-center justify-center overflow-hidden">
      
      {/* 1. Remote Viewport Media Player */}
      {isVideoCall && callStatus === "Connected" && remoteStream ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      ) : (
        /* Standby Audio Canvas Mode */
        <div className="flex flex-col items-center z-10">
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-5xl font-bold shadow-xl animate-pulse">
            {avatarLetter}
          </div>
          <h1 className="text-3xl font-bold mt-8 tracking-wide">{partnerName}</h1>
          <p className="text-zinc-400 mt-2 font-medium tracking-wider text-sm bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">
            {callStatus}
          </p>
          {callStatus === "Connected" && (
            <p className="text-xl font-mono mt-4 bg-zinc-900 px-4 py-1.5 rounded-xl border border-zinc-800 text-cyan-400">
              {minutes}:{seconds}
            </p>
          )}
        </div>
      )}

      {/* 2. Mini Self-View Frame */}
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

      {/* 3. Operational Overlay Tag */}
      {callStatus === "Connected" && isVideoCall && (
        <div className="absolute top-6 left-6 z-20 bg-zinc-950/70 backdrop-blur-md px-4 py-2 rounded-2xl border border-zinc-800 flex flex-col gap-0.5">
          <p className="font-semibold tracking-wide">{partnerName}</p>
          <p className="text-xs font-mono text-cyan-400">{minutes}:{seconds}</p>
        </div>
      )}

      {/* 4. Controls Footer Center Panel */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex items-center gap-6 z-30 bg-zinc-900/40 backdrop-blur-lg px-6 py-4 rounded-3xl border border-zinc-800/50 shadow-2xl">
        
        {/* Mic Toggle Button */}
        <button
          onClick={() => setMicEnabled(!micEnabled)}
          className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-200 ${
            micEnabled 
              ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white" 
              : "bg-red-500/20 border-red-500 text-red-500"
          }`}
        >
          {micEnabled ? <FiMic size={22} /> : <FiMicOff size={22} />}
        </button>

        {/* Call Management Buttons */}
        {isIncomingCallPending ? (
          <>
            <button
              onClick={handleDecline}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 flex items-center justify-center text-white transition-all shadow-lg"
            >
              <FiPhoneOff size={26} />
            </button>
            <button
              onClick={handleAccept}
              className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 active:scale-95 flex items-center justify-center text-white transition-all shadow-lg"
            >
              <FiPhone size={26} />
            </button>
          </>
        ) : (
          <button
            onClick={handleEndCall}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 flex items-center justify-center text-white transition-all shadow-lg"
          >
            <FiPhoneOff size={26} />
          </button>
        )}

        {/* Dynamic Upgrade Mode Switcher Button */}
        <button
          onClick={toggleCallType}
          disabled={callStatus !== "Connected"}
          className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-200 ${
            isVideoCall 
              ? "bg-cyan-600 border-cyan-500 hover:bg-cyan-700 text-white shadow-md shadow-cyan-500/20" 
              : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white"
          } ${callStatus !== "Connected" ? "opacity-40 cursor-not-allowed" : ""}`}
          title={isVideoCall ? "Switch to Audio Call" : "Switch to Video Call"}
        >
          {isVideoCall ? <FiVideo size={22} /> : <FiVideoOff size={22} />}
        </button>
      </div>
    </div>
  );
}