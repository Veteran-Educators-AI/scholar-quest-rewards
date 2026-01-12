import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WinnerReveal } from "./WinnerReveal";
import { Ticket, Users, Trophy, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LottoDraw {
  id: string;
  title: string;
  prize_description: string;
  end_date: string;
}

interface Participant {
  student_id: string;
  full_name: string;
  entry_count: number;
}

interface RaffleWinnerPickerProps {
  draw: LottoDraw;
  participants: Participant[];
  onWinnerSelected: () => void;
}

export function RaffleWinnerPicker({ 
  draw, 
  participants, 
  onWinnerSelected 
}: RaffleWinnerPickerProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);
  const { toast } = useToast();

  const totalEntries = participants.reduce((sum, p) => sum + p.entry_count, 0);

  const selectWinner = async () => {
    if (participants.length === 0) {
      toast({
        title: "No participants",
        description: "There are no entries for this raffle yet.",
        variant: "destructive",
      });
      return;
    }

    setIsSelecting(true);

    try {
      // Create weighted array based on entries
      const weightedPool: string[] = [];
      participants.forEach(p => {
        for (let i = 0; i < p.entry_count; i++) {
          weightedPool.push(p.student_id);
        }
      });

      // Random selection
      const randomIndex = Math.floor(Math.random() * weightedPool.length);
      const winnerId = weightedPool[randomIndex];
      const selectedWinner = participants.find(p => p.student_id === winnerId)!;

      // Update database
      const { error: updateError } = await supabase
        .from("lotto_draws")
        .update({
          winner_id: winnerId,
          winner_selected_at: new Date().toISOString(),
          is_active: false,
        })
        .eq("id", draw.id);

      if (updateError) throw updateError;

      // Create notification for winner
      await supabase.from("notifications").insert({
        user_id: winnerId,
        title: "🎉 You Won the Raffle!",
        message: `Congratulations! You won "${draw.title}" - ${draw.prize_description}`,
        type: "raffle_win",
        icon: "🏆",
        data: { draw_id: draw.id, prize: draw.prize_description },
      });

      // Create notifications for all other participants
      const otherParticipants = participants.filter(p => p.student_id !== winnerId);
      if (otherParticipants.length > 0) {
        const notifications = otherParticipants.map(p => ({
          user_id: p.student_id,
          title: "Raffle Results Announced",
          message: `The winner of "${draw.title}" has been selected! Better luck next time - keep completing assignments for more entries!`,
          type: "raffle_result",
          icon: "🎟️",
          data: { draw_id: draw.id, winner_name: selectedWinner.full_name },
        }));

        await supabase.from("notifications").insert(notifications);
      }

      setWinner(selectedWinner);
      setIsSelecting(false);
      setShowReveal(true);

    } catch (error) {
      console.error("Error selecting winner:", error);
      toast({
        title: "Error",
        description: "Failed to select winner. Please try again.",
        variant: "destructive",
      });
      setIsSelecting(false);
    }
  };

  const handleRevealClose = () => {
    setShowReveal(false);
    onWinnerSelected();
  };

  return (
    <>
      <Card className="border-2 border-primary/30">
        <CardHeader className="bg-gradient-primary text-primary-foreground rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Select Winner: {draw.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary/5 rounded-xl p-4 text-center">
              <Users className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{participants.length}</p>
              <p className="text-sm text-muted-foreground">Participants</p>
            </div>
            <div className="bg-gold/10 rounded-xl p-4 text-center">
              <Ticket className="w-8 h-8 text-gold mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{totalEntries}</p>
              <p className="text-sm text-muted-foreground">Total Entries</p>
            </div>
          </div>

          {/* Prize */}
          <div className="bg-gradient-gold rounded-xl p-4 text-center">
            <p className="text-sm text-gold-foreground/80">Prize</p>
            <p className="text-xl font-bold text-gold-foreground">{draw.prize_description}</p>
          </div>

          {/* Top Participants Preview */}
          {participants.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Top Participants</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {participants
                  .sort((a, b) => b.entry_count - a.entry_count)
                  .slice(0, 5)
                  .map((p, idx) => (
                    <motion.div
                      key={p.student_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between bg-card rounded-lg p-2 border border-border"
                    >
                      <span className="font-medium text-foreground">{p.full_name}</span>
                      <span className="text-sm text-primary font-bold">{p.entry_count} entries</span>
                    </motion.div>
                  ))}
              </div>
            </div>
          )}

          {/* Select Winner Button */}
          <Button 
            variant="hero" 
            size="xl" 
            className="w-full"
            onClick={selectWinner}
            disabled={isSelecting || participants.length === 0}
          >
            {isSelecting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Selecting...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Draw Winner!
              </>
            )}
          </Button>

          {participants.length === 0 && (
            <p className="text-sm text-center text-muted-foreground">
              No participants yet. Scholars need to complete assignments to enter!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Winner Reveal Modal */}
      <WinnerReveal
        isOpen={showReveal}
        onClose={handleRevealClose}
        winnerName={winner?.full_name || ""}
        prizeName={draw.prize_description}
        drawTitle={draw.title}
      />
    </>
  );
}
