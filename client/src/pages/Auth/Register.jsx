import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiLock } from "react-icons/fi";

import Input from "../../components/Common/Input/Input";
import Button from "../../components/Common/Button/Button";

import { register } from "../../services/auth/register";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e) {
    e.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const displayName = email.split("@")[0];

      const { data, error } = await register(
        email,
        password,
        displayName
      );

      if (error) {
        setError(error.message);
        return;
      }

      alert("Registration successful! Please check your email to verify your account.");

      navigate("/login");
    } catch (err) {
      console.error(err);
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-sm space-y-6"
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">
            Create Account
          </h1>

          <p className="text-zinc-400 mt-2">
            Start using ShieldCall
          </p>
        </div>

        <Input
          label="Email"
          icon={<FiMail />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
        />

        <Input
          label="Password"
          type="password"
          icon={<FiLock />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
        />

        <Input
          label="Confirm Password"
          type="password"
          icon={<FiLock />}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm password"
        />

        {error && (
          <p className="text-red-500 text-sm">
            {error}
          </p>
        )}

        <Button
          type="submit"
          loading={loading}
        >
          Create Account
        </Button>

        <div className="text-center text-zinc-400 text-sm">
          Already have an account?

          <Link
            to="/login"
            className="text-blue-500 ml-2"
          >
            Login
          </Link>
        </div>
      </form>
    </div>
  );
}