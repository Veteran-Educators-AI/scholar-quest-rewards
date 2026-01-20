/**
 * EmptyState Component
 *
 * A standardized component for displaying empty states across the app.
 * Shows an icon, message, and optional description with consistent styling.
 */

import { cn } from "@/lib/utils";
import {
  Inbox,
  FileQuestion,
  Search,
  BookOpen,
  Trophy,
  Target,
  Users,
  Calendar,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ============================================================================
// Types
// ============================================================================

export type EmptyStateVariant =
  | "default"
  | "search"
  | "data"
  | "assignments"
  | "rewards"
  | "goals"
  | "students"
  | "schedule";

export interface EmptyStateProps {
  /** Pre-configured variant */
  variant?: EmptyStateVariant;
  /** Custom icon (overrides variant icon) */
  icon?: LucideIcon;
  /** Main message */
  title: string;
  /** Optional description */
  description?: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Variant Configurations
// ============================================================================

const VARIANT_ICONS: Record<EmptyStateVariant, LucideIcon> = {
  default: Inbox,
  search: Search,
  data: FileQuestion,
  assignments: BookOpen,
  rewards: Trophy,
  goals: Target,
  students: Users,
  schedule: Calendar,
};

const SIZE_CONFIGS = {
  sm: {
    container: "py-4 px-2",
    icon: "w-8 h-8 mb-2",
    title: "text-sm",
    description: "text-xs",
    button: "text-xs h-7 px-2",
  },
  md: {
    container: "py-8 px-4",
    icon: "w-12 h-12 mb-3",
    title: "text-base",
    description: "text-sm",
    button: "text-sm h-9 px-3",
  },
  lg: {
    container: "py-12 px-6",
    icon: "w-16 h-16 mb-4",
    title: "text-lg",
    description: "text-base",
    button: "text-base h-10 px-4",
  },
};

// ============================================================================
// Component
// ============================================================================

export function EmptyState({
  variant = "default",
  icon: customIcon,
  title,
  description,
  action,
  size = "md",
  className,
}: EmptyStateProps) {
  const Icon = customIcon ?? VARIANT_ICONS[variant];
  const sizeConfig = SIZE_CONFIGS[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizeConfig.container,
        className
      )}
    >
      <Icon
        className={cn(
          "text-muted-foreground/50",
          sizeConfig.icon
        )}
      />

      <p className={cn("font-medium text-muted-foreground", sizeConfig.title)}>
        {title}
      </p>

      {description && (
        <p
          className={cn(
            "mt-1 text-muted-foreground/70 max-w-xs",
            sizeConfig.description
          )}
        >
          {description}
        </p>
      )}

      {action && (
        <Button
          variant="outline"
          size="sm"
          onClick={action.onClick}
          className={cn("mt-4", sizeConfig.button)}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Convenience Components
// ============================================================================

export function NoSearchResults({
  query,
  onClear,
}: {
  query?: string;
  onClear?: () => void;
}) {
  return (
    <EmptyState
      variant="search"
      title={query ? `No results for "${query}"` : "No results found"}
      description="Try adjusting your search or filters"
      action={onClear ? { label: "Clear search", onClick: onClear } : undefined}
    />
  );
}

export function NoAssignments({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      variant="assignments"
      title="No assignments yet"
      description="Complete assignments to earn XP and coins"
      action={onCreate ? { label: "Browse assignments", onClick: onCreate } : undefined}
    />
  );
}

export function NoRewards({ onExplore }: { onExplore?: () => void }) {
  return (
    <EmptyState
      variant="rewards"
      title="No rewards earned"
      description="Complete activities to earn badges and collectibles"
      action={onExplore ? { label: "Explore rewards", onClick: onExplore } : undefined}
    />
  );
}

export function NoData({ title, description }: { title?: string; description?: string }) {
  return (
    <EmptyState
      variant="data"
      title={title ?? "No data available"}
      description={description ?? "Check back later for updates"}
    />
  );
}
