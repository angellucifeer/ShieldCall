import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiLock } from "react-icons/fi";

import Input from "../../components/Common/Input/Input";
import Button from "../../components/Common/Button/Button";

import { login } from "../../services/auth/login";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    setLoading(true);

    const { error } = await login(email, password);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    navigate("/home");
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">

      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm space-y-6"
      >

        <div className="text-center">

          <h1 className="text-4xl font-bold text-white">
            ShieldCall
          </h1>

          <p className="text-zinc-400 mt-2">
            Secure. Private. Encrypted.
          </p>

        </div>

        <Input
          label="Email"
          icon={<FiMail />}
          placeholder="Enter your email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <Input
          label="Password"
          type="password"
          icon={<FiLock />}
          placeholder="Enter password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
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
          Login
        </Button>

        <div className="text-center text-zinc-400 text-sm">

          Don't have an account?

          <Link
            to="/register"
            className="ml-2 text-blue-500"
          >
            Register
          </Link>

        </div>

      </form>

    </div>
  );
}