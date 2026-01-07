import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { XPBar } from "@/components/XPBar";
import { StreakCounter } from "@/components/StreakCounter";
import { CoinCounter } from "@/components/CoinCounter";
import { BadgeCard } from "@/components/BadgeCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Users,
  Trophy,
  Flame,
  Star,
  TrendingUp,
  Calendar,
  Plus,
  LogOut,
  Loader2,
  UserPlus,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LinkedStudent {
  id: string;
  student_id: string;
  verified: boolean;
  relationship: string;
  student_name: string;
  student_profile: {
    xp: number;
    coins: number;
    current_streak: number;
    longest_streak: number;
    streak_shield_available: boolean;
  } | null;
  recent_badges: { id: string; name: string; earned_at: string }[];
  recent_rewards: { id: string; xp_delta: number; coin_delta: number; reason: string; created_at: string }[];
}

// Demo data for display
const demoStudents: LinkedStudent[] = [
  {
    id: "1",
    student_id: "demo-1",
    verified: true,
    relationship: "parent",
    student_name: "Alex Johnson",
    student_profile: {
      xp: 1250,
      coins: 340,
      current_streak: 7,
      longest_streak: 14,
      streak_shield_available: true,
    },
    recent_badges: [
      { id: "1", name: "Week Warrior", earned_at: new Date(Date.now() - 86400000).toISOString() },
      { id: "2", name: "Math Master", earned_at: new Date(Date.now() - 172800000).toISOString() },
    ],
    recent_rewards: [
      { id: "1", xp_delta: 50, coin_delta: 10, reason: "Assignment completed: Math Magic", created_at: new Date(Date.now() - 3600000).toISOString() },
      { id: "2", xp_delta: 75, coin_delta: 15, reason: "Assignment completed: Reading Ch 5", created_at: new Date(Date.now() - 86400000).toISOString() },
    ],
  },
  {
    id: "2",
    student_id: "demo-2",
    verified: true,
    relationship: "parent",
    student_name: "Sam Johnson",
    student_profile: {
      xp: 850,
      coins: 210,
      current_streak: 3,
      longest_streak: 5,
      streak_shield_available: true,
    },
    recent_badges: [
      { id: "3", name: "3-Day Streak", earned_at: new Date(Date.now() - 86400000).toISOString() },
    ],
    recent_rewards: [
      { id: "3", xp_delta: 60, coin_delta: 12, reason: "Assignment completed: Science Quiz", created_at: new Date(Date.now() - 7200000).toISOString() },
    ],
  },
];

