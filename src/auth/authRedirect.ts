import { supabase } from "@/integrations/supabase/client";
import type { NavigateFunction } from "react-router-dom";

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
    case "admin":
      return "/admin";
    case "parent":
      return "/parent";
    default:
      return "/student";
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

const clearAllSessionRoleCaches = () => {
  Object.keys(sessionStorage).forEach((key) => {
    if (key.startsWith("user_role_")) {
      sessionStorage.removeItem(key);
    }
  });
};

async function handleAuthenticatedUser(
  userId: string,
  pathname: string,
  navigate: NavigateFunction,
  shouldRedirect: boolean,
) {
  try {
    const role = await getCachedRole(userId);

    // Teachers are not allowed in this app
    if (role === "teacher") {
      clearRoleCache();
      await supabase.auth.signOut();
      return;
    }

    if (!shouldRedirect) return;

    const targetPath = getTargetPath(role);
    const onPublicNonInvite = publicRoutes.includes(pathname);

    if (onPublicNonInvite || isOnWrongDashboard(pathname, role)) {
      navigate(targetPath, { replace: true });
    }
  } catch (error) {
    console.error("Role fetch error:", error);
  }
}

export async function checkInitialSessionAndRedirect(
  pathname: string,
  navigate: NavigateFunction,
  opts?: { shouldRedirect?: boolean },
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      await handleAuthenticatedUser(session.user.id, pathname, navigate, opts?.shouldRedirect ?? true);
    }
  } catch (error) {
    console.error("Auth check error:", error);
  }
}

export function subscribeToAuthChanges(navigate: NavigateFunction): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    try {
      if (event === "SIGNED_IN" && session?.user) {
        const role = await getCachedRole(session.user.id);

        if (role === "teacher") {
          clearRoleCache();
          await supabase.auth.signOut();
          return;
        }

        const targetPath = getTargetPath(role);
        navigate(targetPath, { replace: true });
        return;
      }

      if (event === "SIGNED_OUT") {
        clearRoleCache();
        clearAllSessionRoleCaches();
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("Auth state change error:", error);
    }
  });

  return () => subscription.unsubscribe();
}

export function isRoutePublic(pathname: string): boolean {
  return isPublicRoute(pathname);
}

