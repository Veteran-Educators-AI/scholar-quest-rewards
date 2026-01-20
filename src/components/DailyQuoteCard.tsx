/**
 * DailyQuoteCard Component
 *
 * Displays daily growth mindset quotes with save and share functionality.
 * Refactored to use common utilities for cleaner code.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Quote, RefreshCw, Share2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDailyQuote, getRandomQuote, type GrowthQuote } from "@/data/growthMindsetQuotes";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface DailyQuoteCardProps {
  className?: string;
}

export function DailyQuoteCard({ className = "" }: DailyQuoteCardProps) {
  const [quote, setQuote] = useState<GrowthQuote>(getDailyQuote());
  const [isLiked, setIsLiked] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Check if this quote was liked before
  useEffect(() => {
    const likedQuotes = JSON.parse(localStorage.getItem("liked_quotes") || "[]");
    setIsLiked(likedQuotes.includes(quote.quote));
  }, [quote]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setQuote(getRandomQuote());
      setIsRefreshing(false);
    }, 300);
  };

  const handleLike = () => {
    const likedQuotes = JSON.parse(localStorage.getItem("liked_quotes") || "[]");
    if (isLiked) {
      const updated = likedQuotes.filter((q: string) => q !== quote.quote);
      localStorage.setItem("liked_quotes", JSON.stringify(updated));
    } else {
      likedQuotes.push(quote.quote);
      localStorage.setItem("liked_quotes", JSON.stringify(likedQuotes));
      toast({
        title: "Quote saved! 💪",
        description: "This inspiration has been saved to your favorites.",
      });
    }
    setIsLiked(!isLiked);
  };

  const handleShare = async () => {
    const shareText = `"${quote.quote}" — ${quote.author}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Inspirational Quote",
          text: shareText,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to clipboard! 📋",
        description: "Share this inspiration with others!",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-accent/5 to-success/5 border border-primary/20">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Daily Inspiration</h3>
                <p className="text-xs text-muted-foreground">Effort beats talent every time</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>

          {/* Quote */}
          <AnimatePresence mode="wait">
            <motion.div
              key={quote.quote}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <Quote className="absolute -top-1 -left-1 w-6 h-6 text-primary/20" />
              <p className="text-foreground font-medium leading-relaxed pl-5 pr-2">
                {quote.quote}
              </p>
              <div className="mt-3 pl-5">
                <p className="text-sm font-semibold text-primary">— {quote.author}</p>
                {quote.context && (
                  <p className="text-xs text-muted-foreground mt-0.5">{quote.context}</p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 gap-1.5",
                isLiked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
              )}
              onClick={handleLike}
            >
              <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
              <span className="text-xs">Save</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground hover:text-primary"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
              <span className="text-xs">Share</span>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
