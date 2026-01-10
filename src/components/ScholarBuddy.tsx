import { motion } from "framer-motion";
import brainLogo from "@/assets/brain-logo.png";

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
    sm: "w-[90px] h-[90px]",
    md: "w-[134px] h-[134px]",
    lg: "w-[180px] h-[180px]",
    xl: "w-[270px] h-[270px]",
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
        
        {/* Brain image */}
        <img 
          src={brainLogo} 
          alt="NYCologic Brain" 
          className="w-full h-full object-contain drop-shadow-2xl relative z-10"
        />
        
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
