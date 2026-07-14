import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

export default function MessageList({
  messages = [],
  currentUserId,
}) {
  const bottomRef = useRef(null);

  // Auto-scroll whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  if (!messages.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        No messages yet.
        <br />
        Start the conversation ❤️
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">

      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          mine={msg.sender_id === currentUserId}
          text={msg.message}
          createdAt={msg.created_at}
          seen={msg.seen}
        />
      ))}

      <div ref={bottomRef} />

    </div>
  );
}