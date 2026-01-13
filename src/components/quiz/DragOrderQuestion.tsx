import { useState, useCallback } from "react";
import { motion, Reorder } from "framer-motion";
import { GripVertical, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DragOrderQuestionProps {
  items: string[];
  currentAnswer?: string;
  onAnswer: (answer: string) => void;
}

export function DragOrderQuestion({ items, currentAnswer, onAnswer }: DragOrderQuestionProps) {
  // Initialize with shuffled items or parse current answer
  const [orderedItems, setOrderedItems] = useState<string[]>(() => {
    if (currentAnswer) {
      try {
        return JSON.parse(currentAnswer);
      } catch {
        return [...items].sort(() => Math.random() - 0.5);
      }
    }
    return [...items].sort(() => Math.random() - 0.5);
  });
  
  const [isConfirmed, setIsConfirmed] = useState(!!currentAnswer);

  const handleReorder = (newOrder: string[]) => {
    setOrderedItems(newOrder);
    setIsConfirmed(false);
  };

  const handleConfirm = () => {
    onAnswer(JSON.stringify(orderedItems));
    setIsConfirmed(true);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center mb-2">
        Drag items to put them in the correct order
      </p>
      
      <Reorder.Group
        axis="y"
        values={orderedItems}
        onReorder={handleReorder}
        className="space-y-2"
      >
        {orderedItems.map((item, index) => (
          <Reorder.Item
            key={item}
            value={item}
            className="cursor-grab active:cursor-grabbing"
          >
            <motion.div
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                isConfirmed 
                  ? "bg-primary/10 border-primary" 
                  : "bg-card border-border hover:border-primary/50"
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm text-muted-foreground">
                {index + 1}
              </span>
              <GripVertical className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 font-medium">{item}</span>
            </motion.div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <Button
        variant={isConfirmed ? "outline" : "default"}
        className="w-full mt-4"
        onClick={handleConfirm}
      >
        {isConfirmed ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Order Confirmed
          </>
        ) : (
          "Confirm Order"
        )}
      </Button>
    </div>
  );
}
