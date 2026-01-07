import { motion } from "framer-motion";

interface ScholarBuddyProps {
  size?: "sm" | "md" | "lg" | "xl";
  message?: string;
  animate?: boolean;
  className?: string;
}

export function ScholarBuddy({ 
  size = "md", 
  message, 
  animate = true,
  className = ""
}: ScholarBuddyProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
    xl: "w-48 h-48",
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} relative`}
        animate={animate ? {
          y: [0, -8, 0],
          rotate: [-2, 2, -2],
        } : {}}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Owl body */}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
          {/* Main body */}
          <ellipse cx="50" cy="58" rx="35" ry="32" fill="hsl(199 89% 48%)" />
          
          {/* Belly */}
          <ellipse cx="50" cy="62" rx="25" ry="22" fill="hsl(210 50% 98%)" />
          
          {/* Left ear tuft */}
          <path d="M20 35 Q25 20 35 30" fill="hsl(199 89% 48%)" />
          
          {/* Right ear tuft */}
          <path d="M80 35 Q75 20 65 30" fill="hsl(199 89% 48%)" />
          
          {/* Head */}
          <circle cx="50" cy="35" r="25" fill="hsl(199 89% 48%)" />
          
          {/* Face disc */}
          <circle cx="50" cy="38" r="20" fill="hsl(210 50% 98%)" />
          
          {/* Left eye white */}
          <circle cx="40" cy="35" r="10" fill="white" />
          
          {/* Right eye white */}
          <circle cx="60" cy="35" r="10" fill="white" />
          
          {/* Left pupil */}
          <circle cx="42" cy="35" r="5" fill="hsl(222 47% 11%)" />
          
          {/* Right pupil */}
          <circle cx="62" cy="35" r="5" fill="hsl(222 47% 11%)" />
          
          {/* Left eye shine */}
          <circle cx="44" cy="33" r="2" fill="white" />
          
          {/* Right eye shine */}
          <circle cx="64" cy="33" r="2" fill="white" />
          
          {/* Beak */}
          <path d="M45 42 L50 50 L55 42 Z" fill="hsl(25 95% 53%)" />
          
          {/* Left wing */}
          <ellipse cx="22" cy="60" rx="10" ry="18" fill="hsl(199 89% 40%)" />
          
          {/* Right wing */}
          <ellipse cx="78" cy="60" rx="10" ry="18" fill="hsl(199 89% 40%)" />
          
          {/* Left foot */}
          <ellipse cx="38" cy="88" rx="8" ry="4" fill="hsl(25 95% 53%)" />
          
          {/* Right foot */}
          <ellipse cx="62" cy="88" rx="8" ry="4" fill="hsl(25 95% 53%)" />
          
          {/* Graduation cap */}
          <rect x="30" y="12" width="40" height="5" fill="hsl(222 47% 11%)" rx="1" />
          <polygon points="50,5 35,15 65,15" fill="hsl(222 47% 11%)" />
          <circle cx="50" cy="5" r="3" fill="hsl(43 96% 56%)" />
          <path d="M50 5 Q55 12 60 8" stroke="hsl(43 96% 56%)" strokeWidth="2" fill="none" />
        </svg>
      </motion.div>
      
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl px-4 py-2 shadow-md border border-border max-w-xs text-center"
        >
          <p className="text-sm font-medium text-foreground">{message}</p>
        </motion.div>
      )}
    </div>
  );
}
