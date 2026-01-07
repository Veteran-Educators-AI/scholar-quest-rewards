import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface XPBarProps {
  currentXP: number;
  xpForNextLevel: number;
  level: number;
  showLevel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function XPBar({
  currentXP,
  xpForNextLevel,
  level,
  showLevel = true,
  size = "md",
  className = "",
}: XPBarProps) {
  const progress = Math.min((currentXP / xpForNextLevel) * 100, 100);
  
  const sizeClasses = {
    sm: {
      bar: "h-3",
      text: "text-xs",
      icon: "w-4 h-4",
      badge: "w-8 h-8 text-xs",
    },
    md: {
      bar: "h-4",
      text: "text-sm",
      icon: "w-5 h-5",
      badge: "w-10 h-10 text-sm",
    },
    lg: {
      bar: "h-6",
      text: "text-base",
      icon: "w-6 h-6",
      badge: "w-12 h-12 text-base",
    },
  };

  const s = sizeClasses[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showLevel && (
        <motion.div
          className={`${s.badge} bg-gradient-gold rounded-full flex items-center justify-center font-bold text-gold-foreground shadow-glow-gold`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {level}
        </motion.div>
      )}
      
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <div className={`flex items-center gap-1 ${s.text} font-semibold text-foreground`}>
            <Star className={`${s.icon} text-gold fill-gold`} />
            <span>{currentXP.toLocaleString()} XP</span>
          </div>
          <span className={`${s.text} text-muted-foreground`}>
            {xpForNextLevel.toLocaleString()} to level {level + 1}
          </span>
        </div>
        
        <div className={`${s.bar} bg-muted rounded-full overflow-hidden shadow-inner`}>
          <motion.div
            className="h-full bg-gradient-gold rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="absolute inset-0 animate-shimmer" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
