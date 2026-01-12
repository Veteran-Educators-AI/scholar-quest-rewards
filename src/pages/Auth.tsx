import { useState } from "react";
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
import { Mail, Lock, User, ArrowLeft, GraduationCap, Users, Chrome, Heart, Shield } from "lucide-react";

type AuthMode = "login" | "signup";
type UserRole = "student" | "parent" | "teacher";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<AuthMode>("login");
  const [role, setRole] = useState<UserRole>(
    searchParams.get("role") === "parent" ? "parent" : "student"
  );
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

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
            description: role === "teacher" 
              ? "Your teacher account has been created!"
              : role === "parent" 
                ? "Your account has been created. Let's connect with your child!"
                : "Your account has been created. Let's start learning!",
          });
          navigate(role === "teacher" ? "/teacher" : role === "parent" ? "/parent" : "/student");
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
          
          toast({
            title: "Welcome back! 🦉",
            description: userRole === "teacher" 
              ? "Let's check on your class!"
              : userRole === "parent"
                ? "Let's see how your child is doing!"
                : "Ready for another learning adventure?",
          });
          
          // Navigate based on role
          if (userRole === "teacher") {
            navigate("/teacher");
          } else if (userRole === "parent") {
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
    },
    parent: {
      login: "Welcome back! Let's see how your child is doing.",
      signup: "Hi there! Let's connect you with your child's progress.",
    },
    teacher: {
      login: "Welcome back, educator! Let's check on your class.",
      signup: "Hi there! Let's set up your teacher account.",
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
          <div className="grid grid-cols-3 gap-2 mb-6">
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
            <Button
              variant={role === "teacher" ? "destructive" : "outline"}
              className="flex-1"
              onClick={() => setRole("teacher")}
              size="sm"
            >
              <Shield className="w-4 h-4 mr-1" />
              Teacher
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            </p>
            <Button
              variant="link"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-destructive font-semibold"
            >
              {mode === "login" ? "Sign up" : "Log in"}
            </Button>
          </div>

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
