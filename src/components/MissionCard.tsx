import { motion } from "framer-motion";
import { Clock, Star, FileText, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MissionCardProps {
  title: string;
  subject: string;
  dueAt: Date;
  xpReward: number;
  coinReward: number;
  hasPrintable?: boolean;
  hasInApp?: boolean;
  status?: "not_started" | "in_progress" | "submitted" | "completed";
  onStart?: () => void;
  className?: string;
}

export function MissionCard({
  title,
  subject,
  dueAt,
  xpReward,
  coinReward,
  hasPrintable = true,
  hasInApp = true,
  status = "not_started",
  onStart,
  className = "",
}: MissionCardProps) {
  const now = new Date();
  const isOverdue = dueAt < now;
  const hoursUntilDue = Math.max(0, Math.floor((dueAt.getTime() - now.getTime()) / (1000 * 60 * 60)));
  const daysUntilDue = Math.floor(hoursUntilDue / 24);
  
  const timeText = isOverdue
    ? "Overdue"
    : daysUntilDue > 0
    ? `${daysUntilDue}d ${hoursUntilDue % 24}h left`
    : hoursUntilDue > 0
    ? `${hoursUntilDue}h left`
    : "Due soon!";

  const subjectEmojis: Record<string, string> = {
    math: "🔢",
    reading: "📖",
    science: "🔬",
    writing: "✏️",
    history: "🏛️",
    art: "🎨",
    music: "🎵",
    default: "📚",
  };

  const emoji = subjectEmojis[subject.toLowerCase()] || subjectEmojis.default;

  const statusStyles = {
    not_started: "",
    in_progress: "border-primary",
    submitted: "border-warning",
    completed: "border-success bg-success/5",
  };

  return (
    <motion.div
      className={`bg-card rounded-2xl border-2 ${statusStyles[status]} shadow-md overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-2xl shadow-glow-primary">
              {emoji}
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg line-clamp-1">{title}</h3>
              <p className="text-sm text-muted-foreground capitalize">{subject}</p>
            </div>
          </div>
          
          {status === "completed" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-8 h-8 bg-success rounded-full flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-success-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}
        </div>

        {/* Due time */}
        <div className={`flex items-center gap-2 mb-4 ${isOverdue ? "text-destructive" : hoursUntilDue < 24 ? "text-warning" : "text-muted-foreground"}`}>
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">{timeText}</span>
        </div>

        {/* Rewards */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5 bg-gold/10 px-3 py-1.5 rounded-full">
            <Star className="w-4 h-4 text-gold fill-gold" />
            <span className="text-sm font-bold text-gold">{xpReward} XP</span>
          </div>
          <div className="flex items-center gap-1.5 bg-warning/10 px-3 py-1.5 rounded-full">
            <span className="text-sm">🪙</span>
            <span className="text-sm font-bold text-warning">{coinReward}</span>
          </div>
        </div>

        {/* Action buttons */}
        {status === "not_started" && (
          <div className="flex gap-2">
            {hasPrintable && (
              <Button variant="paper" className="flex-1" onClick={onStart}>
                <FileText className="w-4 h-4" />
                Paper
              </Button>
            )}
            {hasInApp && (
              <Button variant="app" className="flex-1" onClick={onStart}>
                <Smartphone className="w-4 h-4" />
                In App
              </Button>
            )}
          </div>
        )}

        {status === "in_progress" && (
          <Button variant="hero" className="w-full" onClick={onStart}>
            Continue Mission
          </Button>
        )}

        {status === "submitted" && (
          <div className="text-center py-2">
            <span className="text-sm font-medium text-warning">⏳ Waiting for teacher review</span>
          </div>
        )}

        {status === "completed" && (
          <div className="text-center py-2">
            <span className="text-sm font-medium text-success">✨ Mission Complete!</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
