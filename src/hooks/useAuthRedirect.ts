import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PUBLIC_ROUTES = ["/", "/auth", "/privacy-policy", "/terms-of-service", "/verify-email"];

const isPublicRoute = (pathname: string): boolean => {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (pathname.startsWith("/invite/")) return true;
  return false;
};

const isVerifyEmailRoute = (pathname: string): boolean => {
  return pathname === "/verify-email";
};

const getTargetPath = (role: string | undefined): string => {
  switch (role) {
    case "admin": return "/admin";
    case "parent": return "/parent";
    default: return "/student";
  }
};

export const useAuthRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(!isPublicRoute(location.pathname));

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          const role = session.user.user_metadata?.role;
          const isEmailVerified = !!session.user.email_confirmed_at;

          if (role === "teacher") {
            await supabase.auth.signOut();
            setIsLoading(false);
            return;
          }

          // Check email verification for protected routes
          if (!isEmailVerified && !isPublicRoute(location.pathname)) {
            navigate("/verify-email", { replace: true });
            return;
          }

          // If on verify-email page but already verified, redirect to dashboard
          if (isEmailVerified && isVerifyEmailRoute(location.pathname)) {
            navigate(getTargetPath(role), { replace: true });
            return;
          }

          if (isPublicRoute(location.pathname) && !isVerifyEmailRoute(location.pathname)) {
            navigate(getTargetPath(role), { replace: true });
          }
        } else if (!isPublicRoute(location.pathname)) {
          navigate("/auth", { replace: true });
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === "SIGNED_OUT") {
          navigate("/", { replace: true });
        } else if (event === "SIGNED_IN" && session?.user) {
          const role = session.user.user_metadata?.role;
          const isEmailVerified = !!session.user.email_confirmed_at;

          if (role === "teacher") {
            await supabase.auth.signOut();
            return;
          }

          // Redirect to verify-email if not verified
          if (!isEmailVerified) {
            navigate("/verify-email", { replace: true });
            return;
          }

          if (isPublicRoute(location.pathname) && location.pathname !== "/auth") {
            navigate(getTargetPath(role), { replace: true });
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return { isLoading };
};
