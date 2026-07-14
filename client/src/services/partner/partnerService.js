import { supabase } from "../supabase";

/**
 * Search user by email
 */
export async function searchUserByEmail(email) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (error) throw error;

  return data;
}

/**
 * Send partner request
 */
export async function sendPartnerRequest(receiverEmail) {
  const { data, error } = await supabase.rpc(
    "send_partner_request_rpc",
    {
      receiver_email: receiverEmail,
    }
  );

  console.log("RPC Data:", data);
  console.log("RPC Error:", error);

  if (error) {
    throw error;
  }

  return true;
}

/**
 * Incoming requests
 */
export async function getIncomingRequests(userId) {
  const { data, error } = await supabase
    .from("partner_requests")
    .select(`
      id,
      sender_id,
      receiver_id,
      status,
      created_at,
      sender:profiles!sender_id (
        id,
        display_name,
        username,
        email,
        avatar_url,
        online
      )
    `)
    .eq("receiver_id", userId)
    .eq("status", "pending");

  console.log("Incoming Requests:", data);

  if (error) {
    console.error(error);
    throw error;
  }

  return data;
}

/**
 * Accept request (RPC)
 */
export async function acceptPartnerRequest(requestId) {
  const { error } = await supabase.rpc(
    "accept_partner_request_rpc",
    {
      request_uuid: requestId,
    }
  );

  if (error) throw error;

  return true;
}

/**
 * Reject request
 */
export async function rejectPartnerRequest(requestId) {
  const { error } = await supabase
    .from("partner_requests")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) throw error;

  return true;
}

/**
 * Get linked partner
 */
export async function getLinkedPartner(userId) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("partner_id")
    .eq("id", userId)
    .single();

  if (profileError) throw profileError;

  if (!profile.partner_id) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profile.partner_id)
    .single();

  if (error) throw error;

  return data;
}

/**
 * Remove partner
 * (We'll implement this later.)
 */
export async function removePartner() {
  throw new Error("Not implemented yet.");
}