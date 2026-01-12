import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScholarBuddy } from "@/components/ScholarBuddy";
import { Confetti } from "@/components/Confetti";
import { ArrowLeft, Ticket, Gift, Clock, Trophy, Sparkles, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface LottoDraw {
  id: string;
  title: string;
  description: string | null;
  prize_description: string;
  prize_image_url: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  winner_id: string | null;
}

interface LottoEntry {
  id: string;
  draw_id: string;
  earned_at: string;
  reason: string;
}

export default function Raffle() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  const { data: activeDraw } = useQuery({
    queryKey: ["active-draw"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lotto_draws")
        .select("*")
        .eq("is_active", true)
        .gte("end_date", new Date().toISOString())
        .order("end_date", { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as LottoDraw | null;
    },
  });

  const { data: myEntries = [] } = useQuery({
    queryKey: ["my-entries", activeDraw?.id],
    queryFn: async () => {
      if (!activeDraw?.id || !userId) return [];
      
      const { data, error } = await supabase
        .from("lotto_entries")
        .select("*")
        .eq("draw_id", activeDraw.id)
        .eq("student_id", userId);
      
      if (error) throw error;
      return data as LottoEntry[];
    },
    enabled: !!activeDraw?.id && !!userId,
  });

  const { data: pastWinners = [] } = useQuery({
    queryKey: ["past-winners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lotto_draws")
        .select("*, profiles:winner_id(full_name)")
        .not("winner_id", "is", null)
        .order("winner_selected_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  const getTimeLeft = () => {
    if (!activeDraw) return null;
    const end = new Date(activeDraw.end_date);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} days, ${hours} hours`;
    return `${hours} hours`;
  };

  // Demo data fallback
  const demoDraws = activeDraw ? null : {
    id: "demo",
    title: "January Super Raffle",
    description: "Complete assignments to earn entries! Every verified assignment = 1 raffle ticket.",
    prize_description: "🎮 $50 Gaming Gift Card",
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
  };

  const currentDraw = activeDraw || demoDraws;
  const entryCount = myEntries.length || 3; // Demo: 3 entries

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/student">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
            <h1 className="font-bold text-foreground">🎟️ Raffle</h1>
            <div className="w-16" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ScholarBuddy 
            size="md" 
            message="Complete assignments to earn raffle tickets! More entries = better chances! 🎰" 
          />

          {/* Current Draw */}
          {currentDraw && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6"
            >
              <Card className="overflow-hidden border-2 border-primary/30">
                <div className="bg-gradient-primary p-6 text-primary-foreground">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-sm font-medium opacity-90">ACTIVE RAFFLE</span>
                  </div>
                  <h2 className="text-2xl font-extrabold">{currentDraw.title}</h2>
                  {currentDraw.description && (
                    <p className="text-sm opacity-80 mt-1">{currentDraw.description}</p>
                  )}
                </div>
                
                <CardContent className="p-6 space-y-4">
                  {/* Prize Display */}
                  <div className="bg-gradient-gold rounded-xl p-4 text-center">
                    <Gift className="w-10 h-10 mx-auto text-gold-foreground mb-2" />
                    <p className="text-lg font-bold text-gold-foreground">
                      {currentDraw.prize_description}
                    </p>
                  </div>

                  {/* Time Left */}
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Drawing in: <strong className="text-foreground">{getTimeLeft() || "7 days"}</strong></span>
                  </div>

                  {/* My Entries */}
                  <div className="bg-primary/5 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Ticket className="w-8 h-8 text-primary" />
                      <div>
                        <p className="text-3xl font-extrabold text-primary">{entryCount}</p>
                        <p className="text-sm text-muted-foreground">Your Entries</p>
                      </div>
                    </div>
                  </div>

                  {/* How to Earn */}
                  <div className="border border-border rounded-xl p-4">
                    <p className="font-medium text-foreground mb-3">How to earn entries:</p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center text-success">✓</span>
                        Complete an assignment = 1 entry
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center text-success">✓</span>
                        Score 90%+ = bonus entry
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center text-success">✓</span>
                        7-day streak = 3 bonus entries
                      </li>
                    </ul>
                  </div>

                  <Link to="/student" className="block">
                    <Button variant="hero" size="lg" className="w-full">
                      <Ticket className="w-4 h-4 mr-2" />
                      Complete Assignments to Earn More
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Entry History */}
          {myEntries.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6"
            >
              <h3 className="font-bold text-foreground mb-3">Your Recent Entries</h3>
              <div className="space-y-2">
                {myEntries.slice(0, 5).map((entry, idx) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-card rounded-lg p-3 border border-border flex items-center gap-3"
                  >
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Ticket className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">+1 Entry</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.earned_at).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Demo entries if no real data */}
          {myEntries.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6"
            >
              <h3 className="font-bold text-foreground mb-3">Your Recent Entries</h3>
              <div className="space-y-2">
                {[
                  { reason: "Math Magic: Multiplication", date: "Today" },
                  { reason: "Reading Comprehension", date: "Yesterday" },
                  { reason: "7-Day Streak Bonus", date: "2 days ago" },
                ].map((entry, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-card rounded-lg p-3 border border-border flex items-center gap-3"
                  >
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Ticket className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{entry.reason}</p>
                      <p className="text-xs text-muted-foreground">{entry.date}</p>
                    </div>
                    <span className="text-primary font-bold">+1</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Past Winners */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-gold" />
              Past Winners
            </h3>
            
            {pastWinners.length > 0 ? (
              <div className="space-y-2">
                {pastWinners.map((draw: any, idx: number) => (
                  <div key={draw.id} className="bg-card rounded-lg p-3 border border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{draw.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Winner: {draw.profiles?.full_name || "Scholar"}
                        </p>
                      </div>
                      <Trophy className="w-5 h-5 text-gold" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-muted rounded-xl p-6 text-center">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No winners yet - be the first!</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
