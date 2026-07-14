import { FiArrowLeft, FiPhone, FiVideo } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function ChatHeader({ partner }) {
  const navigate = useNavigate();

  const initials =
    partner?.display_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "P";

  const online = partner?.is_online ?? partner?.online ?? false;

  return (
    <div className="sticky top-0 z-20 bg-zinc-900 border-b border-zinc-800 px-4 py-3">

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">

          <button
            onClick={() => navigate("/home")}
            className="hover:text-blue-400"
          >
            <FiArrowLeft size={22} />
          </button>

          <div className="relative">

            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center font-bold">

              {initials}

            </div>

            <div
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-900 ${
                online ? "bg-green-500" : "bg-zinc-500"
              }`}
            />

          </div>

          <div>

            <h2 className="font-semibold text-white">
              {partner?.display_name}
            </h2>

            <p className="text-xs text-zinc-400">
              {online ? "Online" : "Offline"}
            </p>

          </div>

        </div>

        <div className="flex gap-3">

          <button className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center">

            <FiPhone />

          </button>

          <button className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center">

            <FiVideo />

          </button>

        </div>

      </div>

    </div>
  );
}