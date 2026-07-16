import { useEffect, useState } from "react";
import { FiPhoneOff, FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhone } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import { endCall, acceptCall, declineCall, subscribeCallUpdates } from "../../services/call/callService";
import { supabase } from "../../services/supabase";

export default function CallScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { call, partner: initialPartner, isCaller } = location.state || {};

  // Track the ground truth call status from the database row
  const [callStatus, setCallStatus] = useState(
    call?.status === "accepted" ? "Connected" : (isCaller ? "Calling..." : "Incoming Call")
  );
  const [duration, setDuration] = useState(0);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [partnerProfile, setPartnerProfile] = useState(initialPartner || null);

  // -------------------------------------------------
  // Fetch Partner Profile details if missing
  // -------------------------------------------------
  useEffect(() => {
    async function fetchPartnerDetails() {
      if (!call) return;
      const targetUserId = isCaller ? call.receiver_id : call.caller_id;
      if (!targetUserId) return;

      try {
        const { data } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", targetUserId)
          .single();

        if (data) {
          setPartnerProfile(data);
        }
      } catch (err) {
        console.error("Error fetching partner details on call screen:", err);
      }
    }

    if (!partnerProfile) {
      fetchPartnerDetails();
    }
  }, [call, isCaller, partnerProfile]);

  // -------------------------------------------------
  // Call Timer logic
  // -------------------------------------------------
  useEffect(() => {
    if (callStatus !== "Connected") return;

    const timer = setInterval(() => {
      setDuration((t) => t + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [callStatus]);

  // -------------------------------------------------
  // Real-time updates subscription
  // -------------------------------------------------
  useEffect(() => {
    if (!call?.id) return;

    const channel = subscribeCallUpdates(call.id, (updatedCall) => {
      console.log("Realtime call update received in CallScreen:", updatedCall);
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
  }, [call, navigate]);

  // -------------------------------------------------
  // Action Handlers
  // -------------------------------------------------
  async function handleAccept() {
    if (!call?.id) return;
    try {
      await acceptCall(call.id);
      setCallStatus("Connected");
    } catch (err) {
      console.error("Error accepting call:", err);
    }
  }

  async function handleDecline() {
    if (!call?.id) return;
    try {
      await declineCall(call.id);
      navigate("/chat");
    } catch (err) {
      console.error("Error declining call:", err);
    }
  }

  async function handleEndCall() {
    if (!call?.id) return;
    try {
      await endCall(call.id);
      navigate("/chat");
    } catch (err) {
      console.error("Error ending call:", err);
    }
  }

  const minutes = String(Math.floor(duration / 60)).padStart(2, "0");
  const seconds = String(duration % 60).padStart(2, "0");

  const partnerName = partnerProfile?.display_name || "Kritikamukhia09";
  const avatarLetter = partnerName.charAt(0).toUpperCase();

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-5xl font-bold shadow-xl">
        {avatarLetter}
      </div>

      <h1 className="text-3xl font-bold mt-8 tracking-wide">
        {partnerName}
      </h1>
      
      <p className="text-zinc-400 mt-2 font-medium tracking-wider text-sm bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">
        {callStatus}
      </p>

      {/* Show timer if connected */}
      {callStatus === "Connected" && (
        <p className="text-xl font-mono mt-4 bg-zinc-900 px-4 py-1.5 rounded-xl border border-zinc-800 text-cyan-400">
          {minutes}:{seconds}
        </p>
      )}

      <div className="flex items-center gap-6 mt-16">
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

        {callStatus === "Incoming Call" ? (
          <>
            <button
              onClick={handleDecline}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 flex items-center justify-center text-white transition-all shadow-lg"
            >
              <FiPhoneOff size={26} />
            </button>
            <button
              onClick={handleAccept}
              className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 active:scale-95 flex items-center justify-center text-white transition-all shadow-lg animate-pulse"
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

        <button
          onClick={() => setCameraEnabled(!cameraEnabled)}
          className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-200 ${
            cameraEnabled 
              ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white" 
              : "bg-red-500/20 border-red-500 text-red-500"
          }`}
        >
          {cameraEnabled ? <FiVideo size={22} /> : <FiVideoOff size={22} />}
        </button>
      </div>
    </div>
  );
}