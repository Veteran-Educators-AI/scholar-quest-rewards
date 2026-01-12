import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  UserPlus, 
  Mail, 
  Clock, 
  CheckCircle2, 
  XCircle,
  ChevronLeft,
  Loader2,
  Trash2,
  Copy,
  LayoutDashboard,
  Ticket,
  Key,
  Link as LinkIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PoweredByFooter } from "@/components/PoweredByFooter";
import nycologicLogo from "@/assets/nycologic-ai-logo.png";

interface PendingEnrollment {
  id: string;
  email: string;
  student_name: string | null;
  class_id: string;
  class_name: string;
  created_at: string;
  processed: boolean;
}

interface EnrolledStudent {
  id: string;
  full_name: string;
  email: string;
  class_id: string;
  class_name: string;
  enrolled_at: string;
}

interface TeacherClass {
  id: string;
  name: string;
  class_code: string;
}

export default function TeacherStudents() {
  const [pendingEnrollments, setPendingEnrollments] = useState<PendingEnrollment[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch teacher's classes
      const { data: classesData } = await supabase
        .from("classes")
        .select("id, name, class_code")
        .eq("teacher_id", user.id);

      if (classesData) {
        setClasses(classesData);
        if (classesData.length > 0 && !selectedClassId) {
          setSelectedClassId(classesData[0].id);
        }
      }

      // Fetch pending enrollments
      const { data: pendingData } = await supabase
        .from("pending_enrollments")
        .select("id, email, student_name, class_id, created_at, processed, classes(name)")
        .eq("teacher_id", user.id)
        .eq("processed", false)
        .order("created_at", { ascending: false });

      if (pendingData) {
        setPendingEnrollments(pendingData.map((p: any) => ({
          id: p.id,
          email: p.email,
          student_name: p.student_name,
          class_id: p.class_id,
          class_name: p.classes?.name || "Unknown",
          created_at: p.created_at,
          processed: p.processed,
        })));
      }

      // Fetch enrolled students
      const { data: enrollmentsData } = await supabase
        .from("enrollments")
        .select(`
          id,
          class_id,
          enrolled_at,
          classes(name),
          profiles:student_id(id, full_name)
        `)
        .in("class_id", classesData?.map(c => c.id) || []);

      if (enrollmentsData) {
        // Get emails from auth - we'll use the profile full_name for now
        const students = enrollmentsData.map((e: any) => ({
          id: e.profiles?.id || e.id,
          full_name: e.profiles?.full_name || "Unknown Student",
          email: "", // Email not accessible via profiles
          class_id: e.class_id,
          class_name: e.classes?.name || "Unknown",
          enrolled_at: e.enrolled_at,
        }));
        setEnrolledStudents(students);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteStudent = async () => {
    if (!inviteEmail.trim() || !selectedClassId) return;
    
    setInviting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if student already exists
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .ilike("full_name", inviteEmail) // Can't search by email in profiles
        .single();

      if (existingUser) {
        // Check if already enrolled
        const { data: existingEnrollment } = await supabase
          .from("enrollments")
          .select("id")
          .eq("student_id", existingUser.id)
          .eq("class_id", selectedClassId)
          .single();

        if (existingEnrollment) {
          toast.error("Student is already enrolled in this class");
          return;
        }
      }

      // Check if already pending
      const { data: existingPending } = await supabase
        .from("pending_enrollments")
        .select("id")
        .eq("email", inviteEmail.toLowerCase())
        .eq("class_id", selectedClassId)
        .eq("processed", false)
        .single();

      if (existingPending) {
        toast.error("This email already has a pending invitation");
        return;
      }

      // Create pending enrollment
      const { error } = await supabase
        .from("pending_enrollments")
        .insert({
          email: inviteEmail.toLowerCase(),
          student_name: inviteName.trim() || null,
          class_id: selectedClassId,
          teacher_id: user.id,
        });

      if (error) throw error;

      toast.success("Invitation sent! Student will be enrolled when they sign up.");
      setInviteEmail("");
      setInviteName("");
      setInviteOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error inviting student:", error);
      toast.error("Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const handleDeletePending = async (id: string) => {
    try {
      const { error } = await supabase
        .from("pending_enrollments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Invitation removed");
      setPendingEnrollments(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error("Error deleting pending enrollment:", error);
      toast.error("Failed to remove invitation");
    }
  };

  const copyClassCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Class code copied!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2">
                <img 
                  src={nycologicLogo} 
                  alt="NYClogic Ai" 
                  className="w-8 h-8 object-contain"
                />
                <div className="hidden sm:block">
                  <p className="text-xs text-muted-foreground leading-none">Powered by</p>
                  <p className="text-sm font-semibold text-foreground leading-tight">NYClogic Ai™</p>
                </div>
              </div>
              <div className="hidden md:block">
                <h1 className="font-bold text-foreground text-xl">NYClogic Scholar Ai</h1>
                <p className="text-sm text-muted-foreground">Student Management</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Bar */}
        <div className="border-t border-border bg-muted/30">
          <div className="container mx-auto px-4">
            <nav className="flex items-center gap-1 overflow-x-auto py-2">
              <Link to="/teacher">
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="w-4 h-4 mr-1.5" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/teacher/students">
                <Button variant="ghost" size="sm" className="text-primary font-medium">
                  <Users className="w-4 h-4 mr-1.5" />
                  Students
                </Button>
              </Link>
              <Link to="/teacher/raffle">
                <Button variant="ghost" size="sm">
                  <Ticket className="w-4 h-4 mr-1.5" />
                  Raffle
                </Button>
              </Link>
              <Link to="/teacher/integrations">
                <Button variant="ghost" size="sm">
                  <LinkIcon className="w-4 h-4 mr-1.5" />
                  Integrations
                </Button>
              </Link>
              <Link to="/teacher/api">
                <Button variant="ghost" size="sm">
                  <Key className="w-4 h-4 mr-1.5" />
                  API Settings
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h2 className="text-2xl font-extrabold text-foreground">Student Management</h2>
            <p className="text-muted-foreground">Manage enrollments and invite students to your classes</p>
          </div>
          
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" />
                Invite Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite Student</DialogTitle>
                <DialogDescription>
                  Enter the student's email to pre-register them. They'll be automatically enrolled when they sign up.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Student Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@school.edu"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Student Name (optional)</Label>
                  <Input
                    id="name"
                    placeholder="John Smith"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleInviteStudent}
                  disabled={!inviteEmail.trim() || !selectedClassId || inviting}
                  className="w-full"
                >
                  {inviting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Class Codes */}
        {classes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Class Codes</CardTitle>
                <CardDescription>
                  Share these codes with students so they can join your classes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {classes.map((cls) => (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-foreground text-sm">{cls.name}</p>
                        <p className="text-lg font-mono font-bold text-primary">{cls.class_code}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyClassCode(cls.class_code)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              Pending ({pendingEnrollments.length})
            </TabsTrigger>
            <TabsTrigger value="enrolled" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Enrolled ({enrolledStudents.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Enrollments */}
          <TabsContent value="pending">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {pendingEnrollments.length > 0 ? (
                <div className="space-y-3">
                  {pendingEnrollments.map((pending) => (
                    <Card key={pending.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center">
                              <Clock className="w-5 h-5 text-warning" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {pending.student_name || pending.email}
                              </p>
                              {pending.student_name && (
                                <p className="text-sm text-muted-foreground">{pending.email}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                  {pending.class_name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Invited {new Date(pending.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePending(pending.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">No pending invitations</h3>
                  <p className="text-muted-foreground text-sm">
                    Invite students by email or share your class code
                  </p>
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Enrolled Students */}
          <TabsContent value="enrolled">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {enrolledStudents.length > 0 ? (
                <div className="space-y-3">
                  {enrolledStudents.map((student) => (
                    <Card key={student.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-success" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{student.full_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {student.class_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Enrolled {new Date(student.enrolled_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">No students enrolled yet</h3>
                  <p className="text-muted-foreground text-sm">
                    Students will appear here after they join your class
                  </p>
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>

        <PoweredByFooter />
      </main>
    </div>
  );
}
