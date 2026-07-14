import { supabase } from "../supabase";

export async function logout() {
  const { error } =
    await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}