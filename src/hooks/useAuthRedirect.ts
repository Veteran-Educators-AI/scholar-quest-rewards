import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const publicRoutes = ["/", "/auth", "/privacy-policy", "/terms-of-service"];

const isPublicRoute = (pathname: string): boolean => {
  if (publicRoutes.includes(pathname)) return true;
  if (pathname.startsWith("/invite/")) return true;
  return false;
};

const isOnWrongDashboard = (pathname: string, role: string): boolean => {
  if (role === "teacher") return true;
  if (role === "admin") return false;
  if (role === "student" && pathname.startsWith("/parent")) return true;
  if (role === "parent" && pathname.startsWith("/student")) return true;
  return false;
};

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
  const hasChecked = useRef(false);

  // Initial session check - runs once
  useEffect(() => {
    if (hasChecked.current) {
      setIsLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: userRole } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .single();

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
        hasChecked.current = true;
        setIsLoading(false);
      }
    };

    checkSession();
  }, [navigate, location.pathname]);

  // Auth state change listener
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
