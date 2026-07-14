import { supabase } from "../supabase";

export async function createProfile(user) {
  // Check if profile already exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // If profile exists, make sure email stays updated
  if (existing) {
    if (existing.email !== user.email) {
      await supabase
        .from("profiles")
        .update({
          email: user.email,
          verified: !!user.email_confirmed_at,
        })
        .eq("id", user.id);
    }

    return existing;
  }

  const emailPrefix = user.email.split("@")[0];

  const username = emailPrefix.toLowerCase();

  const displayName =
    emailPrefix.charAt(0).toUpperCase() +
    emailPrefix.slice(1);

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,

      email: user.email,

      username,

      display_name: displayName,

      avatar_url: null,

      bio: "",

      country: "",

      status: "Available",

      partner_id: null,

      notification_token: null,

      online: true,

      verified: !!user.email_confirmed_at,

      theme: "dark",

      last_seen: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;

  return data;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updatePresence(userId, online, status = "online") {
  const { error } = await supabase
    .from("profiles")
    .update({
      is_online: online,
      status: online ? status : "offline",
      online: online, // Keeps compatibility with your existing code
      last_seen: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw error;
}