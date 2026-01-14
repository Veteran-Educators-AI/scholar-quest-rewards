import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "student" | "teacher" | "parent";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRole: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Fetch user role from database
  const fetchUserRole = useCallback(async (userId: string): Promise<UserRole> => {
    try {
      const { data: userRoleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();
      return (userRoleData?.role as UserRole) || "student";
    } catch {
      return "student";
    }
  }, []);

  // Initial session check - run once
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (initialSession?.user) {
          setSession(initialSession);
          const role = await fetchUserRole(initialSession.user.id);
          if (mounted) {
            setUserRole(role);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
          setInitialCheckDone(true);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [fetchUserRole]);

  // Auth state change listener - set up after initial check
  useEffect(() => {
    if (!initialCheckDone) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (event === "SIGNED_IN" && newSession?.user) {
          setSession(newSession);
          const role = await fetchUserRole(newSession.user.id);
          setUserRole(role);
        } else if (event === "SIGNED_OUT") {
          setSession(null);
          setUserRole(null);
        } else if (event === "TOKEN_REFRESHED" && newSession) {
          setSession(newSession);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [initialCheckDone, fetchUserRole]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserRole(null);
  }, []);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    userRole,
    isLoading,
    isAuthenticated: !!session,
    signOut,
  }), [session, userRole, isLoading, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
