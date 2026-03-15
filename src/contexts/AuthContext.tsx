import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  language: string | null;
}

const ADMIN_EMAILS = ["jusperkato@gmail.com", "nadokaashraf@gmail.com"];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, profile: null, loading: true, isAdmin: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

async function ensureProfile(user: User) {
  const { data } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, phone, language")
    .eq("user_id", user.id)
    .single();
  if (!data) {
    await supabase.from("profiles").insert({
      user_id: user.id,
      display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || null,
      avatar_url: user.user_metadata?.avatar_url || null,
    });
    const { data: newProfile } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, phone, language")
      .eq("user_id", user.id)
      .single();
    return newProfile;
  }
  return data;
}

async function ensureAdminRole(user: User) {
  if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    const { data } = await supabase.from("user_roles").select("id").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!data) {
      await supabase.from("user_roles").insert({ user_id: user.id, role: "admin" });
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadUser = async (session: Session | null) => {
    setSession(session);
    setUser(session?.user ?? null);
    if (session?.user) {
      const p = await ensureProfile(session.user);
      setProfile(p);
      await ensureAdminRole(session.user);
      // Check admin from user_roles table
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!roleData);
    } else {
      setProfile(null);
      setIsAdmin(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setTimeout(() => loadUser(session), 0);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUser(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
