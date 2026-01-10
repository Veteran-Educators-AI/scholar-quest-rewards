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
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} relative`}
        animate={animate ? {
          y: [0, -12, 0],
        } : {}}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Glow effect */}
        <motion.div 
          className="absolute inset-0 bg-primary/30 rounded-full blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Brain with circuit pattern */}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl relative z-10">
          <defs>
            {/* Gradient for the brain */}
            <linearGradient id="brainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(0 85% 55%)" />
              <stop offset="50%" stopColor="hsl(0 85% 50%)" />
              <stop offset="100%" stopColor="hsl(0 75% 42%)" />
            </linearGradient>
            
            {/* Glow filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Brain base shape - left hemisphere */}
          <path 
            d="M50 15 
               Q35 15 28 25 
               Q18 30 18 45 
               Q15 55 22 65 
               Q25 75 35 80 
               Q45 88 50 85"
            fill="url(#brainGradient)"
          />
          
          {/* Brain base shape - right hemisphere */}
          <path 
            d="M50 15 
               Q65 15 72 25 
               Q82 30 82 45 
               Q85 55 78 65 
               Q75 75 65 80 
               Q55 88 50 85"
            fill="url(#brainGradient)"
          />
          
          {/* Brain folds/sulci - left side */}
          <path 
            d="M30 35 Q38 40 35 50 Q32 60 38 68"
            stroke="hsl(0 75% 38%)" 
            strokeWidth="2" 
            fill="none"
            strokeLinecap="round"
          />
          <path 
            d="M25 50 Q35 52 40 58"
            stroke="hsl(0 75% 38%)" 
            strokeWidth="1.5" 
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Brain folds/sulci - right side */}
          <path 
            d="M70 35 Q62 40 65 50 Q68 60 62 68"
            stroke="hsl(0 75% 38%)" 
            strokeWidth="2" 
            fill="none"
            strokeLinecap="round"
          />
          <path 
            d="M75 50 Q65 52 60 58"
            stroke="hsl(0 75% 38%)" 
            strokeWidth="1.5" 
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Central divide */}
          <path 
            d="M50 18 L50 82"
            stroke="hsl(0 75% 38%)" 
            strokeWidth="2" 
            fill="none"
          />
          
          {/* Circuit nodes - glowing dots */}
          <g filter="url(#glow)">
            {/* Left hemisphere nodes */}
            <circle cx="32" cy="38" r="3" fill="hsl(0 0% 90%)" opacity="0.9" />
            <circle cx="28" cy="55" r="2.5" fill="hsl(0 0% 90%)" opacity="0.8" />
            <circle cx="38" cy="70" r="2.5" fill="hsl(0 0% 90%)" opacity="0.8" />
            <circle cx="42" cy="48" r="2" fill="hsl(0 0% 90%)" opacity="0.7" />
            
            {/* Right hemisphere nodes */}
            <circle cx="68" cy="38" r="3" fill="hsl(0 0% 90%)" opacity="0.9" />
            <circle cx="72" cy="55" r="2.5" fill="hsl(0 0% 90%)" opacity="0.8" />
            <circle cx="62" cy="70" r="2.5" fill="hsl(0 0% 90%)" opacity="0.8" />
            <circle cx="58" cy="48" r="2" fill="hsl(0 0% 90%)" opacity="0.7" />
            
            {/* Center nodes */}
            <circle cx="50" cy="30" r="3" fill="hsl(0 0% 95%)" opacity="1" />
            <circle cx="50" cy="50" r="2.5" fill="hsl(0 0% 90%)" opacity="0.9" />
            <circle cx="50" cy="70" r="2" fill="hsl(0 0% 90%)" opacity="0.8" />
          </g>
          
          {/* Circuit connections */}
          <g stroke="hsl(0 0% 80%)" strokeWidth="1" opacity="0.6">
            {/* Left connections */}
            <line x1="32" y1="38" x2="42" y2="48" />
            <line x1="28" y1="55" x2="42" y2="48" />
            <line x1="42" y1="48" x2="50" y2="50" />
            <line x1="38" y1="70" x2="50" y2="70" />
            
            {/* Right connections */}
            <line x1="68" y1="38" x2="58" y2="48" />
            <line x1="72" y1="55" x2="58" y2="48" />
            <line x1="58" y1="48" x2="50" y2="50" />
            <line x1="62" y1="70" x2="50" y2="70" />
            
            {/* Vertical connections */}
            <line x1="50" y1="30" x2="50" y2="50" />
            <line x1="50" y1="50" x2="50" y2="70" />
          </g>
          
          {/* Graduation cap */}
          <g>
            {/* Cap base */}
            <rect x="28" y="8" width="44" height="6" fill="hsl(0 0% 20%)" rx="1" />
            {/* Cap top */}
            <polygon points="50,2 26,12 74,12" fill="hsl(0 0% 20%)" />
            {/* Tassel button */}
            <circle cx="50" cy="2" r="3" fill="hsl(43 96% 56%)" />
            {/* Tassel */}
            <path d="M50 2 Q58 8 62 4" stroke="hsl(43 96% 56%)" strokeWidth="2" fill="none" />
          </g>
        </svg>
        
        {/* Floating particles */}
        <motion.div
          className="absolute -top-2 -right-2 w-2 h-2 bg-primary/60 rounded-full"
          animate={{
            y: [-5, -15, -5],
            opacity: [0.6, 0.2, 0.6],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-1 -left-3 w-1.5 h-1.5 bg-gold/70 rounded-full"
          animate={{
            y: [0, -10, 0],
            opacity: [0.7, 0.3, 0.7],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
        <motion.div
          className="absolute top-1/2 -right-4 w-1 h-1 bg-secondary/50 rounded-full"
          animate={{
            y: [-3, -12, -3],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </motion.div>
      
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl px-5 py-3 shadow-lg border border-border max-w-sm text-center backdrop-blur-sm"
        >
          <p className="text-sm font-medium text-foreground">{message}</p>
        </motion.div>
      )}
    </div>
  );
}
