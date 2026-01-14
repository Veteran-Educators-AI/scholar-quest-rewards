import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

const publicRoutes = ["/", "/auth", "/privacy-policy", "/terms-of-service"];

// Timeout for auth checks (5 seconds)
const AUTH_TIMEOUT_MS = 5000;

// Helper to check if user is on the wrong dashboard for their role
const isOnWrongDashboard = (pathname: string, role: string): boolean => {
  if (role === "teacher" && pathname.startsWith("/student")) return true;
  if (role === "teacher" && pathname.startsWith("/parent")) return true;
  if (role === "student" && pathname.startsWith("/teacher")) return true;
  if (role === "student" && pathname.startsWith("/parent")) return true;
  if (role === "parent" && pathname.startsWith("/teacher")) return true;
  if (role === "parent" && pathname.startsWith("/student")) return true;
  return false;
};

// Helper to create a timeout promise
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Auth check timed out')), ms)
    )
  ]);
};

export const useAuthRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // If Supabase is not configured, don't block the app
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Skipping auth redirect.');
      setIsLoading(false);
      return;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          try {
            // Fetch user role from user_roles table (more secure)
            const { data: userRole } = await withTimeout(
              supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", session.user.id)
                .single(),
              AUTH_TIMEOUT_MS
            );

            const role = userRole?.role || "student";
            const targetPath = role === "teacher" ? "/teacher" : role === "parent" ? "/parent" : "/student";

            // Redirect if on a public route OR on the wrong dashboard
            if (publicRoutes.includes(location.pathname) || isOnWrongDashboard(location.pathname, role)) {
              navigate(targetPath, { replace: true });
            }
          } catch (error) {
            console.error('Error fetching user role:', error);
          }
        } else if (event === "SIGNED_OUT") {
          navigate("/", { replace: true });
        }
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          AUTH_TIMEOUT_MS
        );
        
        if (session?.user) {
          // Fetch user role from user_roles table (more secure)
          const { data: userRole } = await withTimeout(
            supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id)
              .single(),
            AUTH_TIMEOUT_MS
          );

          const role = userRole?.role || "student";
          const targetPath = role === "teacher" ? "/teacher" : role === "parent" ? "/parent" : "/student";

          // Redirect if on a public route OR on the wrong dashboard
          if (publicRoutes.includes(location.pathname) || isOnWrongDashboard(location.pathname, role)) {
            navigate(targetPath, { replace: true });
          }
        }
      } catch (error) {
        console.error('Auth session check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return { isLoading };
};
