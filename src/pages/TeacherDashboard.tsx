import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  Settings,
  LogOut,
  ChevronRight,
  Ticket,
  Key,
  Link as LinkIcon,
  LayoutDashboard,
  Copy,
  Loader2,
  FilePlus2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import nycologicLogo from "@/assets/nycologic-ai-logo.png";
import { PointDeductionDialog } from "@/components/PointDeductionDialog";
import { StudentStatusRecorder } from "@/components/StudentStatusRecorder";
import { PoweredByFooter } from "@/components/PoweredByFooter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClassData {
  id: string;
  name: string;
  class_code: string;
  grade_band: string | null;
  subject: string | null;
  studentCount: number;
  pendingVerifications: number;
}

interface StudentData {
  id: string;
  full_name: string;
  coins: number;
}

interface TeacherStats {
  totalStudents: number;
  activeAssignments: number;
  completionRate: number;
  pendingVerifications: number;
}

interface RecentActivity {
  id: string;
  student: string;
  action: string;
  assignment: string;
  time: string;
}

const GRADE_BANDS = [
  { value: "K-2", label: "Grades K-2" },
  { value: "3-5", label: "Grades 3-5" },
  { value: "6-8", label: "Grades 6-8" },
  { value: "9-10", label: "Grades 9-10" },
  { value: "11-12", label: "Grades 11-12" },
];

const SUBJECTS = [
  { value: "Math", label: "Math" },
  { value: "ELA", label: "English Language Arts" },
  { value: "Science", label: "Science" },
  { value: "Social Studies", label: "Social Studies" },
  { value: "Other", label: "Other" },
];

function generateClassCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function TeacherDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState("");
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [stats, setStats] = useState<TeacherStats>({
    totalStudents: 0,
    activeAssignments: 0,
    completionRate: 0,
    pendingVerifications: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  
  // Create class dialog
  const [createClassOpen, setCreateClassOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassSubject, setNewClassSubject] = useState("");
  const [newClassGradeBand, setNewClassGradeBand] = useState("");
  const [creatingClass, setCreatingClass] = useState(false);

  const [syncingClasses, setSyncingClasses] = useState(false);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  // Auto-sync classes from NYCologic Ai on login
  const syncClassesFromNYCologic = async () => {
    setSyncingClasses(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-nycologic-classes");
      
      if (error) {
        console.error("Failed to sync classes from NYCologic Ai:", error);
        return;
      }

      if (data?.imported > 0) {
        toast({
          title: "Classes Imported! 🎉",
          description: `Imported ${data.imported} class${data.imported > 1 ? "es" : ""} from NYCologic Ai.`,
        });
        // Refresh the teacher data to show new classes
        fetchTeacherData();
      } else if (data?.configured === false) {
        // NYCologic integration not configured, skip silently
        console.log("NYCologic integration not configured");
      }
    } catch (err) {
      console.error("Error syncing classes:", err);
    } finally {
      setSyncingClasses(false);
    }
  };

  const fetchTeacherData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch teacher profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (profile) {
        setTeacherName(profile.full_name || "Teacher");
        
        // Verify teacher role
        if (profile.role !== "teacher") {
          toast({
            title: "Access Denied",
            description: "This area is for teachers only.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
      }

      // Auto-sync classes from NYCologic Ai (only on initial load)
      if (loading) {
        syncClassesFromNYCologic();
      }

      // Fetch classes
      const { data: classesData } = await supabase
        .from("classes")
        .select("id, name, class_code, grade_band, subject")
        .eq("teacher_id", user.id);

      if (classesData && classesData.length > 0) {
        // For each class, get student count and pending verifications
        const classIds = classesData.map(c => c.id);
        
        // Get enrollments count per class
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("class_id, student_id")
          .in("class_id", classIds);

        // Get pending verifications
        const { data: pendingAttempts } = await supabase
          .from("attempts")
          .select("id, assignment_id, assignments!inner(class_id)")
          .eq("status", "submitted")
          .in("assignments.class_id", classIds);

        const classesWithCounts = classesData.map(cls => {
          const studentCount = enrollments?.filter(e => e.class_id === cls.id).length || 0;
          const pendingCount = pendingAttempts?.filter(
            (a: any) => a.assignments?.class_id === cls.id
          ).length || 0;

          return {
            ...cls,
            studentCount,
            pendingVerifications: pendingCount,
          };
        });

        setClasses(classesWithCounts);

        // Calculate stats
        const totalStudents = enrollments?.length || 0;
        const totalPending = pendingAttempts?.length || 0;

        // Get active assignments
        const { data: activeAssignments } = await supabase
          .from("assignments")
          .select("id")
          .in("class_id", classIds)
          .eq("status", "active");

        // Get completion rate
        const { data: allAttempts } = await supabase
          .from("attempts")
          .select("status, assignments!inner(class_id)")
          .in("assignments.class_id", classIds);

        const totalAttempts = allAttempts?.length || 0;
        const completedAttempts = allAttempts?.filter(
          a => a.status === "verified"
        ).length || 0;
        const completionRate = totalAttempts > 0 
          ? Math.round((completedAttempts / totalAttempts) * 100) 
          : 0;

        setStats({
          totalStudents,
          activeAssignments: activeAssignments?.length || 0,
          completionRate,
          pendingVerifications: totalPending,
        });

        // Get students for point deduction
        if (enrollments && enrollments.length > 0) {
          const studentIds = [...new Set(enrollments.map(e => e.student_id))];
          
          const { data: studentProfiles } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", studentIds);

          const { data: studentData } = await supabase
            .from("student_profiles")
            .select("user_id, coins")
            .in("user_id", studentIds);

          if (studentProfiles) {
            const studentsWithCoins = studentProfiles.map(s => ({
              id: s.id,
              full_name: s.full_name,
              coins: studentData?.find(sd => sd.user_id === s.id)?.coins || 0,
            }));
            setStudents(studentsWithCoins);
          }
        }

        // Get recent activity
        const { data: recentAttempts } = await supabase
          .from("attempts")
          .select(`
            id,
            status,
            submitted_at,
            student_id,
            assignments!inner(title, class_id)
          `)
          .in("assignments.class_id", classIds)
          .order("submitted_at", { ascending: false })
          .limit(5);

        if (recentAttempts && recentAttempts.length > 0) {
          const studentIds = recentAttempts.map(a => a.student_id);
          const { data: names } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", studentIds);

          const activities = recentAttempts.map(attempt => {
            const studentName = names?.find(n => n.id === attempt.student_id)?.full_name || "Student";
            const firstName = studentName.split(" ")[0];
            const action = attempt.status === "verified" ? "completed" : 
                          attempt.status === "submitted" ? "submitted" : "started";
            const time = attempt.submitted_at 
              ? formatTimeAgo(new Date(attempt.submitted_at))
              : "recently";

            return {
              id: attempt.id,
              student: firstName,
              action,
              assignment: (attempt.assignments as any)?.title || "Assignment",
              time,
            };
          });

          setRecentActivity(activities);
        }
      }
    } catch (error) {
      console.error("Error fetching teacher data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a class name.",
        variant: "destructive",
      });
      return;
    }

    setCreatingClass(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const classCode = generateClassCode();

      const { data, error } = await supabase
        .from("classes")
        .insert({
          name: newClassName,
          class_code: classCode,
          teacher_id: user.id,
          subject: newClassSubject || null,
          grade_band: newClassGradeBand || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Class Created! 🎉",
        description: `Your class code is ${classCode}. Share it with students!`,
      });

      setNewClassName("");
      setNewClassSubject("");
      setNewClassGradeBand("");
      setCreateClassOpen(false);
      
      // Refresh data
      fetchTeacherData();
    } catch (error: any) {
      toast({
        title: "Error creating class",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreatingClass(false);
    }
  };

  const copyClassCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Class code copied to clipboard.",
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "See you next time!",
    });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const isNewTeacher = classes.length === 0;

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
                <p className="text-sm text-muted-foreground">Teacher Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon-sm" onClick={handleLogout}>
                <LogOut className="w-5 h-5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Navigation Bar */}
        <div className="border-t border-border bg-muted/30">
          <div className="container mx-auto px-4">
            <nav className="flex items-center gap-1 overflow-x-auto py-2">
              <Link to="/teacher">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary font-medium"
                >
                  <LayoutDashboard className="w-4 h-4 mr-1.5" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/teacher/students">
                <Button variant="ghost" size="sm">
                  <Users className="w-4 h-4 mr-1.5" />
                  Students
                </Button>
              </Link>
              <Link to="/teacher/verify">
                <Button variant="ghost" size="sm">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Verify
                  {stats.pendingVerifications > 0 && (
                    <span className="ml-1.5 bg-warning text-warning-foreground text-xs px-1.5 py-0.5 rounded-full">
                      {stats.pendingVerifications}
                    </span>
                  )}
                </Button>
              </Link>
              <Link to="/teacher/raffle">
                <Button variant="ghost" size="sm">
                  <Ticket className="w-4 h-4 mr-1.5" />
                  Raffle
                </Button>
              </Link>
              <Link to="/teacher/assignments/new">
                <Button variant="ghost" size="sm">
                  <FilePlus2 className="w-4 h-4 mr-1.5" />
                  New Assignment
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

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Welcome */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-extrabold text-foreground mb-2">
            Welcome{isNewTeacher ? "" : " back"}, <span className="text-gradient-primary">{teacherName}</span>
          </h2>
          <p className="text-muted-foreground">
            {isNewTeacher 
              ? "Let's get started by creating your first class!"
              : "Here's what's happening with your classes today."
            }
          </p>
        </motion.section>

        {/* New Teacher Welcome */}
        {isNewTeacher && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Create Your First Class</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create a class to get a unique code that students can use to join. 
                You can also pre-register students by email.
              </p>
              <Dialog open={createClassOpen} onOpenChange={setCreateClassOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" variant="default">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Class
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a New Class</DialogTitle>
                    <DialogDescription>
                      Set up your class and get a unique code for students to join.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="className">Class Name *</Label>
                      <Input
                        id="className"
                        placeholder="e.g., Algebra II - Period 2"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Select value={newClassSubject} onValueChange={setNewClassSubject}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBJECTS.map(s => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gradeBand">Grade Level</Label>
                      <Select value={newClassGradeBand} onValueChange={setNewClassGradeBand}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade level" />
                        </SelectTrigger>
                        <SelectContent>
                          {GRADE_BANDS.map(g => (
                            <SelectItem key={g.value} value={g.value}>
                              {g.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleCreateClass}
                      disabled={creatingClass}
                    >
                      {creatingClass ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      Create Class
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </motion.section>
        )}

        {/* Stats Grid - Only show if teacher has classes */}
        {!isNewTeacher && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<Users className="w-6 h-6" />}
                label="Students"
                value={stats.totalStudents}
                color="primary"
              />
              <StatCard
                icon={<BookOpen className="w-6 h-6" />}
                label="Active Assignments"
                value={stats.activeAssignments}
                color="secondary"
              />
              <StatCard
                icon={<CheckCircle2 className="w-6 h-6" />}
                label="Completion Rate"
                value={`${stats.completionRate}%`}
                color="success"
              />
              <StatCard
                icon={<Clock className="w-6 h-6" />}
                label="Pending Review"
                value={stats.pendingVerifications}
                color="warning"
                highlight={stats.pendingVerifications > 0}
              />
            </div>
          </motion.section>
        )}

        {/* Pending Verifications Alert */}
        {stats.pendingVerifications > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-warning" />
                <div>
                  <p className="font-bold text-foreground">
                    {stats.pendingVerifications} paper submissions need review
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Students are waiting for their rewards!
                  </p>
                </div>
              </div>
              <Link to="/teacher/verify">
                <Button variant="warning" size="sm">
                  Review Now
                </Button>
              </Link>
            </div>
          </motion.section>
        )}

        {/* Classes */}
        {!isNewTeacher && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Your Classes</h3>
              <div className="flex items-center gap-2">
                {students.length > 0 && (
                  <>
                    <StudentStatusRecorder
                      students={students}
                      classId={classes[0]?.id}
                      onStatusRecorded={() => {
                        toast({
                          title: "Status Logged",
                          description: "Student status has been recorded.",
                        });
                      }}
                    />
                    <PointDeductionDialog 
                      students={students} 
                      classId={classes[0]?.id}
                      onDeductionComplete={() => {
                        toast({
                          title: "Points Updated",
                          description: "Student points have been updated.",
                        });
                        fetchTeacherData();
                      }}
                    />
                  </>
                )}
                <Link to="/teacher/assignments/new">
                  <Button variant="default" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Create Assignment
                  </Button>
                </Link>
                <Dialog open={createClassOpen} onOpenChange={setCreateClassOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Class
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create a New Class</DialogTitle>
                      <DialogDescription>
                        Set up your class and get a unique code for students to join.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="className2">Class Name *</Label>
                        <Input
                          id="className2"
                          placeholder="e.g., Algebra II - Period 2"
                          value={newClassName}
                          onChange={(e) => setNewClassName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject2">Subject</Label>
                        <Select value={newClassSubject} onValueChange={setNewClassSubject}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {SUBJECTS.map(s => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gradeBand2">Grade Level</Label>
                        <Select value={newClassGradeBand} onValueChange={setNewClassGradeBand}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade level" />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADE_BANDS.map(g => (
                              <SelectItem key={g.value} value={g.value}>
                                {g.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={handleCreateClass}
                        disabled={creatingClass}
                      >
                        {creatingClass ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4 mr-2" />
                        )}
                        Create Class
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {classes.map((cls, index) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <div className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-foreground text-lg">{cls.name}</h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => copyClassCode(cls.class_code)}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            Code: <span className="font-mono font-bold">{cls.class_code}</span>
                            <Copy className="w-3 h-3" />
                          </button>
                          {cls.grade_band && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              Grades {cls.grade_band}
                            </span>
                          )}
                          {cls.subject && (
                            <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
                              {cls.subject}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        {cls.studentCount} students
                      </div>
                      {cls.pendingVerifications > 0 && (
                        <div className="flex items-center gap-1 text-warning">
                          <Clock className="w-4 h-4" />
                          {cls.pendingVerifications} pending
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-xl font-bold text-foreground mb-4">Recent Activity</h3>
            
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {recentActivity.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`px-5 py-4 flex items-center justify-between ${
                    index !== recentActivity.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.action === "completed" ? "bg-success/10" :
                      activity.action === "submitted" ? "bg-warning/10" :
                      "bg-primary/10"
                    }`}>
                      {activity.action === "completed" ? "✅" :
                       activity.action === "submitted" ? "📝" : "▶️"}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        <span className="text-primary">{activity.student}</span>
                        {" "}{activity.action}{" "}
                        <span className="text-muted-foreground">{activity.assignment}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Integration Info */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid gap-4 md:grid-cols-2"
        >
          <div className="bg-muted/50 rounded-2xl p-6 flex items-start gap-4">
            <img 
              src={nycologicLogo} 
              alt="NYClogic Ai" 
              className="w-16 h-16 object-contain"
            />
            <div className="flex-1">
              <h3 className="font-bold text-foreground mb-2">NYClogic Ai Integration</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect with NYClogic Ai to automatically push assignments and student profiles.
              </p>
              <Link to="/teacher/integrations">
                <Button variant="outline" size="sm">
                  Configure Integration
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-gold/5 rounded-2xl p-6 border border-gold/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                <Ticket className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Raffle Manager</h3>
                <p className="text-xs text-muted-foreground">Create & draw winners</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Create raffles, manage entries, and select winners with animated reveals!
            </p>
            <Link to="/teacher/raffle">
              <Button variant="outline" size="sm">
                Manage Raffles
              </Button>
            </Link>
          </div>

          <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">External API</h3>
                <p className="text-xs text-muted-foreground">Connect other sites</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Generate API tokens for external sites to read student data and create assignments.
            </p>
            <Link to="/teacher/api">
              <Button variant="outline" size="sm">
                Manage API Tokens
              </Button>
            </Link>
          </div>
        </motion.section>

        {/* Powered by Footer */}
        <PoweredByFooter />
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: "primary" | "secondary" | "success" | "warning";
  highlight?: boolean;
}) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`bg-card rounded-2xl p-4 border ${
        highlight ? "border-warning" : "border-border"
      } shadow-sm`}
    >
      <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-extrabold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </motion.div>
  );
}
