import { supabase } from "../supabase";

export async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);

  return { data, error };
}