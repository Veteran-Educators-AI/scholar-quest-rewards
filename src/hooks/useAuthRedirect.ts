import { useEffect, useState, useRef, useCallback } from "react";
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

// Cache user role in memory to avoid repeated DB calls
let cachedRole: string | null = null;
let cachedUserId: string | null = null;

const getCachedRole = async (userId: string): Promise<string> => {
  // Return cached role if same user
  if (cachedUserId === userId && cachedRole) {
    return cachedRole;
  }

  // Try session storage first for faster loads
  const storedRole = sessionStorage.getItem(`user_role_${userId}`);
  if (storedRole) {
    cachedRole = storedRole;
    cachedUserId = userId;
    return storedRole;
  }

  // Fetch from database
  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();

  const role = userRole?.role || "student";
  
  // Cache in memory and session storage
  cachedRole = role;
  cachedUserId = userId;
  sessionStorage.setItem(`user_role_${userId}`, role);
  
  return role;
};

const clearRoleCache = () => {
  cachedRole = null;
  cachedUserId = null;
};

export const useAuthRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Only block rendering on protected routes. Public routes should render immediately
  // while auth/session checks run in the background.
  const [isLoading, setIsLoading] = useState(() => !isPublicRoute(location.pathname));
  const hasChecked = useRef(false);

  const handleAuthenticatedUser = useCallback(async (userId: string, shouldRedirect: boolean) => {
    try {
      const role = await getCachedRole(userId);
      
      if (role === "teacher") {
        clearRoleCache();
        await supabase.auth.signOut();
        return;
      }
      
      if (shouldRedirect) {
        const targetPath = getTargetPath(role);
        const onPublicNonInvite = publicRoutes.includes(location.pathname);
        
        if (onPublicNonInvite || isOnWrongDashboard(location.pathname, role)) {
          navigate(targetPath, { replace: true });
        }
      }
    } catch (error) {
      console.error("Role fetch error:", error);
    }
  }, [navigate, location.pathname]);

  // Initial session check - runs once
  useEffect(() => {
    const checkSession = async () => {
      if (hasChecked.current) {
        // If the user navigated to a protected route after the first check,
        // we still don't want to block rendering unnecessarily.
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          await handleAuthenticatedUser(session.user.id, true);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        hasChecked.current = true;
        setIsLoading(false);
      }
    };

    checkSession();
  }, [handleAuthenticatedUser]);

  // If the user is on a public route, don't block the UI while checking auth.
  // If they navigate to a protected route before the initial check completes, show the loader.
  useEffect(() => {
    if (hasChecked.current) return;
    setIsLoading(!isPublicRoute(location.pathname));
  }, [location.pathname]);

  // Auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const role = await getCachedRole(session.user.id);
          
          if (role === "teacher") {
            clearRoleCache();
            await supabase.auth.signOut();
            return;
          }
          
          const targetPath = getTargetPath(role);
          navigate(targetPath, { replace: true });
        } else if (event === "SIGNED_OUT") {
          clearRoleCache();
          // Clear all role caches from session storage
          Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('user_role_')) {
              sessionStorage.removeItem(key);
            }
          });
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
