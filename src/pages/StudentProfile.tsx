import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Trophy, 
  Flame, 
  Target, 
  BookOpen, 
  Calculator, 
  Calendar,
  ChevronLeft,
  Sparkles,
  TrendingUp,
  Award,
  Loader2,
  Users,
  Plus,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { ScholarBuddy } from "@/components/ScholarBuddy";
import { XPBar } from "@/components/XPBar";
import { StreakCounter } from "@/components/StreakCounter";
import { CoinCounter } from "@/components/CoinCounter";
import { BadgeCard } from "@/components/BadgeCard";
import { CollectibleCard } from "@/components/CollectibleCard";
import { AvatarCustomizer, AvatarPreview } from "@/components/AvatarCustomizer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PoweredByFooter } from "@/components/PoweredByFooter";

type Rarity = "common" | "rare" | "epic" | "legendary";
type Slot = "frame" | "background" | "hat" | "pet" | "accessory";

interface Collectible {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string | null;
  rarity: Rarity;
  slot: Slot;
  earned: boolean;
}

interface EquippedItems {
  frame?: Collectible;
  background?: Collectible;
  hat?: Collectible;
  pet?: Collectible;
}

interface ProfileData {
  name: string;
  avatar: string | null;
  level: number;
  xp: number;
  xpForNextLevel: number;
  coins: number;
  streak: number;
  longestStreak: number;
  hasShield: boolean;
  joinedAt: Date;
  gradeLevel: number | null;
  totalAssignmentsCompleted: number;
  totalXpEarned: number;
  averageScore: number;
}

interface StatsData {
  readingLevel: string;
  mathLevel: string;
  strengths: string[];
  areasToImprove: string[];
  recentSubjects: { name: string; assignments: number; avgScore: number }[];
}

interface BadgeData {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  earned: boolean;
  earnedAt?: string;
}

