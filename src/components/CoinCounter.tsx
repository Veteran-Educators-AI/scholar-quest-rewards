import { motion } from "framer-motion";

interface CoinCounterProps {
  coins: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CoinCounter({ coins, size = "md", className = "" }: CoinCounterProps) {
  const sizeClasses = {
    sm: {
      container: "px-2.5 py-1",
      coin: "w-5 h-5 text-sm",
      text: "text-sm",
    },
    md: {
      container: "px-3 py-1.5",
      coin: "w-6 h-6 text-base",
      text: "text-base",
    },
    lg: {
      container: "px-4 py-2",
      coin: "w-8 h-8 text-lg",
      text: "text-lg",
    },
  };

  const s = sizeClasses[size];

  return (
    <motion.div
      className={`inline-flex items-center gap-1.5 bg-warning/10 rounded-full ${s.container} ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className={`${s.coin} bg-gradient-gold rounded-full flex items-center justify-center shadow-sm`}
        animate={{ rotateY: [0, 360] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
      >
        <span className="font-bold text-gold-foreground">$</span>
      </motion.div>
      <span className={`${s.text} font-bold text-warning`}>{coins.toLocaleString()}</span>
    </motion.div>
  );
}
