import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const publicRoutes = ["/", "/auth", "/privacy-policy", "/terms-of-service"];

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

export const useAuthRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // For public routes, don't block rendering - start with isLoading false
  const isPublicRoute = publicRoutes.includes(location.pathname);
  const [isLoading, setIsLoading] = useState(!isPublicRoute);

  useEffect(() => {
    let mounted = true;

    const handleSessionCheck = async (session: any) => {
      if (!mounted) return;
      
      try {
        if (session?.user) {
          // Fetch user role from user_roles table (more secure)
          const { data: userRole, error } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (error) {
            console.error("Error fetching role:", error);
          }

          const role = userRole?.role || "student";
          const targetPath = role === "teacher" ? "/teacher" : role === "parent" ? "/parent" : "/student";

          // Redirect if on a public route OR on the wrong dashboard
          if (publicRoutes.includes(location.pathname) || isOnWrongDashboard(location.pathname, role)) {
            if (mounted) {
              navigate(targetPath, { replace: true });
            }
          }
        } else if (!session && !publicRoutes.includes(location.pathname)) {
          // If no session and on a private route, redirect to auth
          if (mounted) {
            navigate("/auth", { replace: true });
          }
        }
      } catch (error) {
        console.error("Auth redirect error:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          if (mounted) {
            navigate("/", { replace: true });
            setIsLoading(false);
          }
        } else {
          await handleSessionCheck(session);
        }
      }
    );

    // THEN check for existing session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        await handleSessionCheck(session);
      } catch (e) {
        console.error("Session check failed", e);
        if (mounted) setIsLoading(false);
      }
    };

    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return { isLoading };
};
