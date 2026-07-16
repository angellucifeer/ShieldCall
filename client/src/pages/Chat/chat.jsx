import { useAuth } from "../../context/AuthContext";

import useChat from "../../hooks/useChat";

import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";

export default function Chat() {

  const { user } = useAuth();

  console.log("Chat.jsx user:", user);

  const {
    loading,
    partner,
    messages,
    send,
  } = useChat(user);

  console.log("Partner:", partner);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        Loading chat...
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        No partner linked.
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col">

      <ChatHeader
        user={user}
        partner={partner}
      />

      <MessageList
        messages={messages}
        currentUserId={user.id}
      />

      <ChatInput
        onSend={send}
      />

    </div>
  );
}