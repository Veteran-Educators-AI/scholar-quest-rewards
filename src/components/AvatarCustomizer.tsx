import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Check, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Rarity = "common" | "rare" | "epic" | "legendary";
type Slot = "frame" | "background" | "hat" | "pet" | "accessory";

interface Collectible {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string | null;
  rarity: Rarity;
  slot: Slot;
  earned: boolean;
}

interface EquippedItems {
  frame?: Collectible;
  background?: Collectible;
  hat?: Collectible;
  pet?: Collectible;
}

interface AvatarCustomizerProps {
  collectibles: Collectible[];
  equippedItems: EquippedItems;
  onEquip: (slot: Slot, collectible: Collectible | null) => void;
  userName?: string;
}

const slotConfig: { slot: Slot; label: string; icon: string }[] = [
  { slot: "background", label: "Background", icon: "🌅" },
  { slot: "frame", label: "Frame", icon: "🖼️" },
  { slot: "hat", label: "Hat", icon: "🎩" },
  { slot: "pet", label: "Pet", icon: "🐾" },
];

const rarityColors: Record<Rarity, string> = {
  common: "border-rarity-common bg-rarity-common/10",
  rare: "border-rarity-rare bg-rarity-rare/10",
  epic: "border-rarity-epic bg-rarity-epic/10",
  legendary: "border-rarity-legendary bg-rarity-legendary/10",
};

const backgroundStyles: Record<string, string> = {
  "Galaxy Background": "bg-gradient-to-br from-purple-900 via-indigo-900 to-black",
  "Forest Background": "bg-gradient-to-br from-green-700 via-green-600 to-emerald-500",
  "Ocean Background": "bg-gradient-to-br from-blue-500 via-cyan-400 to-teal-300",
  "Sky Background": "bg-gradient-to-br from-sky-400 via-blue-300 to-white",
};

const frameStyles: Record<string, string> = {
  "Golden Frame": "ring-4 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]",
  "Star Frame": "ring-4 ring-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.5)]",
  "Rainbow Frame": "ring-4 ring-gradient-to-r from-red-500 via-yellow-500 to-blue-500",
  "Basic Frame": "ring-2 ring-muted-foreground/30",
};

const hatEmojis: Record<string, string> = {
  "Wizard Hat": "🧙",
  "Crown": "👑",
  "Graduation Cap": "🎓",
  "Baseball Cap": "🧢",
  "Scholar Hat": "🎓",
};

const petEmojis: Record<string, string> = {
  "Phoenix Companion": "🔥",
  "Owl Companion": "🦉",
  "Cat Companion": "🐱",
  "Puppy Companion": "🐶",
};

