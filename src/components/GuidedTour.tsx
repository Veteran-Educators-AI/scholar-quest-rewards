import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScholarBuddy } from "@/components/ScholarBuddy";
import { 
  BookOpen, 
  Trophy, 
  Flame, 
  Coins, 
  Bell, 
  Calendar,
  ChevronRight,
  ChevronLeft,
  X
} from "lucide-react";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
}

const tourSteps: TourStep[] = [
  {
    title: "Welcome to NYCologic Ai! 🎉",
    description: "I'm your Scholar Buddy! I'll help you complete assignments, earn rewards, and become a learning superstar!",
    icon: <BookOpen className="w-8 h-8 text-primary" />,
  },
  {
    title: "Complete Missions",
    description: "Your teacher will assign you missions (assignments). Complete them to earn XP and coins!",
    icon: <BookOpen className="w-8 h-8 text-blue-500" />,
    highlight: "missions",
  },
  {
    title: "Build Your Streak 🔥",
    description: "Complete at least one assignment every day to build your streak. The longer your streak, the more bonus rewards!",
    icon: <Flame className="w-8 h-8 text-orange-500" />,
    highlight: "streak",
  },
  {
    title: "Earn Coins 💰",
    description: "Coins can be used to unlock special rewards. Your parents can also add bonus coins for reaching goals!",
    icon: <Coins className="w-8 h-8 text-gold" />,
    highlight: "coins",
  },
  {
    title: "Win Badges & Trophies",
    description: "Complete challenges and milestones to earn badges. Show off your achievements!",
    icon: <Trophy className="w-8 h-8 text-gold" />,
    highlight: "badges",
  },
  {
    title: "Check Your Schedule",
    description: "View your class schedule to see when you have classes and what's coming up!",
    icon: <Calendar className="w-8 h-8 text-green-500" />,
    highlight: "schedule",
  },
  {
    title: "Stay Notified 🔔",
    description: "When your teacher assigns new work, you'll get a notification. Check the bell icon to see all updates!",
    icon: <Bell className="w-8 h-8 text-primary" />,
    highlight: "notifications",
  },
];

interface GuidedTourProps {
  onComplete: () => void;
  isOpen: boolean;
}

export function GuidedTour({ onComplete, isOpen }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-card rounded-3xl shadow-2xl border border-border max-w-md w-full p-6 relative"
        >
          {/* Skip button */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleSkip}
            className="absolute top-4 right-4"
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mb-6">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? "bg-primary"
                    : index < currentStep
                    ? "bg-primary/50"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Mascot and content */}
          <div className="flex flex-col items-center text-center">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              {currentStep === 0 ? (
                <ScholarBuddy size="lg" animate />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  {step.icon}
                </div>
              )}
            </motion.div>

            <motion.div
              key={`content-${currentStep}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-xl font-bold text-foreground mb-2">
                {step.title}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                {step.description}
              </p>
            </motion.div>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            <Button
              variant="hero"
              onClick={handleNext}
              className="flex-1"
            >
              {currentStep === tourSteps.length - 1 ? (
                "Let's Go!"
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          {/* Skip text */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            Step {currentStep + 1} of {tourSteps.length}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
