/**
 * MissionCard Component
 *
 * Displays assignment/mission information with status, rewards, and actions.
 * Refactored to use common design tokens and components.
 */

import { motion } from "framer-motion";
import { Clock, FileText, Smartphone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RewardBadge } from "@/components/common/RewardDisplay";
import {
  getSubjectColors,
  STATUS_COLORS,
  type Status,
} from "@/components/common/tokens/colors";

// ============================================================================
// Types
// ============================================================================

interface MissionCardProps {
  title: string;
  subject: string;
  dueAt: Date;
  xpReward: number;
  coinReward: number;
  hasPrintable?: boolean;
  hasInApp?: boolean;
  status?: Status;
  onStart?: () => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

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
  // Time calculations
  const now = new Date();
  const isOverdue = dueAt < now;
  const hoursUntilDue = Math.max(
    0,
    Math.floor((dueAt.getTime() - now.getTime()) / (1000 * 60 * 60))
  );
  const daysUntilDue = Math.floor(hoursUntilDue / 24);

  const timeText = isOverdue
    ? "Overdue"
    : daysUntilDue > 0
    ? `${daysUntilDue}d ${hoursUntilDue % 24}h left`
    : hoursUntilDue > 0
    ? `${hoursUntilDue}h left`
    : "Due soon!";

  // Get colors from design tokens
  const subjectColors = getSubjectColors(subject);
  const statusColors = STATUS_COLORS[status];

  // Time urgency color
  const timeColorClass = isOverdue
    ? "text-destructive"
    : hoursUntilDue < 24
    ? "text-warning"
    : "text-muted-foreground";

  return (
    <motion.div
      className={`bg-card rounded-2xl border-2 ${statusColors.border} shadow-md overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl ${subjectColors.bg} flex items-center justify-center text-2xl shadow-sm`}
            >
              {subjectColors.icon}
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg line-clamp-1">
                {title}
              </h3>
              <p className={`text-sm ${subjectColors.text} capitalize font-medium`}>
                {subject}
              </p>
            </div>
          </div>

          {status === "completed" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-8 h-8 bg-success rounded-full flex items-center justify-center"
            >
              <CheckCircle2 className="w-5 h-5 text-success-foreground" />
            </motion.div>
          )}
        </div>

        {/* Due time */}
        <div className={`flex items-center gap-2 mb-4 ${timeColorClass}`}>
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">{timeText}</span>
        </div>

        {/* Rewards - using RewardBadge from common components */}
        <div className="mb-4">
          <RewardBadge xp={xpReward} coins={coinReward} size="sm" />
        </div>

        {/* Action buttons based on status */}
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
            <span className="text-sm font-medium text-warning">
              ⏳ Waiting for teacher review
            </span>
          </div>
        )}

        {status === "completed" && (
          <div className="text-center py-2">
            <span className="text-sm font-medium text-success">
              ✨ Mission Complete!
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
