import { useState } from "react";
import { FiSend } from "react-icons/fi";

export default function ChatInput({ onSend }) {
  const [message, setMessage] = useState("");

  async function handleSend() {
    const text = message.trim();

    if (!text) return;

    try {
      await onSend(text);
      setMessage("");
    } catch (err) {
      console.error("Send Message Error:", err);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t border-zinc-800 bg-zinc-900 p-4">

      <div className="flex gap-3">

        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          type="text"
          placeholder="Type a message..."
          className="flex-1 bg-zinc-800 rounded-xl px-4 py-3 outline-none text-white"
        />

        <button
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-700 rounded-xl px-5 flex items-center justify-center"
        >
          <FiSend size={20} />
        </button>

      </div>

    </div>
  );
}