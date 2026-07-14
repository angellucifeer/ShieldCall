import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import {
  createProfile,
  updatePresence,
} from "../services/profile/profileService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Get Session Error:", error);
        }

        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            await createProfile(session.user);
            await updatePresence(session.user.id, true, "online");
          } catch (err) {
            console.error("Profile Initialization Error:", err);
          }
        }
      } catch (err) {
        console.error("Initialization Error:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      try {
        if (event === "SIGNED_IN" && session?.user) {
          await createProfile(session.user);
          await updatePresence(session.user.id, true, "online");
        }
      } catch (err) {
        console.error("Auth State Change Error:", err);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  async function logout() {
    try {
      if (user) {
        await updatePresence(user.id, false, "offline");
      }

      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setUser(null);
      setSession(null);
    } catch (err) {
      console.error("Logout Error:", err);
      throw err;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}