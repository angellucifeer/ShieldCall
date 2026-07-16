import { supabase } from "../supabase";

/**
 * Get conversation between two partners
 */
export async function getConversation(userId) {
  // Get partner
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("partner_id")
    .eq("id", userId)
    .single();

  if (profileError) throw profileError;

  if (!profile.partner_id) return null;

  // Keep users in fixed order
  const userOne =
    userId < profile.partner_id
      ? userId
      : profile.partner_id;

  const userTwo =
    userId < profile.partner_id
      ? profile.partner_id
      : userId;

  // Look for existing conversation
  const {
    data: existingConversation,
    error: searchError,
  } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_one", userOne)
    .eq("user_two", userTwo)
    .maybeSingle();

  if (searchError) throw searchError;

  // Found one
  if (existingConversation) {
    return existingConversation;
  }

  console.log("Creating new conversation...");

  // Create a new conversation
  const {
    data: newConversation,
    error: insertError,
  } = await supabase
    .from("conversations")
    .insert({
      user_one: userOne,
      user_two: userTwo,
    })
    .select()
    .single();

  if (insertError) throw insertError;

  return newConversation;
}

/**
 * Load Messages
 */
export async function getMessages(conversationId) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data;
}

/**
 * Send Message
 */
export async function sendMessage(
  conversationId,
  senderId,
  text
) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      message: text,
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    throw error;
  }

  return data;
}

/**
 * Mark all incoming messages as delivered
 */
export async function markDelivered(messageId) {
  const { error } = await supabase
    .from("messages")
    .update({
      delivered: true,
    })
    .eq("id", messageId);

  if (error) throw error;
}

export async function markSeen(messageId) {
  const { error } = await supabase
    .from("messages")
    .update({
      seen: true,
    })
    .eq("id", messageId);

  if (error) throw error;
}

/**
 * Realtime Subscription
 */
export function subscribeMessages(
  conversationId,
  callback
) {
  const channel = supabase.channel(
    `messages-${conversationId}`
  );

  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "messages",
      filter: `conversation_id=eq.${conversationId}`,
    },
    (payload) => {
      callback(payload);
    }
  );

  channel.subscribe();

  return channel;
}