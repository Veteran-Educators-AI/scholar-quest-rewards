import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const publicRoutes = ["/", "/auth", "/privacy-policy", "/terms-of-service"];

// Check if path is a public route (exact match or prefix match for invite)
const isPublicRoute = (pathname: string): boolean => {
  if (publicRoutes.includes(pathname)) return true;
  if (pathname.startsWith("/invite/")) return true;
  return false;
};

// Helper to check if user is on the wrong dashboard for their role
const isOnWrongDashboard = (pathname: string, role: string): boolean => {
  // Teachers are not allowed - they should use NYCologic AI
  if (role === "teacher") return true;
  // Admins can go anywhere
  if (role === "admin") return false;
  if (role === "student" && pathname.startsWith("/parent")) return true;
  if (role === "parent" && pathname.startsWith("/student")) return true;
  return false;
};

// Get the target path for a role
const getTargetPath = (role: string): string => {
  switch (role) {
    case "admin": return "/admin";
    case "parent": return "/parent";
    default: return "/student";
  }
};

export const useAuthRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (session?.user) {
          const { data: userRole } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .single();

          if (!isMounted) return;

          const role = userRole?.role || "student";
          
          if (role === "teacher") {
            await supabase.auth.signOut();
          } else {
            const targetPath = getTargetPath(role);
            const onPublicNonInvite = publicRoutes.includes(location.pathname);
            
            if (onPublicNonInvite || isOnWrongDashboard(location.pathname, role)) {
              navigate(targetPath, { replace: true });
            }
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Small delay to ensure Supabase client is ready
    const timer = setTimeout(checkSession, 50);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []); // Only run once on mount

  // Separate effect for auth state changes (sign in/out events)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const { data: userRole } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .single();

          const role = userRole?.role || "student";
          
          if (role === "teacher") {
            await supabase.auth.signOut();
            return;
          }
          
          const targetPath = getTargetPath(role);
          navigate(targetPath, { replace: true });
        } else if (event === "SIGNED_OUT") {
          navigate("/", { replace: true });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return { isLoading };
};
