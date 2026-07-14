import { supabase } from "../supabase";

export async function getSession() {
  const { data, error } =
    await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}