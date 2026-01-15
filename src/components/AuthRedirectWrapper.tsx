import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import PageLoader from "./PageLoader";

interface AuthRedirectWrapperProps {
  children: React.ReactNode;
}

export const AuthRedirectWrapper = ({ children }: AuthRedirectWrapperProps) => {
  const { isLoading } = useAuthRedirect();
  
  // Show loader only during initial auth check, not on every route change
  if (isLoading) {
    return <PageLoader />;
  }
  
  return <>{children}</>;
};
