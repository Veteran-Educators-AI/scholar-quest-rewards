import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import PageLoader from "@/components/PageLoader";

interface AuthRedirectWrapperProps {
  children: React.ReactNode;
}

export const AuthRedirectWrapper = ({ children }: AuthRedirectWrapperProps) => {
  const { isLoading } = useAuthRedirect();

  // Show a loading state while checking authentication
  if (isLoading) {
    return <PageLoader />;
  }

  return <>{children}</>;
};
