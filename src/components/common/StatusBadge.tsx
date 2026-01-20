/**
 * StatusBadge Component
 *
 * Displays status indicators with consistent color coding.
 * Used for assignment status, mastery levels, etc.
 */

import { cn } from "@/lib/utils";
import {
  Circle,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import {
  STATUS_COLORS,
  MASTERY_COLORS,
  type Status,
  type MasteryLevel,
} from "./tokens/colors";

// ============================================================================
// Types
// ============================================================================

export type BadgeVariant = "default" | "outline" | "subtle";

export interface StatusBadgeProps {
  /** Status value */
  status: Status;
  /** Display variant */
  variant?: BadgeVariant;
  /** Size */
  size?: "sm" | "md" | "lg";
  /** Whether to show icon */
  showIcon?: boolean;
  /** Custom label (overrides default) */
  label?: string;
  /** Additional CSS classes */
  className?: string;
}

export interface MasteryBadgeProps {
  /** Mastery level */
  level: MasteryLevel;
  /** Display variant */
  variant?: BadgeVariant;
  /** Size */
  size?: "sm" | "md" | "lg";
  /** Whether to show icon */
  showIcon?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Icon Mappings
// ============================================================================

const STATUS_ICONS: Record<Status, LucideIcon> = {
  not_started: Circle,
  pending: Clock,
  in_progress: Loader2,
  active: Loader2,
  submitted: AlertCircle,
  completed: CheckCircle2,
  archived: XCircle,
};

const MASTERY_ICONS: Record<MasteryLevel, LucideIcon> = {
  not_started: Circle,
  developing: Target,
  approaching: TrendingUp,
  mastered: CheckCircle2,
};

// ============================================================================
// Size Configurations
// ============================================================================

const SIZE_CONFIGS = {
  sm: {
    container: "px-2 py-0.5 text-xs gap-1",
    icon: "w-3 h-3",
  },
  md: {
    container: "px-2.5 py-1 text-sm gap-1.5",
    icon: "w-4 h-4",
  },
  lg: {
    container: "px-3 py-1.5 text-base gap-2",
    icon: "w-5 h-5",
  },
};

// ============================================================================
// StatusBadge Component
// ============================================================================

export function StatusBadge({
  status,
  variant = "default",
  size = "md",
  showIcon = true,
  label,
  className,
}: StatusBadgeProps) {
  const colors = STATUS_COLORS[status];
  const Icon = STATUS_ICONS[status];
  const sizeConfig = SIZE_CONFIGS[size];
  const displayLabel = label ?? colors.label;

  const variantClasses = {
    default: cn(colors.bg, colors.text),
    outline: cn("bg-transparent border", colors.border, colors.text),
    subtle: cn(colors.bg.replace("/10", "/5"), colors.text),
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        sizeConfig.container,
        variantClasses[variant],
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            sizeConfig.icon,
            status === "in_progress" || status === "active" ? "animate-spin" : ""
          )}
        />
      )}
      {displayLabel}
    </span>
  );
}

// ============================================================================
// MasteryBadge Component
// ============================================================================

export function MasteryBadge({
  level,
  variant = "default",
  size = "md",
  showIcon = true,
  className,
}: MasteryBadgeProps) {
  const colors = MASTERY_COLORS[level];
  const Icon = MASTERY_ICONS[level];
  const sizeConfig = SIZE_CONFIGS[size];

  const variantClasses = {
    default: cn(colors.bg, colors.text),
    outline: cn("bg-transparent border", colors.border, colors.text),
    subtle: cn(colors.bg.replace("/20", "/10"), colors.text),
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        sizeConfig.container,
        variantClasses[variant],
        className
      )}
    >
      {showIcon && <Icon className={sizeConfig.icon} />}
      {colors.label}
    </span>
  );
}

// ============================================================================
// Convenience Components
// ============================================================================

export function CompletedBadge({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  return <StatusBadge status="completed" size={size} />;
}

export function InProgressBadge({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  return <StatusBadge status="in_progress" size={size} />;
}

export function PendingBadge({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  return <StatusBadge status="pending" size={size} />;
}

export function MasteredBadge({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  return <MasteryBadge level="mastered" size={size} />;
}
