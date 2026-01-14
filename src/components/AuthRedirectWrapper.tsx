import { useAuthRedirect } from "@/hooks/useAuthRedirect";

interface AuthRedirectWrapperProps {
  children: React.ReactNode;
}

export const AuthRedirectWrapper = ({ children }: AuthRedirectWrapperProps) => {
  useAuthRedirect();
  return <>{children}</>;
};
