import { useState } from "react";

import { useAuth } from "../../context/AuthContext";

import {
  searchUserByEmail,
  sendPartnerRequest,
} from "../../services/partner/partnerService";

export default function PartnerSearch() {
  const { user } = useAuth();

  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSearch() {
    setLoading(true);
    setMessage("");
    setResult(null);

    try {
      const profile = await searchUserByEmail(email);

      if (profile.id === user.id) {
        setMessage("You cannot add yourself.");
      } else {
        setResult(profile);
      }
    } catch {
      setMessage("No user found.");
    }

    setLoading(false);
  }

  async function handleSendRequest() {
  try {
    await sendPartnerRequest(email);

    setMessage("❤️ Partner request sent successfully.");

    setResult(null);
    setEmail("");
  } catch (err) {
    setMessage(err.message);
  }
}

  return (
    <div className="bg-zinc-900 rounded-xl p-6 mt-6">

      <h2 className="text-xl font-semibold mb-4">
        Add Partner
      </h2>

      <div className="flex gap-3">

        <input
          type="email"
          placeholder="Partner email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-lg bg-zinc-800 px-4 py-3 outline-none"
        />

        <button
          onClick={handleSearch}
          className="bg-blue-600 px-5 rounded-lg"
        >
          {loading ? "..." : "Search"}
        </button>

      </div>

      {message && (
        <p className="mt-4 text-sm text-zinc-300">
          {message}
        </p>
      )}

      {result && (
        <div className="mt-5 bg-zinc-800 rounded-lg p-4">

          <h3 className="font-semibold">
            {result.display_name}
          </h3>

          <p className="text-zinc-400">
            {result.email}
          </p>

          <button
            onClick={handleSendRequest}
            className="mt-4 bg-green-600 px-4 py-2 rounded-lg"
          >
            Send Partner Request
          </button>

        </div>
      )}

    </div>
  );
}