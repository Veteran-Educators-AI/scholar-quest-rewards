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
import { Mail, Lock, User, ArrowLeft, GraduationCap, Chrome, Heart } from "lucide-react";

type AuthMode = "login" | "signup" | "forgot" | "reset";
type UserRole = "student" | "parent";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Check if coming from password reset link
  const urlMode = searchParams.get("mode");
  const [mode, setMode] = useState<AuthMode>(urlMode === "reset" ? "reset" : "login");
  const [role, setRole] = useState<UserRole>(
    searchParams.get("role") === "parent" ? "parent" : "student"
  );
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // Listen for password recovery event and check URL for recovery token
  useEffect(() => {
    const initAuth = async () => {
      // Check if URL contains recovery token (comes in hash fragment)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');
      
      if (type === 'recovery' && accessToken && refreshToken) {
        // This is a password recovery link - set session and show reset form
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error) {
            setMode("reset");
            // Clear the hash to clean up URL
            window.history.replaceState(null, '', window.location.pathname + '?mode=reset');
          }
        } catch (err) {
          console.error("Failed to set session from recovery token:", err);
        }
        return;
      }
      
      // If mode=reset is in URL, check if user has a valid session for password reset
      if (urlMode === "reset") {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // User has active session from recovery link, show reset form
          setMode("reset");
        }
      }
    };
    
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event);
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
      }
    });

    return () => subscription.unsubscribe();
  }, [urlMode]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      
      if (error) throw error;
      
      toast({
        title: "Password reset email sent! 📧",
        description: "Check your inbox for a link to reset your password.",
      });
      setMode("login");
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Get current user session to get email
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      // Get user profile name for the email
      let userName = "";
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        userName = profile?.full_name || "";
      }
      
      // Send confirmation email via edge function
      if (user?.email) {
        try {
          await supabase.functions.invoke("send-password-reset-confirmation", {
            body: {
              email: user.email,
              name: userName,
            },
          });
        } catch (emailError) {
          // Log but don't fail the password reset if email fails
          console.error("Failed to send confirmation email:", emailError);
        }
      }
      
      toast({
        title: "Password updated! 🎉",
        description: "You can now log in with your new password. A confirmation email has been sent.",
      });
      
      // Sign out so they can log in fresh with new password
      await supabase.auth.signOut();
      setMode("login");
      setPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Update failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        const redirectUrl = `${window.location.origin}/`;
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
              role: role,
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Try logging in instead.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else if (data.user) {
          // Create profile record which triggers student_profiles creation
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: data.user.id,
              full_name: fullName,
              role: role,
            });

          if (profileError && !profileError.message.includes("duplicate")) {
            console.error("Profile creation error:", profileError);
          }

          // Create user_roles record
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({
              user_id: data.user.id,
              role: role,
            });

          if (roleError && !roleError.message.includes("duplicate")) {
            console.error("Role creation error:", roleError);
          }

          toast({
            title: "Welcome to NYCologic Scholar! 🎉",
            description: role === "parent" 
              ? "Your account has been created. Let's connect with your child!"
              : "Your account has been created. Let's start learning!",
          });
          navigate(role === "parent" ? "/parent" : "/student");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Login failed",
              description: "Please check your email and password.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else if (data.user) {
          // Fetch user role from profiles table
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();

          const userRole = profile?.role || "student";
          
          // Only allow student and parent roles
          if (userRole === "teacher") {
            await supabase.auth.signOut();
            toast({
              title: "Access Denied",
              description: "Teachers should use NYCologic AI. This app is for students and parents only.",
              variant: "destructive",
            });
            return;
          }
          
          toast({
            title: "Welcome back! 🦉",
            description: userRole === "parent"
              ? "Let's see how your child is doing!"
              : "Ready for another learning adventure?",
          });
          
          // Navigate based on role
          if (userRole === "parent") {
            navigate("/parent");
          } else {
            navigate("/student");
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Something went wrong",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/student`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Google login failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const messages = {
    student: {
      login: "Welcome back, scholar! Ready for more adventures?",
      signup: "Hi there! Let's set up your account and start earning rewards!",
      forgot: "No worries! Enter your email to reset your password.",
      reset: "Almost there! Create your new password.",
    },
    parent: {
      login: "Welcome back! Let's see how your child is doing.",
      signup: "Hi there! Let's connect you with your child's progress.",
      forgot: "No worries! Enter your email to reset your password.",
      reset: "Almost there! Create your new password.",
    },
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background decoration - Red themed */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-destructive/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-secondary/10 rounded-full blur-2xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header with back button and theme toggle */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Button>
          <ThemeToggle />
        </div>

        <div className="bg-card rounded-3xl shadow-xl border border-primary/20 p-8">
          {/* Mascot */}
          <div className="flex flex-col items-center mb-6">
            <ScholarBuddy size="md" />
            <div className="text-center mt-3">
              <h1 className="text-xl font-bold text-foreground tracking-wide leading-none">
                NYCologic <span className="text-destructive">Ai<sup className="text-xs">™</sup></span>
              </h1>
              <span className="text-3xl font-black text-destructive leading-none tracking-tight" style={{ fontFamily: 'Impact, Haettenschweiler, Arial Narrow Bold, sans-serif' }}>
                SCHOLAR
              </span>
            </div>
            <div className="bg-primary/5 rounded-xl px-5 py-3 shadow-lg border border-primary/20 max-w-sm text-center backdrop-blur-sm mt-4">
              <p className="text-sm font-medium text-foreground">{messages[role][mode]}</p>
            </div>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <Button
              variant={role === "student" ? "destructive" : "outline"}
              className="flex-1"
              onClick={() => setRole("student")}
              size="sm"
            >
              <GraduationCap className="w-4 h-4 mr-1" />
              Scholar
            </Button>
            <Button
              variant={role === "parent" ? "destructive" : "outline"}
              className="flex-1"
              onClick={() => setRole("parent")}
              size="sm"
            >
              <Heart className="w-4 h-4 mr-1" />
              Parent
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={
            mode === "forgot" ? handleForgotPassword : 
            mode === "reset" ? handlePasswordReset : 
            handleSubmit
          } className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-12 rounded-xl"
                    required
                  />
                </div>
              </div>
            )}

            {mode !== "reset" && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 rounded-xl"
                    required
                  />
                </div>
              </div>
            )}

            {(mode === "login" || mode === "signup") && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 rounded-xl"
                    minLength={6}
                    required
                  />
                </div>
              </div>
            )}

            {mode === "reset" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 rounded-xl"
                      minLength={6}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-12 rounded-xl"
                      minLength={6}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {mode === "login" && (
              <div className="text-right">
                <Button
                  type="button"
                  variant="link"
                  className="text-muted-foreground text-sm p-0 h-auto"
                  onClick={() => setMode("forgot")}
                >
                  Forgot password?
                </Button>
              </div>
            )}

            <Button
              type="submit"
              variant="destructive"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : mode === "login" ? (
                "Log In"
              ) : mode === "forgot" ? (
                "Send Reset Link"
              ) : mode === "reset" ? (
                "Update Password"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {/* Google Login */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <Chrome className="w-5 h-5 mr-2" />
            Continue with Google
          </Button>

          {/* Toggle mode */}
          {mode !== "reset" && (
            <div className="mt-6 text-center">
              <p className="text-muted-foreground text-sm">
                {mode === "login" ? "Don't have an account?" : mode === "forgot" ? "Remember your password?" : "Already have an account?"}
              </p>
              <Button
                variant="link"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-destructive font-semibold"
              >
                {mode === "login" ? "Sign up" : "Log in"}
              </Button>
            </div>
          )}

          {/* Legal links and disclaimers */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex justify-center gap-4 text-xs">
              <a
                href="/privacy-policy"
                className="text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
              >
                Privacy Policy
              </a>
              <span className="text-muted-foreground">•</span>
              <a
                href="/terms-of-service"
                className="text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
              >
                Terms of Service
              </a>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-3 leading-relaxed">
              By signing in or creating an account, you agree to our Terms of Service and Privacy Policy. 
              This application is designed for educational purposes. Student data is protected in accordance with FERPA and COPPA regulations.
            </p>
          </div>

          {/* Powered by footer */}
          <PoweredByFooter className="mt-4 border-t border-border pt-4" />
        </div>
      </motion.div>
    </div>
  );
}
