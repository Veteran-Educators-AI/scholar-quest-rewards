import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageLoader from "./PageLoader";

interface AuthRedirectWrapperProps {
  children: React.ReactNode;
}

const publicRoutes = new Set(["/", "/auth", "/privacy-policy", "/terms-of-service"]);

const isPublicRoute = (pathname: string): boolean => {
  if (publicRoutes.has(pathname)) return true;
  if (pathname.startsWith("/invite/")) return true;
  return false;
};

export const AuthRedirectWrapper = ({ children }: AuthRedirectWrapperProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isBlocking, setIsBlocking] = useState(false);

  const hasCheckedInitialSession = useRef(false);
  const unsubscribeRef = useRef<null | (() => void)>(null);

  // Subscribe once (deferred) so Supabase isn't in the initial app shell chunk.
  useEffect(() => {
    if (unsubscribeRef.current) return;

    const start = async () => {
      const { subscribeToAuthChanges } = await import("@/auth/authRedirect");
      unsubscribeRef.current = subscribeToAuthChanges(navigate);
    };

    // Defer until the browser is idle-ish.
    if ("requestIdleCallback" in window) {
      (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
        void start();
      });
    } else {
      window.setTimeout(() => void start(), 0);
    }

    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, [navigate]);

  // Initial session check:
  // - Protected routes: block with loader until checked.
  // - Public routes: render immediately; check in background and redirect if needed.
  useEffect(() => {
    const pathname = location.pathname;

    if (hasCheckedInitialSession.current) {
      setIsBlocking(false);
      return;
    }

    let cancelled = false;
    const isPublic = isPublicRoute(pathname);

    const run = async () => {
      const { checkInitialSessionAndRedirect } = await import("@/auth/authRedirect");
      await checkInitialSessionAndRedirect(pathname, navigate, { shouldRedirect: true });

      if (!cancelled) {
        hasCheckedInitialSession.current = true;
        setIsBlocking(false);
      }
    };

    if (!isPublic && !cancelled) {
      setIsBlocking(true);
    }

    // Public pages should paint ASAP; defer auth check until the browser is idle-ish.
    if (isPublic && "requestIdleCallback" in window) {
      (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
        void run();
      });
    } else {
      // Always defer at least a tick so render happens first.
      window.setTimeout(() => void run(), 0);
    }

    return () => {
      cancelled = true;
    };
  }, [location.pathname, navigate]);

  if (isBlocking) return <PageLoader />;

  return <>{children}</>;
};
