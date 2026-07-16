import { useEffect, useState } from "react";
import { FiPhoneOff, FiMic, FiMicOff, FiVideo, FiVideoOff } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";

import {
  endCall,
  subscribeCallUpdates,
} from "../../services/call/callService";

export default function CallScreen() {
  const navigate = useNavigate();
  const location = useLocation();

  const { call, partner, isCaller } = location.state || {};

  const [callStatus, setCallStatus] = useState(
    isCaller ? "Calling..." : "Connecting..."
  );

  const [duration, setDuration] = useState(0);

  const [micEnabled, setMicEnabled] = useState(true);

  const [cameraEnabled, setCameraEnabled] = useState(true);

  //-------------------------------------------------
  // Timer
  //-------------------------------------------------

useEffect(() => {
  if (callStatus !== "Connected") return;

  const timer = setInterval(() => {
    setDuration((t) => t + 1);
  }, 1000);

  return () => clearInterval(timer);
}, [callStatus]);

  //-------------------------------------------------
  // Listen for call updates
  //-------------------------------------------------

  useEffect(() => {
    if (!call) return;

    const channel = subscribeCallUpdates(
      call.id,
      (updatedCall) => {
        if (updatedCall.status === "accepted") {
  setCallStatus("Connected");
  setDuration(0);
}

        if (
          updatedCall.status === "declined" ||
          updatedCall.status === "ended"
        ) {
          navigate("/chat");
        }
      }
    );

    return () => {
      channel.unsubscribe();
    };
  }, [call]);

  //-------------------------------------------------
  // End Call
  //-------------------------------------------------

  async function handleEndCall() {
    if (call) {
      await endCall(call.id);
    }

    navigate("/chat");
  }

  //-------------------------------------------------

  const minutes = String(
    Math.floor(duration / 60)
  ).padStart(2, "0");

  const seconds = String(
    duration % 60
  ).padStart(2, "0");

  //-------------------------------------------------

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col items-center justify-center">

      <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-5xl font-bold">

        {partner?.display_name?.charAt(0) || "P"}

      </div>

      <h1 className="text-3xl font-bold mt-8">

        {partner?.display_name}

      </h1>

      <p className="text-zinc-400 mt-2">

        {callStatus}

      </p>

      {callStatus === "Connected" && (
  <p className="text-lg mt-2">
    {minutes}:{seconds}
  </p>
)}

      <div className="flex gap-6 mt-16">

        <button
          onClick={() =>
            setMicEnabled(!micEnabled)
          }
          className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center"
        >
          {micEnabled ? (
            <FiMic size={24} />
          ) : (
            <FiMicOff size={24} />
          )}
        </button>

        <button
          onClick={() =>
            setCameraEnabled(!cameraEnabled)
          }
          className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center"
        >
          {cameraEnabled ? (
            <FiVideo size={24} />
          ) : (
            <FiVideoOff size={24} />
          )}
        </button>

        <button
          onClick={handleEndCall}
          className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center"
        >
          <FiPhoneOff size={28} />
        </button>

      </div>

    </div>
  );
}