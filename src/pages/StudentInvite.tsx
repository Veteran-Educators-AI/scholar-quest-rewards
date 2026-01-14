import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, GraduationCap, Sparkles, CheckCircle2 } from "lucide-react";
import { PoweredByFooter } from "@/components/PoweredByFooter";
import highschoolLogo from "@/assets/highschool-logo-new.png";

interface InviteData {
  id: string;
  token: string;
  teacher_id: string;
  student_name: string | null;
  student_email: string | null;
  class_id: string | null;
  expires_at: string;
  teacher_name?: string;
  class_name?: string;
}

export default function StudentInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (token) {
      fetchInviteData();
    }
  }, [token]);

  const fetchInviteData = async () => {
    try {
      // Fetch invite data
      const { data: invite, error: inviteError } = await supabase
        .from("student_invite_links")
        .select("*")
        .eq("token", token)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (inviteError || !invite) {
        setError("This invite link is invalid or has expired.");
        setLoading(false);
        return;
      }

      // Fetch teacher name
      const { data: teacher } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", invite.teacher_id)
        .single();

      // Fetch class name if class_id exists
      let className = null;
      if (invite.class_id) {
        const { data: classData } = await supabase
          .from("classes")
          .select("name")
          .eq("id", invite.class_id)
          .single();
        className = classData?.name;
      }

      setInviteData({
        ...invite,
        teacher_name: teacher?.full_name,
        class_name: className,
      });

      // Pre-fill form if data provided
      if (invite.student_name) setFullName(invite.student_name);
      if (invite.student_email) setEmail(invite.student_email);

      // Check if user is already logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Process invite for existing user
        await processInviteForUser(session.user.id);
      }
    } catch (err) {
      console.error("Error fetching invite:", err);
      setError("Failed to load invite details.");
    } finally {
      setLoading(false);
    }
  };

  const processInviteForUser = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc("process_invite_link", {
        p_token: token,
        p_user_id: userId,
      });

      if (error) throw error;

      const result = data as { success?: boolean; error?: string } | null;
      
      if (result?.success) {
        setSuccess(true);
        toast({
          title: "Welcome to ScholarQuest! 🎉",
          description: "Your account has been linked successfully.",
        });
        setTimeout(() => navigate("/student"), 2000);
      } else {
        setError(result?.error || "Failed to process invite.");
      }
    } catch (err) {
      console.error("Error processing invite:", err);
      setError("Failed to process invite link.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isSignUp) {
        // Sign up new user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: "student",
            },
          },
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          // Process the invite
          await processInviteForUser(signUpData.user.id);
        }
      } else {
        // Sign in existing user
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (signInData.user) {
          await processInviteForUser(signInData.user.id);
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      toast({
        title: "Error",
        description: err.message || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <img src={highschoolLogo} alt="ScholarQuest" className="h-16 mx-auto mb-4" />
            <CardTitle className="text-destructive">Invalid Invite</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/auth")} variant="outline">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-600">You're In! 🎉</CardTitle>
            <CardDescription>
              {inviteData?.class_name 
                ? `You've been enrolled in ${inviteData.class_name}!`
                : "Your account is now linked!"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">Redirecting to your dashboard...</p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <img src={highschoolLogo} alt="ScholarQuest" className="h-16 mx-auto mb-4" />
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-muted-foreground">You're Invited!</span>
              <Sparkles className="h-5 w-5 text-yellow-500" />
            </div>
            <CardTitle className="text-2xl">Join ScholarQuest</CardTitle>
            <CardDescription>
              {inviteData?.teacher_name && (
                <span className="block text-primary font-medium">
                  {inviteData.teacher_name} invited you
                </span>
              )}
              {inviteData?.class_name && (
                <span className="block mt-1">
                  to join <strong>{inviteData.class_name}</strong>
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignUp ? "Create a password" : "Enter your password"}
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <GraduationCap className="h-4 w-4 mr-2" />
                )}
                {isSignUp ? "Create Account & Join" : "Sign In & Join"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-primary hover:underline"
              >
                {isSignUp 
                  ? "Already have an account? Sign in" 
                  : "Need an account? Sign up"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
      <PoweredByFooter />
    </div>
  );
}
