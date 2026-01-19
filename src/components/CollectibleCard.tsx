/**
 * CollectibleCard Component
 *
 * Displays collectible items with rarity-based styling.
 * Refactored to use common design tokens.
 */

import { motion } from "framer-motion";
import { Sparkles, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RARITY_COLORS,
  type Rarity,
} from "@/components/common/tokens/colors";

// ============================================================================
// Types
// ============================================================================

interface CollectibleCardProps {
  name: string;
  description?: string;
  imageUrl?: string;
  rarity: Rarity;
  earned?: boolean;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function CollectibleCard({
  name,
  description,
  imageUrl,
  rarity,
  earned = true,
  className = "",
}: CollectibleCardProps) {
  // Get colors from design tokens
  const colors = RARITY_COLORS[rarity];

  return (
    <motion.div
      className={cn("relative", className)}
      whileHover={earned ? { scale: 1.03, y: -4 } : {}}
      whileTap={earned ? { scale: 0.98 } : {}}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border-2 transition-all duration-300",
          colors.border,
          colors.bg,
          earned ? colors.glow : "opacity-50 grayscale"
        )}
      >
        {/* Card content */}
        <div className="aspect-[3/4] p-4 flex flex-col">
          {/* Rarity indicator */}
          <div className="flex items-center justify-between mb-2">
            <span
              className={cn(
                "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                `${colors.bg} ${colors.text}`
              )}
            >
              {colors.label}
            </span>
            {rarity === "legendary" && earned && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className={cn("w-4 h-4", colors.text)} />
              </motion.div>
            )}
          </div>

          {/* Image area */}
          <div className="flex-1 flex items-center justify-center rounded-xl bg-card/50 mb-3 overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
                <span className="text-3xl">📚</span>
              </div>
            )}
          </div>

          {/* Card info */}
          <div className="text-center">
            <h3 className="font-bold text-foreground text-sm line-clamp-1">
              {name}
            </h3>
            {description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Legendary shimmer effect */}
        {rarity === "legendary" && earned && (
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
        )}
      </div>

      {/* Lock overlay for unearned */}
      {!earned && (
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/5 rounded-2xl">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-muted-foreground" />
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Re-export Rarity type for consumers
export type { Rarity };
