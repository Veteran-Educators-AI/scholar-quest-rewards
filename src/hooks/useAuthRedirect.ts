import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const publicRoutes = ["/", "/auth", "/privacy-policy", "/terms-of-service", "/reset-password"];

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
    
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn("[useAuthRedirect] Timeout reached, forcing loading to false");
        setIsLoading(false);
      }
    }, 5000);

    const handleSessionCheck = async (session: any) => {
      if (!mounted) return;
      
      console.log("[useAuthRedirect] handleSessionCheck called", { 
        hasSession: !!session, 
        pathname: location.pathname 
      });
      
      try {
        if (session?.user) {
          console.log("[useAuthRedirect] User authenticated, fetching role...");
          
          // Fetch user role from user_roles table (more secure)
          const { data: userRole, error } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .maybeSingle();

          console.log("[useAuthRedirect] Role fetched:", { userRole, error });

          if (error) {
            console.error("Error fetching role:", error);
          }

          const role = userRole?.role || "student";
          const targetPath = role === "teacher" ? "/teacher" : role === "parent" ? "/parent" : "/student";

          console.log("[useAuthRedirect] Role:", role, "Target:", targetPath, "Current:", location.pathname);

          // Redirect if on a public route OR on the wrong dashboard
          if (publicRoutes.includes(location.pathname) || isOnWrongDashboard(location.pathname, role)) {
            console.log("[useAuthRedirect] Redirecting to:", targetPath);
            if (mounted) {
              navigate(targetPath, { replace: true });
            }
          } else {
            console.log("[useAuthRedirect] User on correct route, no redirect needed");
          }
        } else if (!session && !publicRoutes.includes(location.pathname)) {
          // If no session and on a private route, redirect to auth
          console.log("[useAuthRedirect] No session, redirecting to auth");
          if (mounted) {
            navigate("/auth", { replace: true });
          }
        }
      } catch (error) {
        console.error("Auth redirect error:", error);
      } finally {
        console.log("[useAuthRedirect] Setting isLoading to false");
        if (mounted) setIsLoading(false);
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[useAuthRedirect] onAuthStateChange event:", event);
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
      console.log("[useAuthRedirect] Checking existing session...");
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log("[useAuthRedirect] getSession result:", { hasSession: !!session, error });
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
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return { isLoading };
};
