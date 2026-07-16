import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

import {
  getConversation,
  getMessages,
  sendMessage,
  subscribeMessages,
  markDelivered,
  markSeen,
} from "../services/chat/chatService";

import {
  subscribePresence,
  isOnline,
} from "../services/presence/presenceService";

import {
  getLinkedPartner,
} from "../services/partner/partnerService";

export default function useChat(user) {

  const [loading, setLoading] = useState(true);

  const [partner, setPartner] = useState(null);

  const [conversation, setConversation] = useState(null);

  const [messages, setMessages] = useState([]);

  useEffect(() => {

    if (!user) return;

    let messageChannel = null;
    let presenceChannel = null;

    async function initialize() {

      try {

        setLoading(true);

        //---------------------------------------
        // Partner
        //---------------------------------------

        const partnerData = await getLinkedPartner(user.id);

        setPartner(partnerData);

        //---------------------------------------
        // Presence Subscription
        //---------------------------------------

        if (partnerData) {

          presenceChannel = subscribePresence(
            partnerData.id,
            (updatedPartner) => {

              setPartner(prev => ({
                ...prev,
                ...updatedPartner,
              }));

            }
          );

        }

        //---------------------------------------
        // Conversation
        //---------------------------------------

        const convo = await getConversation(user.id);

        if (!convo) {

          setConversation(null);
          setMessages([]);

          return;

        }

        setConversation(convo);

        //---------------------------------------
        // History
        //---------------------------------------
const history = await getMessages(convo.id);

//--------------------------------------
// Mark all received messages delivered
//--------------------------------------

const undeliveredMessages = history.filter(

  msg =>
    msg.sender_id !== user.id &&
    !msg.delivered

);

for (const msg of undeliveredMessages) {

  await markDelivered(msg.id);

}

//--------------------------------------
// Chat is currently open,
// so mark unread messages as seen
//--------------------------------------

const unreadMessages = history.filter(

  msg =>
    msg.sender_id !== user.id &&
    !msg.seen

);

for (const msg of unreadMessages) {

  await markSeen(msg.id);

}

// Reload updated messages

const latestHistory =
  await getMessages(convo.id);

setMessages(latestHistory);

        //---------------------------------------
        // Chat Subscription
        //---------------------------------------

        messageChannel = subscribeMessages(
          convo.id,
          handleRealtime
        );

      }

      catch (err) {

        console.error(
          "useChat Error:",
          err
        );

      }

      finally {

        setLoading(false);

      }

    }

    initialize();

    //---------------------------------------
    // Cleanup
    //---------------------------------------

    return () => {

      if (messageChannel) {

        messageChannel.unsubscribe();

        supabase.removeChannel(
          messageChannel
        );

      }

      if (presenceChannel) {

        presenceChannel.unsubscribe();

        supabase.removeChannel(
          presenceChannel
        );

      }

    };

  }, [user]);

  //------------------------------------------------
  // Realtime
  //------------------------------------------------

  async function handleRealtime(payload) {

    const {
      eventType,
      new: newMessage,
      old,
    } = payload;

    switch (eventType) {

      // INSERT
      //------------------------------------
    case "INSERT":

  if (newMessage.sender_id !== user.id) {

    // Receiver has actually received the message
    console.log("Receiver received message:", newMessage.id);

await markDelivered(newMessage.id);

  }

  setMessages(prev => {

    const exists = prev.find(
      m => m.id === newMessage.id
    );

    if (exists) return prev;

    return [
      ...prev,
      newMessage,
    ];

  });

  break;

        setMessages(prev => {

          const exists = prev.find(
            m => m.id === newMessage.id
          );

          if (exists) return prev;

          return [
            ...prev,
            newMessage,
          ];

        });

        break;

      //------------------------------------
      // UPDATE
      //------------------------------------

      case "UPDATE":

        setMessages(prev =>
          prev.map(msg =>
            msg.id === newMessage.id
              ? newMessage
              : msg
          )
        );

        break;

      //------------------------------------
      // DELETE
      //------------------------------------

      case "DELETE":

        setMessages(prev =>
          prev.filter(
            msg =>
              msg.id !== old.id
          )
        );

        break;

      default:
        break;

    }

  }

  //------------------------------------------------
  // Send
  //------------------------------------------------

  async function send(text) {

    if (!conversation) return;

    try {

      await sendMessage(

        conversation.id,

        user.id,

        text

      );

    }

    catch (err) {

      console.error(err);

    }

  }

  return {

    loading,

    partner,

    conversation,

    messages,

    send,

    setMessages,

  };

}