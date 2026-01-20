import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScholarBuddy } from "@/components/ScholarBuddy";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PoweredByFooter } from "@/components/PoweredByFooter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, RefreshCw, LogOut, CheckCircle } from "lucide-react";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Get current user's email
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email ?? null);

        // If email is already confirmed, redirect to dashboard
        if (user.email_confirmed_at) {
          const role = user.user_metadata?.role || "student";
          navigate(role === "admin" ? "/admin" : role === "parent" ? "/parent" : "/student", { replace: true });
        }
      } else {
        // No user logged in, redirect to auth
        navigate("/auth", { replace: true });
      }
    };

    getUser();

    // Check verification status periodically
    const interval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email_confirmed_at) {
        const role = user.user_metadata?.role || "student";
        toast({ title: "Email verified!", description: "Welcome to Scholar Quest!" });
        navigate(role === "admin" ? "/admin" : role === "parent" ? "/parent" : "/student", { replace: true });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [navigate, toast]);

  const handleResendEmail = async () => {
    if (!email) return;

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) throw error;

      toast({
        title: "Email sent!",
        description: "Check your inbox for the verification link.",
      });
    } catch (error) {
      toast({
        title: "Failed to send email",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);
    try {
      // Refresh the session to get updated email_confirmed_at
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) throw error;

      if (user?.email_confirmed_at) {
        const role = user.user_metadata?.role || "student";
        toast({ title: "Email verified!", description: "Welcome to Scholar Quest!" });
        navigate(role === "admin" ? "/admin" : role === "parent" ? "/parent" : "/student", { replace: true });
      } else {
        toast({
          title: "Not verified yet",
          description: "Please check your email and click the verification link.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error checking verification",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex items-center justify-end mb-4">
          <ThemeToggle />
        </div>

        <div className="bg-card rounded-2xl shadow-xl border p-6 sm:p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <ScholarBuddy size="md" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <Mail className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mt-4">Verify Your Email</h1>
            <p className="text-muted-foreground text-sm mt-2 text-center">
              We sent a verification link to
            </p>
            {email && (
              <p className="font-medium text-primary mt-1">{email}</p>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Check your inbox</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click the link in the email to verify your account. If you don't see it, check your spam folder.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleCheckVerification}
              className="w-full"
              disabled={checking}
            >
              {checking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  I've Verified My Email
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleResendEmail}
              className="w-full"
              disabled={resending}
            >
              {resending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full text-muted-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-6">
            This page will automatically redirect once your email is verified.
          </p>

          <PoweredByFooter className="mt-6" />
        </div>
      </motion.div>
    </div>
  );
}
