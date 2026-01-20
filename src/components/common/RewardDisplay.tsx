/**
 * RewardDisplay Component
 *
 * Displays XP and coin rewards together in a consistent format.
 * Used in assignment cards, practice sets, challenge cards, etc.
 */

import { cn } from "@/lib/utils";
import { Coins, Zap } from "lucide-react";
import { type Size, STAT_BADGE_SIZES } from "./tokens/sizes";

// ============================================================================
// Types
// ============================================================================

export interface RewardDisplayProps {
  /** XP reward amount */
  xp: number;
  /** Coin reward amount */
  coins: number;
  /** Size variant */
  size?: Size;
  /** Layout direction */
  direction?: "row" | "column";
  /** Whether to show labels (XP, Coins) */
  showLabels?: boolean;
  /** Whether to highlight (glow effect) */
  highlighted?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function RewardDisplay({
  xp,
  coins,
  size = "sm",
  direction = "row",
  showLabels = false,
  highlighted = false,
  className,
}: RewardDisplayProps) {
  const sizeConfig = STAT_BADGE_SIZES[size];

  return (
    <div
      className={cn(
        "inline-flex items-center",
        direction === "row" ? "flex-row gap-2" : "flex-col gap-1",
        className
      )}
    >
      {/* XP Badge */}
      <div
        className={cn(
          "inline-flex items-center font-medium rounded-full",
          sizeConfig.container,
          sizeConfig.gap,
          "bg-primary/10 text-primary",
          highlighted && "shadow-[0_0_10px_hsl(var(--primary)/0.3)]"
        )}
      >
        <Zap className={cn(sizeConfig.icon, "fill-current")} />
        <span className={cn("font-semibold tabular-nums", sizeConfig.text)}>
          +{xp.toLocaleString()}
        </span>
        {showLabels && (
          <span className={cn("opacity-70", sizeConfig.text)}>XP</span>
        )}
      </div>

      {/* Coin Badge */}
      <div
        className={cn(
          "inline-flex items-center font-medium rounded-full",
          sizeConfig.container,
          sizeConfig.gap,
          "bg-gold/10 text-gold",
          highlighted && "shadow-[0_0_10px_hsl(43_96%_56%/0.3)]"
        )}
      >
        <Coins className={sizeConfig.icon} />
        <span className={cn("font-semibold tabular-nums", sizeConfig.text)}>
          +{coins.toLocaleString()}
        </span>
        {showLabels && (
          <span className={cn("opacity-70", sizeConfig.text)}>coins</span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Compact Version
// ============================================================================

export function RewardBadge({
  xp,
  coins,
  size = "xs",
  className,
}: {
  xp: number;
  coins: number;
  size?: Size;
  className?: string;
}) {
  const sizeConfig = STAT_BADGE_SIZES[size];

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full bg-muted/50 divide-x divide-border",
        className
      )}
    >
      <div className={cn("flex items-center", sizeConfig.container, sizeConfig.gap)}>
        <Zap className={cn(sizeConfig.icon, "text-primary fill-primary")} />
        <span className={cn("font-medium text-primary tabular-nums", sizeConfig.text)}>
          {xp}
        </span>
      </div>
      <div className={cn("flex items-center", sizeConfig.container, sizeConfig.gap)}>
        <Coins className={cn(sizeConfig.icon, "text-gold")} />
        <span className={cn("font-medium text-gold tabular-nums", sizeConfig.text)}>
          {coins}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Earned Reward (for completion screens)
// ============================================================================

export function EarnedReward({
  xp,
  coins,
  size = "lg",
  animated = true,
  className,
}: {
  xp: number;
  coins: number;
  size?: Size;
  animated?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <p className="text-sm text-muted-foreground font-medium">Rewards Earned</p>
      <RewardDisplay
        xp={xp}
        coins={coins}
        size={size}
        showLabels
        highlighted={animated}
      />
    </div>
  );
}