export function AvatarCustomizer({ collectibles, equippedItems, onEquip, userName }: AvatarCustomizerProps) {
  const [open, setOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<Slot>("frame");

  const earnedCollectibles = collectibles.filter((c) => c.earned);
  const slotCollectibles = earnedCollectibles.filter((c) => c.slot === activeSlot);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative group"
        >
          <AvatarPreview equippedItems={equippedItems} size="lg" userName={userName} />
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-sm font-medium">Customize</span>
          </div>
        </motion.button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Customize Your Avatar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview */}
          <div className="flex justify-center py-4">
            <AvatarPreview equippedItems={equippedItems} size="xl" userName={userName} />
          </div>

          {/* Slot Tabs */}
          <Tabs value={activeSlot} onValueChange={(v) => setActiveSlot(v as Slot)}>
            <TabsList className="grid grid-cols-4 w-full">
              {slotConfig.map((config) => (
                <TabsTrigger key={config.slot} value={config.slot} className="text-xs">
                  <span className="mr-1">{config.icon}</span>
                  <span className="hidden sm:inline">{config.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {slotConfig.map((config) => (
              <TabsContent key={config.slot} value={config.slot} className="mt-4">
                <div className="grid grid-cols-3 gap-3">
                  {/* None option */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onEquip(config.slot, null)}
                    className={cn(
                      "relative aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 transition-colors hover:border-primary/50",
                      !equippedItems[config.slot] && "border-primary bg-primary/10"
                    )}
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">None</span>
                    {!equippedItems[config.slot] && (
                      <div className="absolute top-1 right-1">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </motion.button>

                  {/* Collectible options */}
                  {collectibles
                    .filter((c) => c.slot === config.slot)
                    .map((collectible) => (
                      <CollectibleOption
                        key={collectible.id}
                        collectible={collectible}
                        isEquipped={equippedItems[config.slot]?.id === collectible.id}
                        onSelect={() => collectible.earned && onEquip(config.slot, collectible)}
                      />
                    ))}
                </div>

                {slotCollectibles.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm mt-4">
                    Complete challenges to unlock {config.label.toLowerCase()} items!
                  </p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CollectibleOption({
  collectible,
  isEquipped,
  onSelect,
}: {
  collectible: Collectible;
  isEquipped: boolean;
  onSelect: () => void;
}) {
  const getPreviewContent = () => {
    switch (collectible.slot) {
      case "hat":
        return hatEmojis[collectible.name] || "🎩";
      case "pet":
        return petEmojis[collectible.name] || "🐾";
      case "frame":
        return "🖼️";
      case "background":
        return "🌅";
      default:
        return "✨";
    }
  };

  return (
    <motion.button
      whileHover={collectible.earned ? { scale: 1.05 } : {}}
      whileTap={collectible.earned ? { scale: 0.95 } : {}}
      onClick={onSelect}
      disabled={!collectible.earned}
      className={cn(
        "relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all",
        rarityColors[collectible.rarity],
        collectible.earned ? "cursor-pointer" : "opacity-40 grayscale cursor-not-allowed",
        isEquipped && "ring-2 ring-primary ring-offset-2"
      )}
    >
      <span className="text-2xl">{getPreviewContent()}</span>
      <span className="text-xs font-medium text-foreground line-clamp-1 px-1">
        {collectible.name.split(" ")[0]}
      </span>
      
      {isEquipped && (
        <div className="absolute top-1 right-1">
          <Check className="w-4 h-4 text-primary" />
        </div>
      )}
      
      {!collectible.earned && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-xl">
          <span className="text-lg">🔒</span>
        </div>
      )}

      {collectible.rarity === "legendary" && collectible.earned && (
        <motion.div
          className="absolute -top-1 -right-1"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-4 h-4 text-rarity-legendary" />
        </motion.div>
      )}
    </motion.button>
  );
}

export function AvatarPreview({
  equippedItems,
  size = "md",
  userName,
}: {
  equippedItems: EquippedItems;
  size?: "sm" | "md" | "lg" | "xl";
  userName?: string;
}) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
    xl: "w-28 h-28",
  };

  const petSizeClasses = {
    sm: "w-4 h-4 text-xs -bottom-1 -right-1",
    md: "w-5 h-5 text-sm -bottom-1 -right-1",
    lg: "w-6 h-6 text-base -bottom-2 -right-2",
    xl: "w-8 h-8 text-lg -bottom-2 -right-2",
  };

  const hatSizeClasses = {
    sm: "text-sm -top-2",
    md: "text-base -top-2",
    lg: "text-xl -top-3",
    xl: "text-2xl -top-4",
  };

  const bgStyle = equippedItems.background
    ? backgroundStyles[equippedItems.background.name] || "bg-gradient-hero"
    : "bg-gradient-hero";

  const frameStyle = equippedItems.frame
    ? frameStyles[equippedItems.frame.name] || ""
    : "";

  return (
    <div className="relative inline-block">
      {/* Main avatar */}
      <div
        className={cn(
          sizeClasses[size],
          bgStyle,
          frameStyle,
          "rounded-full flex items-center justify-center shadow-glow-primary relative overflow-hidden"
        )}
      >
        <User className={cn("text-primary-foreground", size === "xl" ? "w-12 h-12" : size === "lg" ? "w-10 h-10" : "w-8 h-8")} />
      </div>

      {/* Hat */}
      <AnimatePresence>
        {equippedItems.hat && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn("absolute left-1/2 -translate-x-1/2", hatSizeClasses[size])}
          >
            {hatEmojis[equippedItems.hat.name] || "🎩"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pet */}
      <AnimatePresence>
        {equippedItems.pet && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className={cn(
              "absolute rounded-full bg-card border border-border flex items-center justify-center",
              petSizeClasses[size]
            )}
          >
            {petEmojis[equippedItems.pet.name] || "🐾"}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
