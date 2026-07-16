import { useEffect, useState } from "react";
import { FiArrowLeft, FiPhone, FiVideo } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { isOnline } from "../../services/presence/presenceService";
import { startCall } from "../../services/call/callService";

export default function ChatHeader({ user, partner }) {
  const navigate = useNavigate();
  const [, forceUpdate] = useState(0);
  const [loadingCall, setLoadingCall] = useState(false); // Prevents multi-click spamming

  // Re-render interval to keep the "Last seen X seconds ago" counter active
  useEffect(() => {
    const timer = setInterval(() => {
      forceUpdate((v) => v + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const initials =
    partner?.display_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "P";

  const online = isOnline(partner?.last_seen);

  function getLastSeen(lastSeen) {
    if (!lastSeen) return "Offline";
    if (online) return "Online";

    const seconds = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 1000);

    if (seconds < 60) return `Last seen ${seconds} sec ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Last seen ${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Last seen ${hours} hour${hours > 1 ? "s" : ""} ago`;
    
    return `Last seen ${new Date(lastSeen).toLocaleString()}`;
  }

  // Unified Call Trigger Handler
  async function initiateCallTrigger(type) {
    if (!user?.id || !partner?.id || loadingCall) return;

    try {
      setLoadingCall(true);
      const call = await startCall(user.id, partner.id, type);

      // Navigate straight to the CallScreen, passing the call object AND partner metadata
      navigate("/call", {
        state: {
          call,
          partner, // Needed by CallScreen to render user profile data dynamically
          isCaller: true,
        },
      });
    } catch (err) {
      console.error(`Failed to start ${type} call:`, err);
      alert("Could not connect the call. Please try again.");
    } finally {
      setLoadingCall(false);
    }
  }

  return (
    <div className="sticky top-0 z-20 bg-zinc-900 border-b border-zinc-800 px-4 py-3">
      <div className="flex items-center justify-between">
        
        {/* Left Side: Avatar & Active Status Details */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/home")} className="hover:text-blue-400">
            <FiArrowLeft size={22} />
          </button>

          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-white">
              {initials}
            </div>
            <div
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-900 ${
                online ? "bg-green-500" : "bg-zinc-500"
              }`}
            />
          </div>

          <div>
            <h2 className="font-semibold text-white">{partner?.display_name}</h2>
            <p className="text-xs text-zinc-400">{getLastSeen(partner?.last_seen)}</p>
          </div>
        </div>

        {/* Right Side: Call Triggers */}
        <div className="flex gap-3">
          <button
            disabled={loadingCall}
            onClick={() => initiateCallTrigger("voice")}
            className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white disabled:opacity-50 transition-opacity"
          >
            <FiPhone />
          </button>

          <button
            disabled={loadingCall}
            onClick={() => initiateCallTrigger("video")}
            className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white disabled:opacity-50 transition-opacity"
          >
            <FiVideo />
          </button>
        </div>

      </div>
    </div>
  );
}