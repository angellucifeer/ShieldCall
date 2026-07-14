import { useAuth } from "../../context/AuthContext";
import { getLinkedPartner } from "../../services/partner/partnerService";

import { useEffect, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";

export default function Chat() {
  const { user } = useAuth();

  const [partner, setPartner] = useState(null);

  useEffect(() => {
    async function loadPartner() {
      if (!user) return;

      const data = await getLinkedPartner(user.id);

      setPartner(data);
    }

    loadPartner();
  }, [user]);

  if (!partner) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">

        Loading chat...

      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col">

      <ChatHeader partner={partner} />

      <MessageList />

      <ChatInput />

    </div>
  );
}