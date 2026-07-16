import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

export default function MessageList({
  messages = [],
  currentUserId,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 text-center px-6">
        <div>
          <div className="text-5xl mb-4">💬</div>

          <h2 className="text-lg font-semibold text-white">
            No messages yet
          </h2>

          <p className="mt-2">
            Start your first conversation ❤️
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
      {messages.map((msg) => (
        <MessageBubble
    key={msg.id}
    mine={msg.sender_id === currentUserId}
    text={msg.message}
    createdAt={msg.created_at}
    delivered={msg.delivered}
    seen={msg.seen}
/>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}