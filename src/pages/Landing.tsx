import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScholarBuddy } from "@/components/ScholarBuddy";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Star, Trophy, Flame, Users, BookOpen, Sparkles, Gift, Shield, AlertTriangle, Award, Heart, GraduationCap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import nycologicLogo from "@/assets/nycologic-ai-logo.png";

export default function Landing() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in and redirect to student dashboard
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/student", { replace: true });
      } else {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <ScholarBuddy size="lg" animate={true} />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Fixed Header with Theme Toggle */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a 
              href="https://nycologic.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              ← NYCologic AI
            </a>
            <div className="flex items-center gap-2">
              <img 
                src={nycologicLogo} 
                alt="NYCologic Scholar" 
                className="w-8 h-8 object-contain"
              />
              <span className="font-semibold text-foreground">NYCologic Scholar</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20 pt-24">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center lg:items-start gap-4 mb-6"
              >
                <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 shadow-md">
                  <img 
                    src={nycologicLogo} 
                    alt="NYCologic Ai" 
                    className="w-12 h-12 object-contain"
                  />
                  <div className="text-left">
                    <span className="text-xs text-muted-foreground">Powered by</span>
                    <p className="font-bold text-foreground">NYCologic Ai™</p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-semibold">Learning made fun!</span>
                </div>
              </motion.div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
                <span className="text-gradient-hero">Master Your Standards.</span>
                <br />
                <span className="text-foreground">Track Your Progress.</span>
                <br />
                <span className="text-gradient-primary">Achieve Excellence.</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0">
                Your personalized learning companion for grades 6-12 and beyond. Complete assignments, 
                master NYS standards, and track your academic growth with data-driven insights.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/auth">
                  <Button variant="hero" size="xl">
                    <Star className="w-6 h-6" />
                    Start Learning
                  </Button>
                </Link>
                <Link to="/auth?role=teacher">
                  <Button variant="outline" size="xl">
                    <Users className="w-6 h-6" />
                    I'm a Teacher
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right: Mascot and features */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col items-center"
            >
              <ScholarBuddy size="xl" message="Ready to take your learning to the next level?" />
              <h2 className="text-2xl md:text-3xl font-bold mt-4 text-foreground">
                NYCologic <span className="text-destructive">Ai</span> Scholar
              </h2>
              
              {/* Feature cards */}
              <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-md">
                <FeatureCard
                  icon={<Trophy className="w-6 h-6" />}
                  title="Achievements"
                  description="Earn recognition for mastery"
                  color="gold"
                />
                <FeatureCard
                  icon={<Flame className="w-6 h-6" />}
                  title="Consistency"
                  description="Build productive habits"
                  color="streak"
                />
                <FeatureCard
                  icon={<Star className="w-6 h-6" />}
                  title="Progress"
                  description="Track your growth"
                  color="primary"
                />
                <FeatureCard
                  icon={<BookOpen className="w-6 h-6" />}
                  title="Standards"
                  description="Master NYS curriculum"
                  color="accent"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              How It <span className="text-gradient-primary">Works</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A streamlined workflow designed to maximize your academic success
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number={1}
              title="Receive Assignments"
              description="Your teacher assigns work aligned with NYS standards. Complete on paper or directly in the app."
              emoji="📋"
            />
            <StepCard
              number={2}
              title="Submit & Review"
              description="Answer questions, scan your paper work, or complete digitally with our adaptive assessment system."
              emoji="✏️"
            />
            <StepCard
              number={3}
              title="Track Mastery"
              description="Monitor your progress across standards, earn achievements, and identify areas for improvement."
              emoji="📊"
            />
          </div>
        </div>
      </section>

      {/* Parent & Student Tour Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-gold/10 text-gold px-4 py-2 rounded-full mb-4">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-semibold">For Parents & Students</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              The <span className="text-gradient-primary">Reward System</span> Explained
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Our unique system connects learning achievements with real-world rewards, 
              while giving teachers and parents the tools to shape positive behavior.
            </p>
          </motion.div>

          {/* How Points Work */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="bg-card rounded-3xl p-8 border border-border shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <GraduationCap className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">How Students Earn Points</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Star className="w-3 h-3 text-success" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Complete Assignments</p>
                      <p className="text-sm text-muted-foreground">Earn XP and coins for every task you finish</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Trophy className="w-3 h-3 text-gold" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Master Standards</p>
                      <p className="text-sm text-muted-foreground">Bonus points for demonstrating skill mastery</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-streak/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Flame className="w-3 h-3 text-streak" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Keep Your Streak</p>
                      <p className="text-sm text-muted-foreground">Daily consistency multiplies your rewards</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Award className="w-3 h-3 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Earn Badges</p>
                      <p className="text-sm text-muted-foreground">Unlock achievements for major milestones</p>
                    </div>
                  </li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="bg-gradient-to-br from-primary/5 to-destructive/5 rounded-3xl p-8 border border-border shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-destructive/10 rounded-2xl flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-destructive" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Behavior Matters!</h3>
                </div>
                <div className="bg-card/80 backdrop-blur rounded-2xl p-6 border border-destructive/20 mb-6">
                  <p className="text-foreground font-medium mb-3">
                    ⚠️ <span className="text-destructive font-bold">Teachers can deduct points</span> for classroom behavior issues:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-destructive rounded-full" />
                      Disrupting class or not following instructions
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-destructive rounded-full" />
                      Being disrespectful to teachers or classmates
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-destructive rounded-full" />
                      Not completing homework or arriving unprepared
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-destructive rounded-full" />
                      Using devices inappropriately in class
                    </li>
                  </ul>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  💡 Good behavior protects your points! Stay focused and respectful to keep earning toward your goals.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Parent Rewards Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-gold/10 via-card to-primary/10 rounded-3xl p-8 md:p-12 border border-border shadow-2xl"
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-gold/20 text-gold px-4 py-2 rounded-full mb-6">
                  <Gift className="w-4 h-4" />
                  <span className="text-sm font-semibold">Parent Reward Pledges</span>
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-4">
                  Set Real Prizes for Real Achievement
                </h3>
                <p className="text-muted-foreground mb-6">
                  Parents, you can set up <strong className="text-foreground">reward pledges</strong> that motivate your child 
                  to reach their goals. Choose a prize they'll work toward — but remember, 
                  <span className="text-destructive font-semibold"> points can be deducted for bad behavior</span>, 
                  so they must maintain good conduct to claim their reward!
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-foreground">
                    <Shield className="w-5 h-5 text-success" />
                    <span>Badge-based goals ensure real learning happens</span>
                  </div>
                  <div className="flex items-center gap-3 text-foreground">
                    <Trophy className="w-5 h-5 text-gold" />
                    <span>You choose the reward: movie night, new game, special outing</span>
                  </div>
                  <div className="flex items-center gap-3 text-foreground">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <span>Behavior deductions keep accountability in place</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-card rounded-2xl p-6 border border-border shadow-lg">
                <h4 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-gold" />
                  Example Reward Pledge
                </h4>
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-sm text-muted-foreground mb-1">Goal Badge</p>
                    <p className="font-bold text-foreground flex items-center gap-2">
                      <Award className="w-4 h-4 text-gold" />
                      Math Master - Algebra
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-sm text-muted-foreground mb-1">Reward</p>
                    <p className="font-bold text-foreground">🎮 New Video Game</p>
                  </div>
                  <div className="bg-gradient-to-r from-success/10 to-transparent rounded-xl p-4 border border-success/20">
                    <p className="text-sm text-success font-medium">
                      ✓ Student must earn the badge AND maintain their coin balance above 500 to claim!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-hero rounded-3xl p-8 md:p-12 text-center text-primary-foreground shadow-2xl"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Ready to Excel?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Join students who are mastering NYS standards and achieving their academic goals.
            </p>
            <Link to="/auth">
              <Button variant="gold" size="xl">
                <Sparkles className="w-6 h-6" />
                Get Started Free
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto text-center text-muted-foreground">
          <p className="text-sm">
            © 2026 NYCologic Scholar. Powered by NYCologic Ai™ 🧠
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  color 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  color: "gold" | "streak" | "primary" | "accent";
}) {
  const colorClasses = {
    gold: "bg-gold/10 text-gold",
    streak: "bg-streak/10 text-streak",
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-card rounded-2xl p-4 shadow-md border border-border"
    >
      <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <h3 className="font-bold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}

function StepCard({
  number,
  title,
  description,
  emoji,
}: {
  number: number;
  title: string;
  description: string;
  emoji: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: number * 0.1 }}
      whileHover={{ y: -4 }}
      className="bg-card rounded-2xl p-6 shadow-md border border-border text-center"
    >
      <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-glow-primary">
        {emoji}
      </div>
      <div className="inline-flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full font-bold text-sm mb-3">
        {number}
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  );
}
