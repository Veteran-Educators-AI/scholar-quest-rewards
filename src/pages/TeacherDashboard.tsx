import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  LayoutDashboard
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import nycologicLogo from "@/assets/nycologic-ai-logo.png";
import { PointDeductionDialog } from "@/components/PointDeductionDialog";
import { StudentStatusRecorder } from "@/components/StudentStatusRecorder";
import { PoweredByFooter } from "@/components/PoweredByFooter";

// Demo data
const demoTeacher = {
  name: "Ms. Johnson",
};

const demoClasses = [
  {
    id: "1",
    name: "Algebra II - Period 2",
    code: "ALG2-P2",
    gradeBand: "11-12",
    studentCount: 28,
    pendingVerifications: 3,
  },
  {
    id: "2",
    name: "Geometry - Period 4",
    code: "GEO-P4",
    gradeBand: "9-10",
    studentCount: 26,
    pendingVerifications: 1,
  },
  {
    id: "3",
    name: "AP Calculus AB",
    code: "APCALC",
    gradeBand: "11-12",
    studentCount: 22,
    pendingVerifications: 0,
  },
];

const demoStats = {
  totalStudents: 46,
  activeAssignments: 5,
  completionRate: 78,
  pendingVerifications: 4,
};

// Demo students for point deduction
const demoStudents = [
  { id: "demo-1", full_name: "Alex Johnson", coins: 150 },
  { id: "demo-2", full_name: "Jordan Smith", coins: 230 },
  { id: "demo-3", full_name: "Taylor Brown", coins: 85 },
  { id: "demo-4", full_name: "Morgan Davis", coins: 320 },
  { id: "demo-5", full_name: "Casey Wilson", coins: 175 },
];

const demoRecentActivity = [
  { id: "1", student: "Alex", action: "completed", assignment: "Quadratic Equations (AI-A.REI.3)", time: "5 min ago" },
  { id: "2", student: "Jordan", action: "submitted", assignment: "Hamlet Analysis (RL.9-10.2)", time: "12 min ago" },
  { id: "3", student: "Taylor", action: "started", assignment: "Cell Division Lab (LE.1.1)", time: "25 min ago" },
  { id: "4", student: "Morgan", action: "completed", assignment: "Triangle Proofs (GEO-G.SRT.4)", time: "45 min ago" },
];

export default function TeacherDashboard() {
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "See you next time!",
    });
  };

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
                  alt="NYCologic Ai" 
                  className="w-8 h-8 object-contain"
                />
                <div className="hidden sm:block">
                  <p className="text-xs text-muted-foreground leading-none">Powered by</p>
                  <p className="text-sm font-semibold text-foreground leading-tight">NYCologic Ai™</p>
                </div>
              </div>
              <div className="hidden md:block">
                <h1 className="font-bold text-foreground text-xl">NYCologic Scholar</h1>
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
              <Link to="/teacher/verify">
                <Button variant="ghost" size="sm">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Verify
                  {demoStats.pendingVerifications > 0 && (
                    <span className="ml-1.5 bg-warning text-warning-foreground text-xs px-1.5 py-0.5 rounded-full">
                      {demoStats.pendingVerifications}
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
            Welcome back, <span className="text-gradient-primary">{demoTeacher.name}</span>
          </h2>
          <p className="text-muted-foreground">Here's what's happening with your classes today.</p>
        </motion.section>

        {/* Stats Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Users className="w-6 h-6" />}
              label="Students"
              value={demoStats.totalStudents}
              color="primary"
            />
            <StatCard
              icon={<BookOpen className="w-6 h-6" />}
              label="Active Assignments"
              value={demoStats.activeAssignments}
              color="secondary"
            />
            <StatCard
              icon={<CheckCircle2 className="w-6 h-6" />}
              label="Completion Rate"
              value={`${demoStats.completionRate}%`}
              color="success"
            />
            <StatCard
              icon={<Clock className="w-6 h-6" />}
              label="Pending Review"
              value={demoStats.pendingVerifications}
              color="warning"
              highlight={demoStats.pendingVerifications > 0}
            />
          </div>
        </motion.section>

        {/* Pending Verifications Alert */}
        {demoStats.pendingVerifications > 0 && (
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
                    {demoStats.pendingVerifications} paper submissions need review
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
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground">Your Classes</h3>
            <div className="flex items-center gap-2">
              <StudentStatusRecorder
                students={demoStudents}
                classId="demo-class-1"
                onStatusRecorded={() => {
                  toast({
                    title: "Status Logged",
                    description: "Student status has been recorded.",
                  });
                }}
              />
              <PointDeductionDialog 
                students={demoStudents} 
                classId="demo-class-1"
                onDeductionComplete={() => {
                  toast({
                    title: "Points Updated",
                    description: "Student points have been updated.",
                  });
                }}
              />
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Class
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {demoClasses.map((cls, index) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Link to={`/teacher/class/${cls.id}`}>
                  <div className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-foreground text-lg">{cls.name}</h4>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground">Code: {cls.code}</p>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Grades {cls.gradeBand}
                          </span>
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
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Recent Activity */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-xl font-bold text-foreground mb-4">Recent Activity</h3>
          
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {demoRecentActivity.map((activity, index) => (
              <div
                key={activity.id}
                className={`px-5 py-4 flex items-center justify-between ${
                  index !== demoRecentActivity.length - 1 ? "border-b border-border" : ""
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
              alt="NYCologic Ai" 
              className="w-16 h-16 object-contain"
            />
            <div className="flex-1">
              <h3 className="font-bold text-foreground mb-2">NYCologic Ai Integration</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect with NYCologic Ai to automatically push assignments and student profiles.
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
