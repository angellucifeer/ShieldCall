import { FiBell, FiSettings } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function DashboardHeader() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const hour = new Date().getHours();

  let greeting = "Good Evening";

  if (hour < 12) greeting = "Good Morning";
  else if (hour < 17) greeting = "Good Afternoon";

  const displayName =
    user?.email?.split("@")[0]?.charAt(0).toUpperCase() +
      user?.email?.split("@")[0]?.slice(1) || "User";

  return (
    <header className="mb-8">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-lg">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

          {/* Left Side */}
          <div className="flex items-center gap-4">

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-3xl shadow-lg">
              🛡️
            </div>

            <div>

              <h1 className="text-3xl font-bold tracking-wide text-white">
                ShieldCall
              </h1>

              <p className="text-zinc-400 mt-1">
                {greeting},{" "}
                <span className="text-white font-medium">
                  {displayName}
                </span>
              </p>

              <p className="text-zinc-500 text-sm mt-1">
                Stay securely connected with your partner.
              </p>

            </div>

          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">

            <button
              onClick={() => alert("Notifications coming soon")}
              className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 transition-all duration-200 flex items-center justify-center"
            >
              <FiBell size={20} />
            </button>

            <button
              onClick={() => navigate("/settings")}
              className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 transition-all duration-200 flex items-center justify-center"
            >
              <FiSettings size={20} />
            </button>

          </div>

        </div>

      </div>
    </header>
  );
}