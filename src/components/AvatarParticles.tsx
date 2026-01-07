import { motion } from "framer-motion";
import { useMemo } from "react";

type Rarity = "epic" | "legendary";

interface ParticleConfig {
  count: number;
  colors: string[];
  type: "sparkle" | "flame" | "star" | "orb";
}

const rarityParticles: Record<Rarity, ParticleConfig> = {
  epic: {
    count: 6,
    colors: ["#a855f7", "#c084fc", "#e879f9"],
    type: "orb",
  },
  legendary: {
    count: 10,
    colors: ["#fbbf24", "#f59e0b", "#fcd34d", "#fff"],
    type: "sparkle",
  },
};

interface AvatarParticlesProps {
  rarity: Rarity;
  size: "sm" | "md" | "lg" | "xl";
}

export function AvatarParticles({ rarity, size }: AvatarParticlesProps) {
  const config = rarityParticles[rarity];
  
  const sizeMultiplier = {
    sm: 0.5,
    md: 0.75,
    lg: 1,
    xl: 1.25,
  }[size];

  const containerSize = {
    sm: "w-16 h-16",
    md: "w-20 h-20",
    lg: "w-24 h-24",
    xl: "w-36 h-36",
  }[size];

  const particles = useMemo(() => 
    Array.from({ length: config.count }, (_, i) => ({
      id: i,
      angle: (360 / config.count) * i,
      delay: i * 0.15,
      color: config.colors[i % config.colors.length],
      size: (3 + Math.random() * 3) * sizeMultiplier,
    })),
    [config.count, config.colors, sizeMultiplier]
  );

  if (rarity === "legendary") {
    return (
      <div className={`absolute inset-0 ${containerSize} -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 pointer-events-none`}>
        {/* Glow aura */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Sparkle particles */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute left-1/2 top-1/2"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
              x: [0, Math.cos(particle.angle * Math.PI / 180) * 35 * sizeMultiplier],
              y: [0, Math.sin(particle.angle * Math.PI / 180) * 35 * sizeMultiplier],
            }}
            transition={{
              duration: 1.5,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeOut",
            }}
          >
            <svg
              width={particle.size * 2}
              height={particle.size * 2}
              viewBox="0 0 24 24"
              fill={particle.color}
              className="drop-shadow-lg"
            >
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
            </svg>
          </motion.div>
        ))}
        
        {/* Rotating ring */}
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-dashed"
          style={{ borderColor: "rgba(251,191,36,0.4)" }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>
    );
  }

  // Epic particles - orbiting orbs
  return (
    <div className={`absolute inset-0 ${containerSize} -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 pointer-events-none`}>
      {/* Purple glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 60%)",
        }}
        animate={{
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Orbiting particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute left-1/2 top-1/2"
          animate={{
            rotate: [particle.angle, particle.angle + 360],
          }}
          transition={{
            duration: 4 + particle.id * 0.5,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <motion.div
            className="rounded-full blur-[1px]"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              transform: `translateX(${28 * sizeMultiplier}px)`,
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1.5,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

interface AvatarGlowProps {
  rarity: "epic" | "legendary";
  size: "sm" | "md" | "lg" | "xl";
}

export function AvatarGlow({ rarity, size }: AvatarGlowProps) {
  const glowColors = {
    epic: "rgba(168,85,247,0.5)",
    legendary: "rgba(251,191,36,0.6)",
  };

  const sizeClasses = {
    sm: "w-14 h-14",
    md: "w-18 h-18", 
    lg: "w-22 h-22",
    xl: "w-32 h-32",
  };

  return (
    <motion.div
      className={`absolute inset-0 ${sizeClasses[size]} -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full pointer-events-none`}
      style={{
        background: `radial-gradient(circle, ${glowColors[rarity]} 0%, transparent 70%)`,
      }}
      animate={{
        scale: [1, 1.15, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}
