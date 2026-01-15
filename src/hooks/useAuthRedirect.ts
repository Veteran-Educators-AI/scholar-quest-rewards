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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          // Fetch user role from user_roles table (more secure)
          const { data: userRole } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .single();

          const role = userRole?.role || "student";
          
          // Teachers are not allowed in this app - sign them out
          if (role === "teacher") {
            await supabase.auth.signOut();
            return;
          }
          
          const targetPath = getTargetPath(role);

          // Redirect if on a public route (but NOT invite pages) OR on the wrong dashboard
          const onPublicNonInvite = publicRoutes.includes(location.pathname);
          if (onPublicNonInvite || isOnWrongDashboard(location.pathname, role)) {
            navigate(targetPath, { replace: true });
          }
        } else if (event === "SIGNED_OUT") {
          navigate("/", { replace: true });
        }
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch user role from user_roles table (more secure)
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();

        const role = userRole?.role || "student";
        
        // Teachers are not allowed in this app - sign them out
        if (role === "teacher") {
          await supabase.auth.signOut();
          return;
        }
        
        const targetPath = getTargetPath(role);

        // Redirect if on a public route (but NOT invite pages) OR on the wrong dashboard
        const onPublicNonInvite = publicRoutes.includes(location.pathname);
        if (onPublicNonInvite || isOnWrongDashboard(location.pathname, role)) {
          navigate(targetPath, { replace: true });
        }
      }
      setIsLoading(false);
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return { isLoading };
};
