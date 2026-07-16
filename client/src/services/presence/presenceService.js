  import { supabase } from "../supabase";

  let heartbeat = null;

  const HEARTBEAT_INTERVAL = 20000; // 20 seconds
  const ONLINE_TIMEOUT = 30000; // 30 seconds

  // ==========================================
  // Update Presence
  // ==========================================

  export async function updatePresence(userId) {
    const { error } = await supabase
      .from("profiles")
      .update({
        last_seen: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Presence Update:", error);
    }
  }

  // ==========================================
  // Start Heartbeat
  // ==========================================

  export function startHeartbeat(userId) {
    stopHeartbeat();

    updatePresence(userId);

    heartbeat = setInterval(() => {
      updatePresence(userId);
    }, HEARTBEAT_INTERVAL);
  }

  // ==========================================
  // Stop Heartbeat
  // ==========================================

  export function stopHeartbeat() {
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
  }

  // ==========================================
  // Optional
  // (No database update needed anymore)
  // ==========================================

  export function setOffline() {
    stopHeartbeat();
  }

  // ==========================================
  // Check if user is online
  // ==========================================

  export function isOnline(lastSeen) {
    if (!lastSeen) return false;

    const now = Date.now();
    const last = new Date(lastSeen).getTime();

    return now - last < 30000;
  }
  // ==========================================
  // Subscribe to partner presence
  // ==========================================

  export function subscribePresence(partnerId, callback) {
    const channel = supabase.channel(
      `presence-${partnerId}`
    );

    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "profiles",
        filter: `id=eq.${partnerId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    );

    channel.subscribe();

    return channel;
  }
