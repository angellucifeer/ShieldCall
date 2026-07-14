import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

export default function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    const confirmLogout = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmLogout) return;

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error(err);
      alert("Logout failed.");
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full mt-6 bg-red-600 hover:bg-red-700 transition rounded-2xl py-4 font-semibold flex items-center justify-center gap-3"
    >
      <FiLogOut size={20} />
      Logout
    </button>
  );
}