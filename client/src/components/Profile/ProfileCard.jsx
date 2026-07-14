import { FiCheckCircle, FiEdit2, FiMail } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

export default function ProfileCard() {
  const { user } = useAuth();

  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "User";

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-lg">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

        {/* Left Side */}
        <div className="flex items-center gap-5">

          {/* Avatar */}
          <div className="relative">

            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
              {initial}
            </div>

            <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-zinc-900"></div>

          </div>

          {/* User Info */}
          <div>

            <div className="flex items-center gap-2 flex-wrap">

              <h2 className="text-2xl font-bold text-white">
                {displayName}
              </h2>

              <span className="flex items-center gap-1 text-green-400 text-sm bg-green-500/10 px-2 py-1 rounded-full">

                <FiCheckCircle size={14} />

                Verified

              </span>

            </div>

            <div className="flex items-center gap-2 text-zinc-400 mt-2">

              <FiMail />

              <span className="break-all">
                {user?.email}
              </span>

            </div>

            <div className="flex items-center gap-2 mt-3">

              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>

              <span className="text-green-400 font-medium">
                Available
              </span>

            </div>

          </div>

        </div>

        {/* Right Side */}
        <div className="flex justify-start md:justify-end">

          <button
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition-all duration-200 px-5 py-3 rounded-xl font-medium"
            onClick={() => alert("Edit Profile coming soon")}
          >
            <FiEdit2 />

            Edit Profile
          </button>

        </div>

      </div>

    </div>
  );
}