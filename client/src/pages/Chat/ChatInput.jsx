import { useState } from "react";
import { FiSend } from "react-icons/fi";

export default function ChatInput({ onSend }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    const text = message.trim();

    if (!text || sending) return;

    try {
      setSending(true);

      await onSend(text);

      setMessage("");

    } catch (err) {
      console.error("Send Message Error:", err);

    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }


  return (
    <div className="border-t border-zinc-800 bg-zinc-900 p-4">

      <div className="flex gap-3">

        <input
          value={message}
          onChange={(e)=>setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          placeholder="Type a message..."
          className="
            flex-1
            bg-zinc-800
            rounded-xl
            px-4
            py-3
            outline-none
            text-white
            disabled:opacity-50
          "
        />


        <button
          onClick={handleSend}
          disabled={sending}
          className="
            bg-blue-600
            hover:bg-blue-700
            disabled:opacity-50
            rounded-xl
            px-5
            flex
            items-center
            justify-center
          "
        >

          <FiSend size={20}/>

        </button>


      </div>

    </div>
  );
}