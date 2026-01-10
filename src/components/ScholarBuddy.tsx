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
        
        {/* Lateral brain view */}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl relative z-10">
          <defs>
            {/* Gradient for the brain */}
            <linearGradient id="brainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(0 85% 58%)" />
              <stop offset="50%" stopColor="hsl(0 85% 50%)" />
              <stop offset="100%" stopColor="hsl(0 75% 40%)" />
            </linearGradient>
            
            {/* Glow filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Lateral brain shape - main outline */}
          <path 
            d="M75 50
               C75 30 65 15 50 15
               C35 15 20 25 15 40
               C10 55 15 70 25 80
               C35 90 55 90 65 85
               C75 80 85 70 85 55
               C85 45 80 40 75 50
               Z"
            fill="url(#brainGradient)"
          />
          
          {/* Frontal lobe */}
          <path 
            d="M70 35
               C65 25 55 20 45 22
               C40 23 35 28 35 35"
            stroke="hsl(0 70% 38%)" 
            strokeWidth="2" 
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Central sulcus */}
          <path 
            d="M55 22 
               C52 35 48 50 52 65"
            stroke="hsl(0 70% 38%)" 
            strokeWidth="2.5" 
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Lateral sulcus (Sylvian fissure) */}
          <path 
            d="M25 55
               C35 50 50 48 65 55"
            stroke="hsl(0 70% 38%)" 
            strokeWidth="2" 
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Parietal lobe folds */}
          <path 
            d="M60 30 C65 40 68 50 65 60"
            stroke="hsl(0 70% 38%)" 
            strokeWidth="1.5" 
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Temporal lobe folds */}
          <path 
            d="M30 60 C40 62 50 65 55 70"
            stroke="hsl(0 70% 38%)" 
            strokeWidth="1.5" 
            fill="none"
            strokeLinecap="round"
          />
          <path 
            d="M25 70 C35 72 45 75 50 78"
            stroke="hsl(0 70% 38%)" 
            strokeWidth="1.5" 
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Occipital lobe fold */}
          <path 
            d="M70 60 C75 65 78 72 75 78"
            stroke="hsl(0 70% 38%)" 
            strokeWidth="1.5" 
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Frontal lobe details */}
          <path 
            d="M35 35 C32 42 30 50 32 55"
            stroke="hsl(0 70% 38%)" 
            strokeWidth="1.5" 
            fill="none"
            strokeLinecap="round"
          />
          <path 
            d="M42 28 C40 38 38 48 42 55"
            stroke="hsl(0 70% 38%)" 
            strokeWidth="1.5" 
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Circuit nodes - glowing dots */}
          <g filter="url(#glow)">
            <circle cx="45" cy="35" r="3" fill="hsl(0 0% 95%)" opacity="0.95" />
            <circle cx="62" cy="42" r="2.5" fill="hsl(0 0% 90%)" opacity="0.85" />
            <circle cx="55" cy="55" r="3" fill="hsl(0 0% 95%)" opacity="0.9" />
            <circle cx="35" cy="50" r="2.5" fill="hsl(0 0% 90%)" opacity="0.85" />
            <circle cx="40" cy="68" r="2.5" fill="hsl(0 0% 90%)" opacity="0.8" />
            <circle cx="68" cy="65" r="2" fill="hsl(0 0% 90%)" opacity="0.75" />
            <circle cx="30" cy="38" r="2" fill="hsl(0 0% 90%)" opacity="0.75" />
          </g>
          
          {/* Circuit connections */}
          <g stroke="hsl(0 0% 85%)" strokeWidth="1" opacity="0.5">
            <line x1="45" y1="35" x2="55" y2="55" />
            <line x1="62" y1="42" x2="55" y2="55" />
            <line x1="35" y1="50" x2="55" y2="55" />
            <line x1="55" y1="55" x2="40" y2="68" />
            <line x1="55" y1="55" x2="68" y2="65" />
            <line x1="30" y1="38" x2="45" y2="35" />
            <line x1="35" y1="50" x2="40" y2="68" />
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
