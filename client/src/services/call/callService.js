import { supabase } from "../supabase";

export async function startCall(
  callerId,
  receiverId,
  callType = "video"
) {

  const { data, error } = await supabase
    .from("call_invites")
    .insert({
      caller_id: callerId,
      receiver_id: receiverId,
      call_type: callType,
      status: "ringing",
    })
    .select()
    .single();

  if (error) throw error;

  return data;

}

// ==========================================
// Listen for incoming calls
// ==========================================

export function listenIncomingCalls(
  userId,
  callback
) {
  const channel = supabase.channel(
    `incoming-call-${userId}`
  );

  channel.on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "call_invites",
      filter: `receiver_id=eq.${userId}`,
    },
    (payload) => {

      if (payload.eventType === "DELETE") return;

callback(payload.new);

    }
  );

  channel.subscribe();

  return channel;
}
// ==========================================
// Accept Call
// ==========================================

export async function acceptCall(callId) {

  const { data, error } = await supabase
    .from("call_invites")
    .update({
      status: "accepted",
      answered_at: new Date().toISOString(),
    })
    .eq("id", callId)
    .select()
    .single();

  if (error) throw error;

  return data;
}
// ==========================================
// Decline Call
// ==========================================

export async function declineCall(callId) {

  const { data, error } = await supabase
    .from("call_invites")
    .update({
      status: "declined",
      ended_at: new Date().toISOString(),
    })
    .eq("id", callId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

// ==========================================
// End Call
// ==========================================

export async function endCall(callId) {

  const { data, error } = await supabase
    .from("call_invites")
    .update({
      status: "ended",
      ended_at: new Date().toISOString(),
    })
    .eq("id", callId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

// ==========================================
// Realtime Call Updates
// ==========================================

export function subscribeCallUpdates(
  callId,
  callback
) {
  const channel = supabase.channel(
    `call-${callId}`
  );

  channel.on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "call_invites",
      filter: `id=eq.${callId}`,
    },
    (payload) => {
      callback(payload.new);
    }
  );

  channel.subscribe();

  return channel;
}

// ==========================================
// Initiate a New Call Invite
// ==========================================
export async function initiateCall(conversationId, receiverId, callType) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("call_invites")
      .insert([
        {
          conversation_id: conversationId,
          sender_id: user.id,
          receiver_id: receiverId,
          status: "ringing", // initial status
          type: callType,    // 'voice' or 'video'
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return { call: data, error: null };
  } catch (error) {
    console.error("Error initiating call:", error);
    return { call: null, error };
  }
}

// ==========================================
// Listen for incoming calls for a specific user
// ==========================================
export function subscribeIncomingCalls(userId, onIncomingCall) {
  const channel = supabase
    .channel(`incoming-calls-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "call_invites",
        filter: `receiver_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new && payload.new.status === "ringing") {
          onIncomingCall(payload.new);
        }
      }
    )
    .subscribe();

  return channel;
}