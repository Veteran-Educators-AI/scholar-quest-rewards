import { motion } from "framer-motion";
import { Flame, Shield } from "lucide-react";

interface StreakCounterProps {
  streak: number;
  hasShield?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StreakCounter({
  streak,
  hasShield = false,
  size = "md",
  className = "",
}: StreakCounterProps) {
  const sizeClasses = {
    sm: {
      container: "px-3 py-1.5",
      flame: "w-5 h-5",
      shield: "w-3 h-3",
      text: "text-sm",
    },
    md: {
      container: "px-4 py-2",
      flame: "w-6 h-6",
      shield: "w-4 h-4",
      text: "text-base",
    },
    lg: {
      container: "px-5 py-3",
      flame: "w-8 h-8",
      shield: "w-5 h-5",
      text: "text-lg",
    },
  };

  const s = sizeClasses[size];

  return (
    <motion.div
      className={`inline-flex items-center gap-2 bg-gradient-streak rounded-full ${s.container} shadow-glow-secondary ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="relative"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Flame className={`${s.flame} text-streak-foreground fill-streak-foreground drop-shadow-md`} />
        {streak >= 3 && (
          <motion.div
            className="absolute -inset-1 bg-streak/30 rounded-full blur-sm"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
          />
        )}
      </motion.div>
      
      <span className={`${s.text} font-extrabold text-streak-foreground`}>
        {streak} day{streak !== 1 ? 's' : ''}
      </span>
      
      {hasShield && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-0.5 bg-streak-foreground/20 rounded-full px-1.5 py-0.5"
        >
          <Shield className={`${s.shield} text-streak-foreground fill-streak-foreground/50`} />
        </motion.div>
      )}
    </motion.div>
  );
}
