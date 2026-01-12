import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/Confetti";
import { Trophy, Sparkles, X, PartyPopper } from "lucide-react";

interface WinnerRevealProps {
  isOpen: boolean;
  onClose: () => void;
  winnerName: string;
  prizeName: string;
  drawTitle: string;
}

export function WinnerReveal({ 
  isOpen, 
  onClose, 
  winnerName, 
  prizeName, 
  drawTitle 
}: WinnerRevealProps) {
  const [phase, setPhase] = useState<"countdown" | "drumroll" | "reveal" | "celebrate">("countdown");
  const [countdown, setCountdown] = useState(3);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPhase("countdown");
      setCountdown(3);
      setShowConfetti(false);
      return;
    }

    // Countdown phase
    if (phase === "countdown" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }

    // Move to drumroll after countdown
    if (phase === "countdown" && countdown === 0) {
      setPhase("drumroll");
      const timer = setTimeout(() => setPhase("reveal"), 2000);
      return () => clearTimeout(timer);
    }

    // Move to celebrate after reveal
    if (phase === "reveal") {
      setShowConfetti(true);
      const timer = setTimeout(() => setPhase("celebrate"), 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, phase, countdown]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/95 backdrop-blur-lg z-50 flex items-center justify-center"
      >
        <Confetti active={showConfetti} />
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </Button>

        <div className="text-center px-4 max-w-md">
          {/* Countdown Phase */}
          {phase === "countdown" && countdown > 0 && (
            <motion.div
              key="countdown"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
            >
              <motion.div
                key={countdown}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="text-9xl font-extrabold text-gradient-primary"
              >
                {countdown}
              </motion.div>
              <p className="text-xl text-muted-foreground mt-4">Get ready...</p>
            </motion.div>
          )}

          {/* Drumroll Phase */}
          {phase === "drumroll" && (
            <motion.div
              key="drumroll"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, -5, 5, 0],
                }}
                transition={{ 
                  duration: 0.3, 
                  repeat: Infinity,
                }}
                className="text-8xl mx-auto"
              >
                🥁
              </motion.div>
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-2xl font-bold text-foreground"
              >
                And the winner is...
              </motion.p>
            </motion.div>
          )}

          {/* Reveal Phase */}
          {(phase === "reveal" || phase === "celebrate") && (
            <motion.div
              key="reveal"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 10 }}
              className="space-y-6"
            >
              {/* Trophy Icon */}
              <motion.div
                animate={phase === "celebrate" ? {
                  y: [0, -10, 0],
                  scale: [1, 1.1, 1],
                } : {}}
                transition={{ 
                  duration: 0.5, 
                  repeat: phase === "celebrate" ? Infinity : 0,
                }}
                className="relative mx-auto w-32 h-32"
              >
                <div className="absolute inset-0 bg-gradient-gold rounded-full blur-xl opacity-50" />
                <div className="relative w-full h-full bg-gradient-gold rounded-full flex items-center justify-center">
                  <Trophy className="w-16 h-16 text-gold-foreground" />
                </div>
                
                {/* Sparkles */}
                {phase === "celebrate" && (
                  <>
                    <motion.div
                      animate={{ 
                        scale: [0, 1, 0],
                        rotate: [0, 180],
                      }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                      className="absolute -top-2 -left-2"
                    >
                      <Sparkles className="w-6 h-6 text-gold" />
                    </motion.div>
                    <motion.div
                      animate={{ 
                        scale: [0, 1, 0],
                        rotate: [0, -180],
                      }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                      className="absolute -top-2 -right-2"
                    >
                      <Sparkles className="w-6 h-6 text-gold" />
                    </motion.div>
                    <motion.div
                      animate={{ 
                        scale: [0, 1, 0],
                        rotate: [0, 180],
                      }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2"
                    >
                      <Sparkles className="w-6 h-6 text-gold" />
                    </motion.div>
                  </>
                )}
              </motion.div>

              {/* Winner Name */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-lg text-muted-foreground mb-2">{drawTitle}</p>
                <h1 className="text-4xl md:text-5xl font-extrabold text-gradient-primary mb-2">
                  {winnerName}
                </h1>
                <div className="flex items-center justify-center gap-2 text-2xl">
                  <PartyPopper className="w-6 h-6 text-gold" />
                  <span className="font-bold text-foreground">WINNER!</span>
                  <PartyPopper className="w-6 h-6 text-gold" />
                </div>
              </motion.div>

              {/* Prize */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-gold rounded-2xl p-4 mx-auto max-w-sm"
              >
                <p className="text-sm text-gold-foreground/80 mb-1">Prize Won</p>
                <p className="text-xl font-bold text-gold-foreground">{prizeName}</p>
              </motion.div>

              {/* Close Button */}
              {phase === "celebrate" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  <Button variant="hero" size="lg" onClick={onClose}>
                    🎉 Awesome!
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
