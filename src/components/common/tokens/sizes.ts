/**
 * Size Design Tokens
 *
 * Centralized size definitions for consistent component sizing.
 * Used by StatBadge, XPBar, CoinCounter, StreakCounter, BadgeCard, etc.
 */

// ============================================================================
// Size Scale
// ============================================================================

export type Size = "xs" | "sm" | "md" | "lg" | "xl";

// ============================================================================
// Component Size Configurations
// ============================================================================

export interface SizeConfig {
  container: string;
  icon: string;
  text: string;
  gap: string;
}

/**
 * Size configurations for stat badges (CoinCounter, StreakCounter, etc.)
 */
export const STAT_BADGE_SIZES: Record<Size, SizeConfig> = {
  xs: {
    container: "px-1.5 py-0.5 rounded",
    icon: "w-3 h-3",
    text: "text-xs",
    gap: "gap-0.5",
  },
  sm: {
    container: "px-2 py-1 rounded-md",
    icon: "w-4 h-4",
    text: "text-sm",
    gap: "gap-1",
  },
  md: {
    container: "px-3 py-1.5 rounded-lg",
    icon: "w-5 h-5",
    text: "text-base",
    gap: "gap-1.5",
  },
  lg: {
    container: "px-4 py-2 rounded-lg",
    icon: "w-6 h-6",
    text: "text-lg",
    gap: "gap-2",
  },
  xl: {
    container: "px-5 py-2.5 rounded-xl",
    icon: "w-7 h-7",
    text: "text-xl",
    gap: "gap-2.5",
  },
};

/**
 * Size configurations for cards (BadgeCard, CollectibleCard, etc.)
 */
export const CARD_SIZES: Record<Size, { container: string; title: string; description: string }> = {
  xs: {
    container: "w-16 p-2 rounded-lg",
    title: "text-xs",
    description: "text-[10px]",
  },
  sm: {
    container: "w-20 p-2.5 rounded-lg",
    title: "text-sm",
    description: "text-xs",
  },
  md: {
    container: "w-28 p-3 rounded-xl",
    title: "text-base",
    description: "text-sm",
  },
  lg: {
    container: "w-36 p-4 rounded-xl",
    title: "text-lg",
    description: "text-base",
  },
  xl: {
    container: "w-44 p-5 rounded-2xl",
    title: "text-xl",
    description: "text-lg",
  },
};

/**
 * Size configurations for progress bars
 */
export const PROGRESS_BAR_SIZES: Record<Size, { height: string; text: string; rounded: string }> = {
  xs: {
    height: "h-1",
    text: "text-[10px]",
    rounded: "rounded-sm",
  },
  sm: {
    height: "h-1.5",
    text: "text-xs",
    rounded: "rounded",
  },
  md: {
    height: "h-2",
    text: "text-sm",
    rounded: "rounded-md",
  },
  lg: {
    height: "h-3",
    text: "text-base",
    rounded: "rounded-lg",
  },
  xl: {
    height: "h-4",
    text: "text-lg",
    rounded: "rounded-lg",
  },
};

/**
 * Size configurations for avatars
 */
export const AVATAR_SIZES: Record<Size, string> = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
};

/**
 * Size configurations for icons
 */
export const ICON_SIZES: Record<Size, string> = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
};

// ============================================================================
// Spacing Scale
// ============================================================================

export const SPACING = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  "2xl": "3rem", // 48px
} as const;

// ============================================================================
// Border Radius Scale
// ============================================================================

export const RADIUS = {
  none: "rounded-none",
  sm: "rounded-sm",
  default: "rounded",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
} as const;
