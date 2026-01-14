import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import PageLoader from "./PageLoader";

interface AuthRedirectWrapperProps {
  children: React.ReactNode;
}

export const AuthRedirectWrapper = ({ children }: AuthRedirectWrapperProps) => {
  const { isLoading } = useAuthRedirect();

  if (isLoading) {
    return <PageLoader />;
  }

  return <>{children}</>;
};
