/**
 * SubjectTag Component
 *
 * Displays a subject with consistent color coding and optional icon.
 * Used in assignment cards, practice sets, standards displays, etc.
 */

import { cn } from "@/lib/utils";
import { getSubjectColors, type Subject } from "./tokens/colors";

// ============================================================================
// Types
// ============================================================================

export interface SubjectTagProps {
  /** Subject name */
  subject: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Whether to show the emoji icon */
  showIcon?: boolean;
  /** Display variant */
  variant?: "default" | "outline" | "solid";
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Size Configurations
// ============================================================================

const SIZE_CONFIGS = {
  sm: {
    container: "px-2 py-0.5 text-xs gap-1 rounded",
    icon: "text-sm",
  },
  md: {
    container: "px-2.5 py-1 text-sm gap-1.5 rounded-md",
    icon: "text-base",
  },
  lg: {
    container: "px-3 py-1.5 text-base gap-2 rounded-lg",
    icon: "text-lg",
  },
};

// ============================================================================
// Component
// ============================================================================

export function SubjectTag({
  subject,
  size = "md",
  showIcon = true,
  variant = "default",
  className,
}: SubjectTagProps) {
  const colors = getSubjectColors(subject);
  const sizeConfig = SIZE_CONFIGS[size];

  const variantClasses = {
    default: cn(colors.bg, colors.text),
    outline: cn("bg-transparent border", colors.border, colors.text),
    solid: cn(`bg-gradient-to-r ${colors.gradient}`, "text-white"),
  };

  // Format the subject name for display
  const displayName = subject
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium",
        sizeConfig.container,
        variantClasses[variant],
        className
      )}
    >
      {showIcon && <span className={sizeConfig.icon}>{colors.icon}</span>}
      <span>{displayName}</span>
    </span>
  );
}

// ============================================================================
// Subject List Component
// ============================================================================

export function SubjectList({
  subjects,
  size = "sm",
  max = 3,
  className,
}: {
  subjects: string[];
  size?: "sm" | "md" | "lg";
  max?: number;
  className?: string;
}) {
  const visibleSubjects = subjects.slice(0, max);
  const remaining = subjects.length - max;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {visibleSubjects.map((subject) => (
        <SubjectTag key={subject} subject={subject} size={size} showIcon={false} />
      ))}
      {remaining > 0 && (
        <span className="text-xs text-muted-foreground">+{remaining} more</span>
      )}
    </div>
  );
}
