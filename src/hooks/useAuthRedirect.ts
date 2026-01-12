import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const publicRoutes = ["/", "/auth", "/privacy-policy", "/terms-of-service"];

export const useAuthRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          // Fetch user role
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          const role = profile?.role || "student";
          const targetPath = role === "teacher" ? "/teacher" : role === "parent" ? "/parent" : "/student";

          // Only redirect if on a public route
          if (publicRoutes.includes(location.pathname)) {
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
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        const role = profile?.role || "student";
        const targetPath = role === "teacher" ? "/teacher" : role === "parent" ? "/parent" : "/student";

        // Only redirect if on a public route
        if (publicRoutes.includes(location.pathname)) {
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
