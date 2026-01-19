import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScholarBuddy } from "@/components/ScholarBuddy";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PoweredByFooter } from "@/components/PoweredByFooter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, ArrowLeft, GraduationCap, Heart, Shield, Loader2 } from "lucide-react";

type AuthMode = "login" | "signup" | "forgot" | "reset";
type UserRole = "student" | "parent" | "admin";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getTargetPath = (role: string | undefined): string => {
  switch (role) {
    case "admin": return "/admin";
    case "parent": return "/parent";
    default: return "/student";
  }
};

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const urlMode = searchParams.get("mode");
  const urlRole = searchParams.get("role");

  const [mode, setMode] = useState<AuthMode>(urlMode === "reset" ? "reset" : "login");
  const [role, setRole] = useState<UserRole>(
    urlRole === "parent" ? "parent" : urlRole === "admin" ? "admin" : "student"
  );
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    if (type === "recovery") {
      setMode("reset");
      window.history.replaceState(null, "", window.location.pathname + "?mode=reset");
    }
  }, []);

  const handleSignUp = async () => {
    if (!fullName.trim()) {
      toast({ title: "Name required", description: "Please enter your name.", variant: "destructive" });
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Weak password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role } },
      });

      if (error) {
        toast({
          title: error.message.includes("already registered") ? "Account exists" : "Sign up failed",
          description: error.message.includes("already registered") ? "Try logging in instead." : error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        await Promise.allSettled([
          supabase.from("profiles").upsert({ id: data.user.id, full_name: fullName, role }, { onConflict: "id" }),
          supabase.from("user_roles").upsert({ user_id: data.user.id, role }, { onConflict: "user_id" }),
        ]);

        toast({ title: "Welcome!", description: "Your account has been created." });
        navigate(getTargetPath(role));
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast({ title: "Missing fields", description: "Please enter email and password.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast({ title: "Login failed", description: "Invalid email or password.", variant: "destructive" });
        return;
      }

      if (data.user) {
        const userRole = data.user.user_metadata?.role || "student";

        if (userRole === "teacher") {
          await supabase.auth.signOut();
          toast({ title: "Access Denied", description: "Teachers should use NYCologic AI.", variant: "destructive" });
          return;
        }

        toast({ title: "Welcome back!", description: "Signed in successfully." });
        navigate(getTargetPath(userRole));
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!EMAIL_REGEX.test(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) throw error;

      toast({ title: "Check your email", description: "We sent you a password reset link." });
      setMode("login");
    } catch {
      toast({ title: "Error", description: "Failed to send reset email.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (password.length < 6) {
      toast({ title: "Weak password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please confirm your password.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast({ title: "Password updated!", description: "You can now log in with your new password." });
      await supabase.auth.signOut();
      setMode("login");
      setPassword("");
      setConfirmPassword("");
    } catch {
      toast({ title: "Error", description: "Failed to update password.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup") handleSignUp();
    else if (mode === "forgot") handleForgotPassword();
    else if (mode === "reset") handlePasswordReset();
    else handleLogin();
  };

  const titles: Record<AuthMode, string> = {
    login: "Welcome Back",
    signup: "Create Account",
    forgot: "Reset Password",
    reset: "New Password",
  };

  const subtitles: Record<AuthMode, string> = {
    login: "Sign in to continue learning",
    signup: "Join the learning adventure",
    forgot: "Enter your email to reset",
    reset: "Create your new password",
  };

  const buttonLabels: Record<AuthMode, string> = {
    login: "Sign In",
    signup: "Create Account",
    forgot: "Send Reset Link",
    reset: "Update Password",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-destructive/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <ThemeToggle />
        </div>

        <div className="bg-card rounded-2xl shadow-xl border p-6 sm:p-8">
          <div className="flex flex-col items-center mb-6">
            <ScholarBuddy size="md" />
            <h1 className="text-2xl font-bold mt-3">{titles[mode]}</h1>
            <p className="text-muted-foreground text-sm mt-1">{subtitles[mode]}</p>
          </div>

          {role !== "admin" && mode !== "forgot" && mode !== "reset" && (
            <div className="grid grid-cols-2 gap-2 mb-6">
              <Button
                type="button"
                variant={role === "student" ? "default" : "outline"}
                onClick={() => setRole("student")}
                size="sm"
              >
                <GraduationCap className="w-4 h-4 mr-1" />
                Scholar
              </Button>
              <Button
                type="button"
                variant={role === "parent" ? "default" : "outline"}
                onClick={() => setRole("parent")}
                size="sm"
              >
                <Heart className="w-4 h-4 mr-1" />
                Parent
              </Button>
            </div>
          )}

          {role === "admin" && (
            <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-muted rounded-lg">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-medium">Admin Login</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {mode !== "reset" && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {(mode === "login" || mode === "signup") && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {mode === "reset" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>
              </>
            )}

            {mode === "login" && (
              <div className="text-right">
                <Button type="button" variant="link" className="text-sm p-0 h-auto" onClick={() => setMode("forgot")}>
                  Forgot password?
                </Button>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Please wait...
                </>
              ) : (
                buttonLabels[mode]
              )}
            </Button>
          </form>

          {mode !== "reset" && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-semibold"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </Button>
              </p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t text-center">
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <a href="/privacy-policy" className="hover:underline">Privacy</a>
              <span>•</span>
              <a href="/terms-of-service" className="hover:underline">Terms</a>
            </div>
          </div>

          <PoweredByFooter className="mt-4" />
        </div>
      </motion.div>
    </div>
  );
}
