import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { useAuth } from "../../context/AuthContext";

export default function Splash() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      if (user) {
        navigate("/home", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <div className="text-7xl mb-6">🛡️</div>

        <h1 className="text-5xl font-bold text-white">
          ShieldCall
        </h1>

        <p className="text-zinc-400 mt-4 text-lg">
          Secure • Private • Encrypted
        </p>

        <div className="mt-12">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </motion.div>
    </div>
  );
}