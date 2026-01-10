import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScholarBuddy } from "@/components/ScholarBuddy";
import { Star, Trophy, Flame, Users, BookOpen, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import nycologicLogo from "@/assets/nycologic-ai-logo.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
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

      {/* CTA Section */}
      <section className="py-20 px-4">
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
            © 2026 Scan Scholar. Powered by NYCologic Ai™ 🧠
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
