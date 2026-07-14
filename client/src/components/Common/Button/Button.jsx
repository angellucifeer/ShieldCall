import { motion } from "framer-motion";

export default function Button({
  children,
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  variant = "primary",
  className = "",
}) {
  const styles = {
    primary:
      "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white",

    secondary:
      "bg-zinc-800 hover:bg-zinc-700 text-white",

    danger:
      "bg-red-600 hover:bg-red-700 text-white",

    success:
      "bg-green-600 hover:bg-green-700 text-white",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.15 }}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        w-full
        h-12
        rounded-xl
        font-semibold
        transition-all
        duration-200
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${styles[variant]}
        ${className}
      `}
    >
      {loading ? "Please wait..." : children}
    </motion.button>
  );
}