/**
 * StatBadge Component
 *
 * A versatile badge for displaying stats like coins, XP, streaks, etc.
 * Unifies the patterns from CoinCounter, StreakCounter, and similar components.
 */

import { cn } from "@/lib/utils";
import { Coins, Flame, Zap, Star, Trophy, Shield } from "lucide-react";
import { type Size, STAT_BADGE_SIZES } from "./tokens/sizes";

// ============================================================================
// Types
// ============================================================================

export type StatType = "coins" | "xp" | "streak" | "stars" | "points" | "custom";

export interface StatBadgeProps {
  /** The type of stat (determines icon and styling) */
  type: StatType;
  /** The numeric value to display */
  value: number;
  /** Size variant */
  size?: Size;
  /** Whether to show animation effects */
  animated?: boolean;
  /** Custom icon (for type="custom") */
  icon?: React.ReactNode;
  /** Label text (optional, shown after value) */
  label?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether the badge has a shield/protection (for streaks) */
  hasShield?: boolean;
}

// ============================================================================
// Stat Type Configurations
// ============================================================================

interface StatConfig {
  icon: typeof Coins;
  bgClass: string;
  textClass: string;
  glowClass?: string;
}

const STAT_CONFIGS: Record<Exclude<StatType, "custom">, StatConfig> = {
  coins: {
    icon: Coins,
    bgClass: "bg-gold/10 dark:bg-gold/20",
    textClass: "text-gold dark:text-gold",
    glowClass: "shadow-[0_0_10px_hsl(43_96%_56%/0.3)]",
  },
  xp: {
    icon: Zap,
    bgClass: "bg-primary/10 dark:bg-primary/20",
    textClass: "text-primary dark:text-primary",
    glowClass: "shadow-[0_0_10px_hsl(var(--primary)/0.3)]",
  },
  streak: {
    icon: Flame,
    bgClass: "bg-orange-100 dark:bg-orange-900/30",
    textClass: "text-orange-500 dark:text-orange-400",
    glowClass: "shadow-[0_0_15px_hsl(25_95%_53%/0.4)]",
  },
  stars: {
    icon: Star,
    bgClass: "bg-yellow-100 dark:bg-yellow-900/30",
    textClass: "text-yellow-500 dark:text-yellow-400",
    glowClass: "shadow-[0_0_10px_hsl(48_96%_53%/0.3)]",
  },
  points: {
    icon: Trophy,
    bgClass: "bg-purple-100 dark:bg-purple-900/30",
    textClass: "text-purple-500 dark:text-purple-400",
    glowClass: "shadow-[0_0_10px_hsl(262_83%_58%/0.3)]",
  },
};

// ============================================================================
// Component
// ============================================================================

export function StatBadge({
  type,
  value,
  size = "md",
  animated = false,
  icon: customIcon,
  label,
  className,
  hasShield = false,
}: StatBadgeProps) {
  const sizeConfig = STAT_BADGE_SIZES[size];
  const statConfig = type === "custom" ? null : STAT_CONFIGS[type];

  const Icon = statConfig?.icon;
  const displayIcon = customIcon ?? (Icon ? <Icon className={sizeConfig.icon} /> : null);

  const formattedValue = value.toLocaleString();

  return (
    <div
      className={cn(
        "inline-flex items-center font-medium",
        sizeConfig.container,
        sizeConfig.gap,
        statConfig?.bgClass ?? "bg-muted",
        statConfig?.textClass ?? "text-foreground",
        animated && statConfig?.glowClass,
        className
      )}
    >
      {/* Icon with optional animation */}
      {displayIcon && (
        <span className={cn("flex-shrink-0", animated && "animate-pulse")}>
          {displayIcon}
        </span>
      )}

      {/* Value */}
      <span className={cn("font-semibold tabular-nums", sizeConfig.text)}>
        {formattedValue}
      </span>

      {/* Optional label */}
      {label && (
        <span className={cn("opacity-70", sizeConfig.text)}>{label}</span>
      )}

      {/* Shield indicator for streaks */}
      {hasShield && type === "streak" && (
        <Shield className={cn(sizeConfig.icon, "text-blue-500 fill-blue-500/20")} />
      )}
    </div>
  );
}

// ============================================================================
// Convenience Components
// ============================================================================

export function CoinBadge({
  coins,
  size = "md",
  className,
}: {
  coins: number;
  size?: Size;
  className?: string;
}) {
  return <StatBadge type="coins" value={coins} size={size} className={className} />;
}

export function XPBadge({
  xp,
  size = "md",
  className,
}: {
  xp: number;
  size?: Size;
  className?: string;
}) {
  return <StatBadge type="xp" value={xp} size={size} className={className} />;
}

export function StreakBadge({
  streak,
  hasShield = false,
  size = "md",
  animated = false,
  className,
}: {
  streak: number;
  hasShield?: boolean;
  size?: Size;
  animated?: boolean;
  className?: string;
}) {
  return (
    <StatBadge
      type="streak"
      value={streak}
      size={size}
      hasShield={hasShield}
      animated={animated || streak >= 3}
      className={className}
    />
  );
}
