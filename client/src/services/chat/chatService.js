import { supabase } from "../supabase";

/**
 * Get conversation between two partners
 */
export async function getConversation(userId) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("partner_id")
    .eq("id", userId)
    .single();

  if (profileError) throw profileError;

  if (!profile.partner_id) return null;

  const userOne =
    userId < profile.partner_id
      ? userId
      : profile.partner_id;

  const userTwo =
    userId < profile.partner_id
      ? profile.partner_id
      : userId;

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_one", userOne)
    .eq("user_two", userTwo)
    .single();

  if (error) throw error;

  return data;
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
  const { error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      message: text,
    });

  if (error) throw error;
}

/**
 * Mark Seen
 */
export async function markSeen(conversationId) {
  const { error } = await supabase
    .from("messages")
    .update({
      seen: true,
    })
    .eq("conversation_id", conversationId)
    .eq("seen", false);

  if (error) throw error;
}

/**
 * Realtime Subscription
 */
export function subscribeMessages(
  conversationId,
  callback
) {
  return supabase
    .channel("messages-" + conversationId)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages",
        filter:
          "conversation_id=eq." +
          conversationId,
      },
      callback
    )
    .subscribe();
}