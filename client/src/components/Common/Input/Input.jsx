import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function Input({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  icon,
  error,
  disabled = false,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";

  return (
    <div className="w-full space-y-2">

      {label && (
        <label className="text-sm text-zinc-300 font-medium">
          {label}
        </label>
      )}

      <div
        className={`
          flex
          items-center
          bg-zinc-900
          border
          rounded-xl
          px-4
          h-12
          transition-all
          ${
            error
              ? "border-red-500"
              : "border-zinc-700 focus-within:border-blue-500"
          }
        `}
      >
        {icon && (
          <div className="mr-3 text-zinc-400">
            {icon}
          </div>
        )}

        <input
          className="flex-1 bg-transparent outline-none text-white placeholder:text-zinc-500"
          type={isPassword ? (showPassword ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-zinc-400"
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}