export default function StudentProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [loading, setLoading] = useState(true);
  const [badgesLoading, setBadgesLoading] = useState(true);
  const [collectiblesLoading, setCollectiblesLoading] = useState(true);
  const [classesLoading, setClassesLoading] = useState(true);
  const [equippedItems, setEquippedItems] = useState<EquippedItems>({});
  const [joinClassOpen, setJoinClassOpen] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [joiningClass, setJoiningClass] = useState(false);
  const [joinResult, setJoinResult] = useState<{ success: boolean; message: string } | null>(null);
  const [enrolledClasses, setEnrolledClasses] = useState<{ id: string; name: string; teacherName: string }[]>([]);

  const handleJoinClass = async () => {
    if (!classCode.trim()) return;
    
    setJoiningClass(true);
    setJoinResult(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find the class by code
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("id, name")
        .eq("class_code", classCode.trim().toUpperCase())
        .single();

      if (classError || !classData) {
        setJoinResult({ success: false, message: "Class not found. Check the code and try again." });
        return;
      }

      // Check if already enrolled
      const { data: existingEnrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("student_id", user.id)
        .eq("class_id", classData.id)
        .single();

      if (existingEnrollment) {
        setJoinResult({ success: true, message: `You're already enrolled in ${classData.name}!` });
        return;
      }

      // Enroll the student
      const { error: enrollError } = await supabase
        .from("enrollments")
        .insert({
          student_id: user.id,
          class_id: classData.id,
        });

      if (enrollError) throw enrollError;

      setJoinResult({ success: true, message: `Successfully joined ${classData.name}!` });
      toast.success(`Joined ${classData.name}! 🎉`);
      setClassCode("");
      
      // Refresh enrolled classes
      fetchEnrolledClasses(user.id);
    } catch (error) {
      console.error("Error joining class:", error);
      setJoinResult({ success: false, message: "Something went wrong. Please try again." });
    } finally {
      setJoiningClass(false);
    }
  };

  const fetchEnrolledClasses = async (userId: string) => {
    setClassesLoading(true);
    const { data: enrollments, error } = await supabase
      .from("enrollments")
      .select("class_id, classes(id, name, teacher_id, profiles:teacher_id(full_name))")
      .eq("student_id", userId);

    if (error) {
      console.error("Error fetching classes:", error);
      setClassesLoading(false);
      return;
    }

    if (enrollments) {
      const classes = enrollments
        .map((e: any) => ({
          id: e.classes?.id || "",
          name: e.classes?.name || "Unknown Class",
          teacherName: e.classes?.profiles?.full_name || "Unknown Teacher",
        }))
        .filter((c) => c.id);
      setEnrolledClasses(classes);
    }
    setClassesLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const loadBadges = async (userId: string) => {
      setBadgesLoading(true);
      try {
        const [{ data: allBadges, error: badgesError }, { data: earnedBadges, error: earnedError }] =
          await Promise.all([
            supabase.from("badges").select("id, name, description, icon_url"),
            supabase
              .from("student_badges")
              .select("badge_id, earned_at")
              .eq("student_id", userId),
          ]);

        if (badgesError) throw badgesError;
        if (earnedError) throw earnedError;

        const earnedMap = new Map(earnedBadges?.map((eb) => [eb.badge_id, eb.earned_at]) || []);

        if (cancelled) return;
        setBadges(
          (allBadges || []).map((b) => ({
            id: b.id,
            name: b.name,
            description: b.description,
            iconUrl: b.icon_url,
            earned: earnedMap.has(b.id),
            earnedAt: earnedMap.get(b.id),
          }))
        );
      } catch (error) {
        console.error("Error fetching badges:", error);
      } finally {
        if (!cancelled) setBadgesLoading(false);
      }
    };

    const loadCollectibles = async (userId: string) => {
      setCollectiblesLoading(true);
      try {
        const [
          { data: allCollectibles, error: collectiblesError },
          { data: earnedCollectibles, error: earnedError },
        ] = await Promise.all([
          supabase.from("collectibles").select("id, name, description, image_url, rarity, slot"),
          supabase.from("student_collectibles").select("collectible_id").eq("student_id", userId),
        ]);

        if (collectiblesError) throw collectiblesError;
        if (earnedError) throw earnedError;

        const earnedCollectibleIds = new Set(
          earnedCollectibles?.map((ec) => ec.collectible_id) || []
        );

        const mappedCollectibles: Collectible[] = (allCollectibles || []).map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description || undefined,
          imageUrl: c.image_url,
          rarity: c.rarity as Rarity,
          slot: (c.slot as Slot) || "accessory",
          earned: earnedCollectibleIds.has(c.id),
        }));

        if (cancelled) return;
        setCollectibles(mappedCollectibles);

        const { data: equipped, error: equippedError } = await supabase
          .from("equipped_items")
          .select("slot, collectible_id")
          .eq("student_id", userId);

        if (equippedError) throw equippedError;
        if (cancelled) return;

        if (equipped) {
          const equippedMap: EquippedItems = {};
          equipped.forEach((e) => {
            const collectible = mappedCollectibles.find((c) => c.id === e.collectible_id);
            if (collectible && e.slot) {
              equippedMap[e.slot as Slot] = collectible;
            }
          });
          setEquippedItems(equippedMap);
        }
      } catch (error) {
        console.error("Error fetching collectibles:", error);
      } finally {
        if (!cancelled) setCollectiblesLoading(false);
      }
    };

    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          setBadgesLoading(false);
          setCollectiblesLoading(false);
          setClassesLoading(false);
          return;
        }

        loadBadges(user.id);
        loadCollectibles(user.id);
        fetchEnrolledClasses(user.id);

        const [
          { data: userProfile, error: profileError },
          { data: studentProfile, error: studentError },
          { data: attempts, error: attemptsError },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("full_name, avatar_url, created_at")
            .eq("id", user.id)
            .single(),
          supabase
            .from("student_profiles")
            .select(
              "xp, coins, current_streak, longest_streak, streak_shield_available, grade_level, reading_level, math_level, strengths, weaknesses"
            )
            .eq("user_id", user.id)
            .single(),
          supabase
            .from("attempts")
            .select("score")
            .eq("student_id", user.id)
            .eq("status", "verified"),
        ]);

        if (profileError) console.error("Error fetching profile:", profileError);
        if (studentError) console.error("Error fetching student profile:", studentError);
        if (attemptsError) console.error("Error fetching attempts:", attemptsError);

        const verifiedAttempts = attempts || [];
        const completedCount = verifiedAttempts.length;
        const avgScore =
          completedCount > 0
            ? Math.round(
                (verifiedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) || 0) /
                  completedCount
              )
            : 0;

        const totalXp = studentProfile?.xp || 0;
        const level = Math.floor(totalXp / 500) + 1;
        const currentLevelXp = totalXp - (level - 1) * 500;

        if (cancelled) return;
        setProfile({
          name: userProfile?.full_name || user.email?.split("@")[0] || "Scholar",
          avatar: userProfile?.avatar_url || null,
          level,
          xp: currentLevelXp,
          xpForNextLevel: 500,
          coins: studentProfile?.coins || 0,
          streak: studentProfile?.current_streak || 0,
          longestStreak: studentProfile?.longest_streak || 0,
          hasShield: studentProfile?.streak_shield_available || false,
          joinedAt: new Date(userProfile?.created_at || Date.now()),
          gradeLevel: studentProfile?.grade_level || null,
          totalAssignmentsCompleted: completedCount,
          totalXpEarned: totalXp,
          averageScore: avgScore,
        });

        setStats({
          readingLevel: studentProfile?.reading_level || "Not assessed",
          mathLevel: studentProfile?.math_level || "Not assessed",
          strengths: studentProfile?.strengths || [],
          areasToImprove: studentProfile?.weaknesses || [],
          recentSubjects: [],
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProfileData();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleEquip = useCallback((slot: Slot, collectible: Collectible | null) => {
    setEquippedItems((prev) => ({
      ...prev,
      [slot]: collectible ?? undefined,
    }));
    if (collectible) {
      toast.success(`Equipped ${collectible.name}!`);
    } else {
      toast.info(`Removed ${slot}`);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Default values for new users
  const displayProfile = profile || {
    name: "Scholar",
    avatar: null,
    level: 1,
    xp: 0,
    xpForNextLevel: 500,
    coins: 0,
    streak: 0,
    longestStreak: 0,
    hasShield: false,
    joinedAt: new Date(),
    gradeLevel: null,
    totalAssignmentsCompleted: 0,
    totalXpEarned: 0,
    averageScore: 0,
  };

  const displayStats = stats || {
    readingLevel: "Not assessed",
    mathLevel: "Not assessed",
    strengths: [],
    areasToImprove: [],
    recentSubjects: [],
  };

  const earnedBadges = badges.filter(b => b.earned);
  const earnedCollectibles = collectibles.filter(c => c.earned);
  const daysSinceJoin = Math.floor((Date.now() - displayProfile.joinedAt.getTime()) / (1000 * 60 * 60 * 24));
  const remainingXp = Math.max(displayProfile.xpForNextLevel - displayProfile.xp, 0);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="bg-gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to="/student">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
                <ChevronLeft className="w-6 h-6" />
              </Button>
            </Link>
            <h1 className="font-bold text-lg">My Profile</h1>
          </div>
        </div>

        {/* Profile Card */}
        <div className="container mx-auto px-4 pb-8 pt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card text-card-foreground rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-6">
              <AvatarCustomizer
                collectibles={collectibles}
                equippedItems={equippedItems}
                onEquip={handleEquip}
                userName={displayProfile.name}
              />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">{displayProfile.name}</h2>
                <p className="text-muted-foreground">
                  {displayProfile.gradeLevel === 9 ? "Freshman" : 
                   displayProfile.gradeLevel === 10 ? "Sophomore" : 
                   displayProfile.gradeLevel === 11 ? "Junior" : 
                   displayProfile.gradeLevel === 12 ? "Senior" : 
                   displayProfile.gradeLevel ? `Grade ${displayProfile.gradeLevel}` : ""} Scholar
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Joined {daysSinceJoin} days ago</span>
                </div>
              </div>
            </div>

            <XPBar
              currentXP={displayProfile.xp}
              xpForNextLevel={displayProfile.xpForNextLevel}
              level={displayProfile.level}
            />

            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="bg-muted rounded-xl p-3 text-center">
                <CoinCounter coins={displayProfile.coins} size="sm" />
                <p className="text-xs text-muted-foreground mt-1">Total Coins</p>
              </div>
              <div className="flex justify-center">
                <div className="text-center">
                  <StreakCounter streak={displayProfile.streak} hasShield={displayProfile.hasShield} size="sm" />
                  <p className="text-xs text-muted-foreground mt-1">Current Streak</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      <main className="container mx-auto px-4 -mt-4 space-y-6">
        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <StatCard
            icon={<Target className="w-5 h-5 text-primary" />}
            value={displayProfile.totalAssignmentsCompleted}
            label="Missions Complete"
          />
          <StatCard
            icon={<Sparkles className="w-5 h-5 text-gold" />}
            value={displayProfile.totalXpEarned.toLocaleString()}
            label="Total XP Earned"
          />
          <StatCard
            icon={<Flame className="w-5 h-5 text-streak" />}
            value={displayProfile.longestStreak}
            label="Longest Streak"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-success" />}
            value={`${displayProfile.averageScore}%`}
            label="Average Score"
          />
        </motion.div>

        {/* My Classes Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl p-6 border border-border"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg text-foreground">My Classes</h3>
            </div>
            <Dialog open={joinClassOpen} onOpenChange={setJoinClassOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="w-4 h-4" />
                  Join Class
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Join a Class</DialogTitle>
                  <DialogDescription>
                    Enter the class code from your teacher to join their class.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="classCodeInput">Class Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="classCodeInput"
                        placeholder="Enter code (e.g., ABC123)"
                        value={classCode}
                        onChange={(e) => {
                          setClassCode(e.target.value.toUpperCase());
                          setJoinResult(null);
                        }}
                        className="text-center text-lg font-mono tracking-widest uppercase"
                        maxLength={10}
                        disabled={joiningClass}
                      />
                      <Button
                        onClick={handleJoinClass}
                        disabled={!classCode.trim() || joiningClass}
                      >
                        {joiningClass ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Join"
                        )}
                      </Button>
                    </div>
                  </div>

                  {joinResult && (
                    <div
                      className={`flex items-center gap-2 p-3 rounded-lg ${
                        joinResult.success
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {joinResult.success ? (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      )}
                      <span className="text-sm">{joinResult.message}</span>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {classesLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : enrolledClasses.length > 0 ? (
            <div className="space-y-2">
              {enrolledClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-xl"
                >
                  <div>
                    <p className="font-medium text-foreground">{cls.name}</p>
                    <p className="text-sm text-muted-foreground">Teacher: {cls.teacherName}</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-muted-foreground">No classes yet</p>
              <p className="text-sm text-muted-foreground">
                Get a class code from your teacher to join
              </p>
            </div>
          )}
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="achievements" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="achievements" className="flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Achievements</span>
            </TabsTrigger>
            <TabsTrigger value="collectibles" className="flex items-center gap-1">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Collectibles</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Learning</span>
            </TabsTrigger>
          </TabsList>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-foreground">Badges Earned</h3>
                <span className="text-sm text-muted-foreground">
                  {badgesLoading ? "Loading..." : `${earnedBadges.length} / ${badges.length}`}
                </span>
              </div>
              
              {badgesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {badges.map((badge, index) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <BadgeCard
                        name={badge.name}
                        description={badge.description}
                        iconUrl={badge.iconUrl}
                        earned={badge.earned}
                        earnedAt={badge.earnedAt}
                        size="md"
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Collectibles Tab */}
          <TabsContent value="collectibles">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-foreground">My Collection</h3>
                <span className="text-sm text-muted-foreground">
                  {collectiblesLoading
                    ? "Loading..."
                    : `${earnedCollectibles.length} / ${collectibles.length}`}
                </span>
              </div>
              
              {collectiblesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {collectibles.map((collectible, index) => (
                    <motion.div
                      key={collectible.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <CollectibleCard
                        name={collectible.name}
                        description={collectible.description}
                        imageUrl={collectible.imageUrl}
                        rarity={collectible.rarity}
                        earned={collectible.earned}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Learning Stats Tab */}
          <TabsContent value="stats">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Skill Levels */}
              <div className="bg-card rounded-2xl p-6 border border-border">
                <h3 className="font-bold text-lg text-foreground mb-4">Skill Levels</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                    <BookOpen className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">Reading</p>
                      <p className="text-sm text-muted-foreground">{displayStats.readingLevel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                    <Calculator className="w-8 h-8 text-secondary" />
                    <div>
                      <p className="font-semibold text-foreground">Math</p>
                      <p className="text-sm text-muted-foreground">{displayStats.mathLevel}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths */}
              <div className="bg-card rounded-2xl p-6 border border-border">
                <h3 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-gold" />
                  Strengths
                </h3>
                {displayStats.strengths.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {displayStats.strengths.map((strength, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-success/10 text-success rounded-full text-sm font-medium"
                      >
                        {strength}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Complete more assignments to discover your strengths!</p>
                )}
              </div>

              {/* Areas to Improve */}
              <div className="bg-card rounded-2xl p-6 border border-border">
                <h3 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-secondary" />
                  Keep Practicing
                </h3>
                {displayStats.areasToImprove.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {displayStats.areasToImprove.map((area, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-secondary/10 text-secondary rounded-full text-sm font-medium"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Keep completing assignments to track areas for improvement!</p>
                )}
              </div>

              {/* Subject Performance */}
              <div className="bg-card rounded-2xl p-6 border border-border">
                <h3 className="font-bold text-lg text-foreground mb-4">Subject Performance</h3>
                {displayStats.recentSubjects.length > 0 ? (
                  <div className="space-y-4">
                    {displayStats.recentSubjects.map((subject, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-foreground">{subject.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {subject.assignments} assignments · {subject.avgScore}% avg
                          </span>
                        </div>
                        <Progress value={subject.avgScore} className="h-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Complete assignments to see subject performance!</p>
                )}
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Scholar Buddy Tip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-primary rounded-2xl p-6 text-primary-foreground"
        >
          <div className="flex items-start gap-4">
            <ScholarBuddy size="sm" animate={false} />
            <div>
              <h3 className="font-bold text-lg mb-1">
                Keep Going, {displayProfile.name.split(" ")[0]}!
              </h3>
              <p className="opacity-90">
                You're making great progress! Complete {remainingXp} more XP to reach
                Level {displayProfile.level + 1}! 🌟
              </p>
            </div>
          </div>
        </motion.div>

        {/* Powered by Footer */}
        <PoweredByFooter />
      </main>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="bg-card rounded-xl p-4 border border-border text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}