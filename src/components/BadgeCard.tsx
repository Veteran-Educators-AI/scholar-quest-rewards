/**
 * BadgeCard Component
 *
 * Displays achievement badges with earned/locked states.
 * Refactored to use common design tokens.
 */

import { motion } from "framer-motion";
import { Award, Lock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CARD_SIZES, type Size } from "@/components/common/tokens/sizes";

// ============================================================================
// Types
// ============================================================================

interface BadgeCardProps {
  name: string;
  description?: string;
  iconUrl?: string;
  earned?: boolean;
  earnedAt?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// ============================================================================
// Size Mappings
// ============================================================================

const BADGE_SIZES = {
  sm: {
    container: "w-20 h-20",
    icon: "w-10 h-10",
    text: "text-xs",
    check: "w-5 h-5",
    checkBadge: "w-5 h-5 -top-0.5 -right-0.5",
  },
  md: {
    container: "w-28 h-28",
    icon: "w-14 h-14",
    text: "text-sm",
    check: "w-4 h-4",
    checkBadge: "w-6 h-6 -top-1 -right-1",
  },
  lg: {
    container: "w-36 h-36",
    icon: "w-20 h-20",
    text: "text-base",
    check: "w-5 h-5",
    checkBadge: "w-7 h-7 -top-1 -right-1",
  },
};

// ============================================================================
// Component
// ============================================================================

export function BadgeCard({
  name,
  description,
  iconUrl,
  earned = false,
  earnedAt,
  size = "md",
  className = "",
}: BadgeCardProps) {
  const s = BADGE_SIZES[size];

  return (
    <motion.div
      className={cn("flex flex-col items-center gap-2", className)}
      whileHover={earned ? { scale: 1.05, y: -4 } : {}}
      whileTap={earned ? { scale: 0.98 } : {}}
    >
      {/* Badge Icon Container */}
      <div
        className={cn(
          s.container,
          "rounded-2xl flex items-center justify-center relative",
          earned
            ? "bg-gradient-gold shadow-glow-gold"
            : "bg-muted"
        )}
      >
        {earned ? (
          iconUrl ? (
            <img
              src={iconUrl}
              alt={name}
              loading="lazy"
              decoding="async"
              className={cn(s.icon, "object-contain")}
            />
          ) : (
            <Award className={cn(s.icon, "text-gold-foreground")} />
          )
        ) : (
          <>
            <Lock className={cn(s.icon, "text-muted-foreground/50")} />
            <div className="absolute inset-0 bg-foreground/5 rounded-2xl" />
          </>
        )}

        {/* Earned checkmark */}
        {earned && (
          <motion.div
            className={cn(
              "absolute bg-success rounded-full flex items-center justify-center shadow-md",
              s.checkBadge
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
          >
            <CheckCircle2 className={cn(s.check, "text-success-foreground")} />
          </motion.div>
        )}
      </div>

      {/* Badge Info */}
      <div className="text-center">
        <p
          className={cn(
            s.text,
            "font-bold",
            earned ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {name}
        </p>
        {description && (
          <p className={cn(s.text, "text-muted-foreground line-clamp-2")}>
            {description}
          </p>
        )}
      </div>
    </motion.div>
  );
}
