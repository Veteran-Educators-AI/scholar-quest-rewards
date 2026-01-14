import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

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

interface AuthRedirectWrapperProps {
  children: React.ReactNode;
}

export const AuthRedirectWrapper = ({ children }: AuthRedirectWrapperProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, userRole, isLoading } = useAuth();

  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading) return;

    if (isAuthenticated && userRole) {
      const targetPath = userRole === "teacher" ? "/teacher" : userRole === "parent" ? "/parent" : "/student";
      
      // Redirect if on a public route OR on the wrong dashboard
      if (publicRoutes.includes(location.pathname) || isOnWrongDashboard(location.pathname, userRole)) {
        navigate(targetPath, { replace: true });
      }
    }
  }, [isAuthenticated, userRole, isLoading, location.pathname, navigate]);

  return <>{children}</>;
};
