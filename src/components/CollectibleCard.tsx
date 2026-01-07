import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

type Rarity = "common" | "rare" | "epic" | "legendary";

interface CollectibleCardProps {
  name: string;
  description?: string;
  imageUrl?: string;
  rarity: Rarity;
  earned?: boolean;
  className?: string;
}

export function CollectibleCard({
  name,
  description,
  imageUrl,
  rarity,
  earned = true,
  className = "",
}: CollectibleCardProps) {
  const rarityStyles: Record<Rarity, { bg: string; border: string; glow: string; label: string }> = {
    common: {
      bg: "bg-muted",
      border: "border-rarity-common",
      glow: "",
      label: "Common",
    },
    rare: {
      bg: "bg-gradient-to-br from-blue-500/10 to-blue-600/10",
      border: "border-rarity-rare",
      glow: "shadow-[0_0_20px_hsl(217_91%_60%/0.3)]",
      label: "Rare",
    },
    epic: {
      bg: "bg-gradient-to-br from-purple-500/10 to-purple-600/10",
      border: "border-rarity-epic",
      glow: "shadow-[0_0_20px_hsl(262_83%_58%/0.4)]",
      label: "Epic",
    },
    legendary: {
      bg: "bg-gradient-to-br from-yellow-500/10 to-orange-500/10",
      border: "border-rarity-legendary",
      glow: "shadow-[0_0_30px_hsl(43_96%_56%/0.5)]",
      label: "Legendary",
    },
  };

  const style = rarityStyles[rarity];

  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={earned ? { scale: 1.03, y: -4 } : {}}
      whileTap={earned ? { scale: 0.98 } : {}}
    >
      <div
        className={`
          relative overflow-hidden rounded-2xl border-2 ${style.border} ${style.bg}
          ${earned ? style.glow : "opacity-50 grayscale"}
          transition-all duration-300
        `}
      >
        {/* Card content */}
        <div className="aspect-[3/4] p-4 flex flex-col">
          {/* Rarity indicator */}
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                ${rarity === "common" ? "bg-rarity-common/20 text-rarity-common" : ""}
                ${rarity === "rare" ? "bg-rarity-rare/20 text-rarity-rare" : ""}
                ${rarity === "epic" ? "bg-rarity-epic/20 text-rarity-epic" : ""}
                ${rarity === "legendary" ? "bg-rarity-legendary/20 text-rarity-legendary" : ""}
              `}
            >
              {style.label}
            </span>
            {rarity === "legendary" && earned && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 text-rarity-legendary" />
              </motion.div>
            )}
          </div>

          {/* Image area */}
          <div className="flex-1 flex items-center justify-center rounded-xl bg-card/50 mb-3 overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
                <span className="text-3xl">📚</span>
              </div>
            )}
          </div>

          {/* Card info */}
          <div className="text-center">
            <h3 className="font-bold text-foreground text-sm line-clamp-1">{name}</h3>
            {description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{description}</p>
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
            <span className="text-2xl">🔒</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
