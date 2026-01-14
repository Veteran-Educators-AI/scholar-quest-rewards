import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { tryOr, withTimeout } from "@/lib/async";

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
  const [isLoading, setIsLoading] = useState(true);
  const pathnameRef = useRef(location.pathname);

  // Keep latest pathname without resubscribing auth listener.
  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          const currentPath = pathnameRef.current;

          if (event === "SIGNED_IN" && session?.user) {
            // Fetch user role from user_roles table (more secure)
            const { data: userRole } = await tryOr(
              withTimeout(
                supabase
                  .from("user_roles")
                  .select("role")
                  .eq("user_id", session.user.id)
                  .single(),
                7000,
                "Timed out fetching user role"
              ),
              { data: null } as unknown as { data: { role?: string } | null }
            );

            const role = userRole?.role || "student";
            const targetPath = role === "teacher" ? "/teacher" : role === "parent" ? "/parent" : "/student";

            // Redirect if on a public route OR on the wrong dashboard
            if (publicRoutes.includes(currentPath) || isOnWrongDashboard(currentPath, role)) {
              navigate(targetPath, { replace: true });
            }
          } else if (event === "SIGNED_OUT") {
            navigate("/", { replace: true });
          }
        } finally {
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await tryOr(
          withTimeout(supabase.auth.getSession(), 7000, "Timed out getting auth session"),
          { data: { session: null } }
        );

        if (session?.user) {
          const currentPath = pathnameRef.current;

          // Fetch user role from user_roles table (more secure)
          const { data: userRole } = await tryOr(
            withTimeout(
              supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", session.user.id)
                .single(),
              7000,
              "Timed out fetching user role"
            ),
            { data: null } as unknown as { data: { role?: string } | null }
          );

          const role = userRole?.role || "student";
          const targetPath = role === "teacher" ? "/teacher" : role === "parent" ? "/parent" : "/student";

          // Redirect if on a public route OR on the wrong dashboard
          if (publicRoutes.includes(currentPath) || isOnWrongDashboard(currentPath, role)) {
            navigate(targetPath, { replace: true });
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return { isLoading };
};
