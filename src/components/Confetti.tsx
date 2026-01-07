import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface ConfettiProps {
  active: boolean;
  duration?: number;
}

interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  scale: number;
}

export function Confetti({ active, duration = 3000 }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (active) {
      const colors = [
        "hsl(199 89% 48%)", // Primary blue
        "hsl(25 95% 53%)",  // Secondary orange
        "hsl(142 71% 45%)", // Success green
        "hsl(43 96% 56%)",  // Gold
        "hsl(262 83% 58%)", // Accent purple
        "hsl(45 93% 47%)",  // Warning yellow
      ];

      const newParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
      }));

      setParticles(newParticles);

      const timeout = setTimeout(() => {
        setParticles([]);
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [active, duration]);

  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-3 h-3"
              style={{
                left: `${particle.x}%`,
                backgroundColor: particle.color,
                borderRadius: Math.random() > 0.5 ? "50%" : "0",
              }}
              initial={{
                y: -20,
                rotate: 0,
                scale: particle.scale,
                opacity: 1,
              }}
              animate={{
                y: "100vh",
                rotate: particle.rotation + 720,
                opacity: 0,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2 + Math.random(),
                delay: particle.delay,
                ease: "easeIn",
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
