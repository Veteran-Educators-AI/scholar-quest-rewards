import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScholarBuddy } from "@/components/ScholarBuddy";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, ArrowLeft, GraduationCap, Users, Chrome, Heart } from "lucide-react";

type AuthMode = "login" | "signup";
type UserRole = "student" | "parent";

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
        
        const { error } = await supabase.auth.signUp({
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
        } else {
          toast({
            title: "Welcome to Scan Scholar! 🎉",
            description: role === "parent" 
              ? "Your account has been created. Let's connect with your child!"
              : "Your account has been created. Let's start learning!",
          });
          navigate(role === "parent" ? "/parent" : "/student");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
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
        } else {
          toast({
            title: "Welcome back! 🦉",
            description: "Ready for another learning adventure?",
          });
          // Navigation will be handled by auth state listener in App
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
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Button>

        <div className="bg-card rounded-3xl shadow-xl border border-primary/20 p-8">
          {/* Mascot */}
          <div className="flex flex-col items-center mb-6">
            <ScholarBuddy size="md" />
            <div className="text-center mt-3">
              <h1 className="text-2xl font-bold text-foreground tracking-wide leading-none">
                NYCologic <span className="text-destructive">Ai</span>
              </h1>
              <span className="text-sm font-bold text-secondary leading-none">Student</span>
            </div>
            <div className="bg-primary/5 rounded-xl px-5 py-3 shadow-lg border border-primary/20 max-w-sm text-center backdrop-blur-sm mt-4">
              <p className="text-sm font-medium text-foreground">{messages[role][mode]}</p>
            </div>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <Button
              variant={role === "student" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setRole("student")}
              size="sm"
            >
              <GraduationCap className="w-4 h-4 mr-1" />
              Student
            </Button>
            <Button
              variant={role === "parent" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setRole("parent")}
              size="sm"
            >
              <Heart className="w-4 h-4 mr-1" />
              Parent
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
              variant="hero"
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
              className="text-primary font-semibold"
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
        </div>
      </motion.div>
    </div>
  );
}