export default function ParentDashboard() {
  const { toast } = useToast();
  const [students, setStudents] = useState<LinkedStudent[]>(demoStudents);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<LinkedStudent | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkEmail, setLinkEmail] = useState("");
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    fetchLinkedStudents();
  }, []);

  const fetchLinkedStudents = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: links, error } = await supabase
        .from('parent_students')
        .select('*')
        .eq('parent_id', user.id);

      if (error) throw error;

      if (!links || links.length === 0) {
        setStudents(demoStudents); // Show demo data if no linked students
        return;
      }

      const studentsWithDetails = await Promise.all(
        links.map(async (link) => {
          // Get profile name
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', link.student_id)
            .single();

          // Get student profile stats
          const { data: studentProfile } = await supabase
            .from('student_profiles')
            .select('xp, coins, current_streak, longest_streak, streak_shield_available')
            .eq('user_id', link.student_id)
            .single();

          // Get recent badges
          const { data: badges } = await supabase
            .from('student_badges')
            .select('id, badge_id, earned_at, badges(name)')
            .eq('student_id', link.student_id)
            .order('earned_at', { ascending: false })
            .limit(5);

          // Get recent rewards
          const { data: rewards } = await supabase
            .from('reward_ledger')
            .select('id, xp_delta, coin_delta, reason, created_at')
            .eq('student_id', link.student_id)
            .order('created_at', { ascending: false })
            .limit(10);

          return {
            id: link.id,
            student_id: link.student_id,
            verified: link.verified,
            relationship: link.relationship,
            student_name: profile?.full_name || 'Unknown Student',
            student_profile: studentProfile,
            recent_badges: badges?.map(b => ({
              id: b.id,
              name: (b.badges as any)?.name || 'Badge',
              earned_at: b.earned_at,
            })) || [],
            recent_rewards: rewards || [],
          };
        })
      );

      setStudents(studentsWithDetails);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkStudent = async () => {
    if (!linkEmail.trim()) return;
    
    setLinking(true);
    try {
      // In a real app, this would send an invitation or look up the student
      // For now, we'll show a message that this requires teacher verification
      toast({
        title: "Link Request Sent",
        description: "A verification request has been sent. The teacher will need to approve this link.",
      });
      setShowLinkDialog(false);
      setLinkEmail("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send link request",
        variant: "destructive",
      });
    } finally {
      setLinking(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "See you next time!",
    });
  };

  const getLevel = (xp: number) => Math.floor(xp / 500) + 1;
  const getXpProgress = (xp: number) => xp % 500;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-foreground text-xl">Parent Dashboard</h1>
                <p className="text-sm text-muted-foreground">Monitor your children's progress</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowLinkDialog(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Link Child
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={handleLogout}>
                <LogOut className="w-5 h-5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : students.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">No Children Linked</h2>
            <p className="text-muted-foreground mb-6">Link your child's account to monitor their progress.</p>
            <Button onClick={() => setShowLinkDialog(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Link a Child
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Overview Cards */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-lg font-bold text-foreground mb-4">Your Children</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {students.filter(s => s.verified).map((student, index) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-2xl p-5 border border-border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                          <span className="text-xl font-bold text-primary-foreground">
                            {student.student_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">{student.student_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Level {student.student_profile ? getLevel(student.student_profile.xp) : 1}
                          </p>
                        </div>
                      </div>
                      {student.student_profile && (
                        <StreakCounter 
                          streak={student.student_profile.current_streak} 
                          hasShield={student.student_profile.streak_shield_available}
                          size="sm"
                        />
                      )}
                    </div>

                    {student.student_profile && (
                      <>
                        <XPBar
                          currentXP={getXpProgress(student.student_profile.xp)}
                          xpForNextLevel={500}
                          level={getLevel(student.student_profile.xp)}
                          size="sm"
                          className="mb-3"
                        />

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Star className="w-4 h-4 text-primary" />
                            <span>{student.student_profile.xp} XP</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Trophy className="w-4 h-4 text-gold" />
                            <span>{student.recent_badges.length} badges</span>
                          </div>
                          <CoinCounter coins={student.student_profile.coins} size="sm" />
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}

                {/* Pending verifications */}
                {students.filter(s => !s.verified).map((student) => (
                  <div
                    key={student.id}
                    className="bg-muted/50 rounded-2xl p-5 border border-dashed border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                        <Clock className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium text-muted-foreground">Pending Verification</h3>
                        <p className="text-sm text-muted-foreground">
                          Waiting for teacher approval
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Recent Activity */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-lg font-bold text-foreground mb-4">Recent Activity</h2>
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                {students
                  .filter(s => s.verified)
                  .flatMap(s => s.recent_rewards.map(r => ({ ...r, student_name: s.student_name })))
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 10)
                  .map((activity, index, arr) => (
                    <div
                      key={activity.id}
                      className={`px-5 py-4 flex items-center gap-4 ${
                        index !== arr.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          <span className="text-primary">{activity.student_name}</span>
                          {" "}completed an assignment
                        </p>
                        <p className="text-sm text-muted-foreground truncate">{activity.reason}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium text-success">+{activity.xp_delta} XP</p>
                        <p className="text-xs text-muted-foreground">{formatTime(activity.created_at)}</p>
                      </div>
                    </div>
                  ))}

                {students.filter(s => s.verified).flatMap(s => s.recent_rewards).length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    No recent activity
                  </div>
                )}
              </div>
            </motion.section>

            {/* Recent Badges */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-lg font-bold text-foreground mb-4">Recent Badges Earned</h2>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {students
                  .filter(s => s.verified)
                  .flatMap(s => s.recent_badges.map(b => ({ ...b, student_name: s.student_name })))
                  .sort((a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime())
                  .slice(0, 6)
                  .map((badge, index) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex-shrink-0"
                    >
                      <BadgeCard
                        name={badge.name}
                        description={`Earned by ${badge.student_name}`}
                        earned={true}
                        earnedAt={badge.earned_at}
                        size="sm"
                      />
                    </motion.div>
                  ))}

                {students.filter(s => s.verified).flatMap(s => s.recent_badges).length === 0 && (
                  <div className="w-full p-8 text-center text-muted-foreground bg-card rounded-2xl border border-border">
                    No badges earned yet
                  </div>
                )}
              </div>
            </motion.section>
          </>
        )}
      </main>

      {/* Student Detail Modal */}
      <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedStudent && selectedStudent.student_profile && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-foreground">
                      {selectedStudent.student_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <DialogTitle>{selectedStudent.student_name}</DialogTitle>
                    <DialogDescription>
                      Level {getLevel(selectedStudent.student_profile.xp)} Scholar
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted rounded-xl p-4 text-center">
                    <Star className="w-6 h-6 text-primary mx-auto mb-1" />
                    <p className="text-2xl font-bold text-foreground">{selectedStudent.student_profile.xp}</p>
                    <p className="text-xs text-muted-foreground">Total XP</p>
                  </div>
                  <div className="bg-muted rounded-xl p-4 text-center">
                    <Flame className="w-6 h-6 text-streak mx-auto mb-1" />
                    <p className="text-2xl font-bold text-foreground">{selectedStudent.student_profile.current_streak}</p>
                    <p className="text-xs text-muted-foreground">Day Streak</p>
                  </div>
                  <div className="bg-muted rounded-xl p-4 text-center">
                    <Trophy className="w-6 h-6 text-gold mx-auto mb-1" />
                    <p className="text-2xl font-bold text-foreground">{selectedStudent.recent_badges.length}</p>
                    <p className="text-xs text-muted-foreground">Badges</p>
                  </div>
                  <div className="bg-muted rounded-xl p-4 text-center">
                    <TrendingUp className="w-6 h-6 text-success mx-auto mb-1" />
                    <p className="text-2xl font-bold text-foreground">{selectedStudent.student_profile.longest_streak}</p>
                    <p className="text-xs text-muted-foreground">Best Streak</p>
                  </div>
                </div>

                {/* XP Progress */}
                <div>
                  <h4 className="font-medium text-foreground mb-2">Level Progress</h4>
                  <XPBar
                    currentXP={getXpProgress(selectedStudent.student_profile.xp)}
                    xpForNextLevel={500}
                    level={getLevel(selectedStudent.student_profile.xp)}
                  />
                </div>

                {/* Recent Badges */}
                {selectedStudent.recent_badges.length > 0 && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Recent Badges</h4>
                    <div className="flex gap-2 flex-wrap">
                      {selectedStudent.recent_badges.map(badge => (
                        <BadgeCard
                          key={badge.id}
                          name={badge.name}
                          earned={true}
                          size="sm"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                {selectedStudent.recent_rewards.length > 0 && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Recent Activity</h4>
                    <div className="space-y-2">
                      {selectedStudent.recent_rewards.slice(0, 5).map(reward => (
                        <div key={reward.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground truncate flex-1">{reward.reason}</span>
                          <span className="text-success font-medium ml-2">+{reward.xp_delta} XP</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Link Child Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link a Child</DialogTitle>
            <DialogDescription>
              Enter your child's email or student code to request access to their progress.
              A teacher will need to verify this connection.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="student-email">Student Email or Code</Label>
              <Input
                id="student-email"
                placeholder="student@school.edu or ABC123"
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
              />
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                For privacy and safety, a teacher must approve parent-student connections.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleLinkStudent} disabled={!linkEmail.trim() || linking}>
              {linking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
