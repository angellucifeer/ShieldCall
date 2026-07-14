import {
  FiMessageSquare,
  FiPhone,
  FiVideo,
  FiHeart,
} from "react-icons/fi";

import { useNavigate } from "react-router-dom";

export default function PartnerCard({ partner }) {
  const navigate = useNavigate();

  // No partner linked
  if (!partner) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-lg">

        <div className="text-center">

          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-5xl shadow-lg mb-6">
            💕
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">
            Your Partner
          </h2>

          <p className="text-zinc-400 max-w-md mx-auto leading-relaxed">
            You haven't connected with a partner yet.
            Search for your partner below and send an invitation.
          </p>

        </div>

      </div>
    );
  }

  const initials =
    partner.display_name
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "P";

  const isOnline = partner.is_online ?? partner.online ?? false;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-lg">

      {/* Header */}
      <div className="flex justify-center mb-6">

        <div className="flex items-center gap-2 bg-pink-500/10 text-pink-400 px-4 py-2 rounded-full text-sm font-medium">

          <FiHeart />

          <span>Your Partner</span>

        </div>

      </div>

      {/* Avatar */}
      <div className="flex justify-center">

        <div className="relative">

          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-4xl font-bold text-white shadow-xl">

            {initials}

          </div>

          <div
            className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-zinc-900 ${
              isOnline ? "bg-green-500" : "bg-zinc-500"
            }`}
          ></div>

        </div>

      </div>

      {/* Name */}
      <div className="text-center mt-6">

        <h2 className="text-2xl font-bold text-white">

          {partner.display_name}

        </h2>

        <p className="text-zinc-400 mt-2 break-all">

          {partner.email}

        </p>

        <div className="mt-4">

          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              isOnline
                ? "bg-green-500/10 text-green-400"
                : "bg-zinc-700 text-zinc-300"
            }`}
          >

            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isOnline
                  ? "bg-green-500 animate-pulse"
                  : "bg-zinc-400"
              }`}
            ></span>

            {isOnline ? "Online" : "Offline"}

          </span>

        </div>

      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-4 mt-8">

        {/* Chat */}
        <button
          onClick={() => navigate("/chat")}
          className="flex flex-col items-center justify-center gap-2 bg-zinc-800 hover:bg-blue-600 transition-all duration-300 rounded-2xl py-5"
        >
          <FiMessageSquare size={24} />

          <span className="text-sm font-medium">
            Chat
          </span>
        </button>

        {/* Voice */}
        <button
          onClick={() => navigate("/call?type=voice")}
          className="flex flex-col items-center justify-center gap-2 bg-zinc-800 hover:bg-green-600 transition-all duration-300 rounded-2xl py-5"
        >
          <FiPhone size={24} />

          <span className="text-sm font-medium">
            Voice
          </span>
        </button>

        {/* Video */}
        <button
          onClick={() => navigate("/call?type=video")}
          className="flex flex-col items-center justify-center gap-2 bg-zinc-800 hover:bg-purple-600 transition-all duration-300 rounded-2xl py-5"
        >
          <FiVideo size={24} />

          <span className="text-sm font-medium">
            Video
          </span>
        </button>

      </div>

    </div>
  );
}