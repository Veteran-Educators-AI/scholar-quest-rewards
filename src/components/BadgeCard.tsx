import { motion } from "framer-motion";
import { Award, Lock } from "lucide-react";

interface BadgeCardProps {
  name: string;
  description?: string;
  iconUrl?: string;
  earned?: boolean;
  earnedAt?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function BadgeCard({
  name,
  description,
  iconUrl,
  earned = false,
  earnedAt,
  size = "md",
  className = "",
}: BadgeCardProps) {
  const sizeClasses = {
    sm: {
      container: "w-20 h-20",
      icon: "w-10 h-10",
      text: "text-xs",
    },
    md: {
      container: "w-28 h-28",
      icon: "w-14 h-14",
      text: "text-sm",
    },
    lg: {
      container: "w-36 h-36",
      icon: "w-20 h-20",
      text: "text-base",
    },
  };

  const s = sizeClasses[size];

  return (
    <motion.div
      className={`flex flex-col items-center gap-2 ${className}`}
      whileHover={earned ? { scale: 1.05, y: -4 } : {}}
      whileTap={earned ? { scale: 0.98 } : {}}
    >
      <div
        className={`${s.container} rounded-2xl flex items-center justify-center relative ${
          earned
            ? "bg-gradient-gold shadow-glow-gold"
            : "bg-muted"
        }`}
      >
        {earned ? (
          iconUrl ? (
            <img
              src={iconUrl}
              alt={name}
              loading="lazy"
              decoding="async"
              className={`${s.icon} object-contain`}
            />
          ) : (
            <Award className={`${s.icon} text-gold-foreground`} />
          )
        ) : (
          <>
            <Lock className={`${s.icon} text-muted-foreground/50`} />
            <div className="absolute inset-0 bg-foreground/5 rounded-2xl" />
          </>
        )}
        
        {earned && (
          <motion.div
            className="absolute -top-1 -right-1 w-6 h-6 bg-success rounded-full flex items-center justify-center shadow-md"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
          >
            <svg className="w-4 h-4 text-success-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}
      </div>
      
      <div className="text-center">
        <p className={`${s.text} font-bold ${earned ? "text-foreground" : "text-muted-foreground"}`}>
          {name}
        </p>
        {description && (
          <p className={`${s.text} text-muted-foreground line-clamp-2`}>
            {description}
          </p>
        )}
      </div>
    </motion.div>
  );
}
