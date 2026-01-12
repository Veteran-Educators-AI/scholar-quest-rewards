import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RaffleWinnerPicker } from "@/components/RaffleWinnerPicker";
import { 
  ArrowLeft, 
  Plus, 
  Trophy, 
  Ticket, 
  Calendar,
  Gift,
  Users,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface LottoDraw {
  id: string;
  title: string;
  description: string | null;
  prize_description: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  winner_id: string | null;
}

interface Participant {
  student_id: string;
  full_name: string;
  entry_count: number;
}

export default function TeacherRaffle() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDraw, setSelectedDraw] = useState<LottoDraw | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prize, setPrize] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Fetch all draws
  const { data: draws = [], refetch: refetchDraws } = useQuery({
    queryKey: ["teacher-lotto-draws"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lotto_draws")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as LottoDraw[];
    },
  });

  // Fetch participants for selected draw
  const { data: participants = [] } = useQuery({
    queryKey: ["draw-participants", selectedDraw?.id],
    queryFn: async () => {
      if (!selectedDraw) return [];
      
      const { data, error } = await supabase
        .from("lotto_entries")
        .select("student_id, profiles!inner(full_name)")
        .eq("draw_id", selectedDraw.id);
      
      if (error) throw error;
      
      // Count entries per student
      const entryMap: Record<string, { full_name: string; count: number }> = {};
      data.forEach((entry: any) => {
        const id = entry.student_id;
        if (!entryMap[id]) {
          entryMap[id] = { 
            full_name: entry.profiles?.full_name || "Unknown Scholar", 
            count: 0 
          };
        }
        entryMap[id].count++;
      });
      
      return Object.entries(entryMap).map(([student_id, { full_name, count }]) => ({
        student_id,
        full_name,
        entry_count: count,
      })) as Participant[];
    },
    enabled: !!selectedDraw,
  });

  const handleCreateDraw = async () => {
    if (!title || !prize || !endDate) {
      toast({
        title: "Missing fields",
        description: "Please fill in title, prize, and end date.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase.from("lotto_draws").insert({
        title,
        description: description || null,
        prize_description: prize,
        end_date: new Date(endDate).toISOString(),
        is_active: true,
      });

      if (error) throw error;

      toast({
        title: "Raffle created!",
        description: "Scholars can now earn entries by completing assignments.",
      });

      setShowCreateForm(false);
      setTitle("");
      setDescription("");
      setPrize("");
      setEndDate("");
      refetchDraws();
    } catch (error) {
      console.error("Error creating draw:", error);
      toast({
        title: "Error",
        description: "Failed to create raffle. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleWinnerSelected = () => {
    setSelectedDraw(null);
    refetchDraws();
    queryClient.invalidateQueries({ queryKey: ["draw-participants"] });
  };

  const activeDraws = draws.filter(d => d.is_active && !d.winner_id);
  const completedDraws = draws.filter(d => d.winner_id);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/teacher">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <h1 className="font-bold text-foreground">🎟️ Manage Raffles</h1>
            <Button 
              variant="hero" 
              size="sm"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              New Raffle
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-8">
        {/* Create Form */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Create New Raffle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Title</label>
                  <Input
                    placeholder="e.g., January Super Raffle"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Description (optional)</label>
                  <Textarea
                    placeholder="e.g., Complete assignments to earn entries!"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Prize</label>
                  <Input
                    placeholder="e.g., 🎮 $50 Gaming Gift Card"
                    value={prize}
                    onChange={(e) => setPrize(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">End Date</label>
                  <Input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="hero" 
                    onClick={handleCreateDraw}
                    disabled={isCreating}
                    className="flex-1"
                  >
                    {isCreating ? "Creating..." : "Create Raffle"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Winner Picker */}
        {selectedDraw && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Button 
              variant="ghost" 
              className="mb-4"
              onClick={() => setSelectedDraw(null)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Raffles
            </Button>
            <RaffleWinnerPicker
              draw={selectedDraw}
              participants={participants}
              onWinnerSelected={handleWinnerSelected}
            />
          </motion.div>
        )}

        {/* Active Raffles */}
        {!selectedDraw && (
          <>
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                Active Raffles
              </h2>
              
              {activeDraws.length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No active raffles</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setShowCreateForm(true)}
                    >
                      Create Your First Raffle
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {activeDraws.map((draw, idx) => (
                    <motion.div
                      key={draw.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card className="hover:border-primary transition-colors">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-bold text-foreground">{draw.title}</h3>
                              <p className="text-sm text-muted-foreground">{draw.prize_description}</p>
                            </div>
                            <div className="bg-success/10 text-success text-xs font-medium px-2 py-1 rounded-full">
                              Active
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                            <Calendar className="w-4 h-4" />
                            Ends: {format(new Date(draw.end_date), "MMM d, yyyy")}
                          </div>
                          
                          <Button 
                            variant="hero" 
                            size="sm" 
                            className="w-full"
                            onClick={() => setSelectedDraw(draw)}
                          >
                            <Trophy className="w-4 h-4 mr-2" />
                            Select Winner
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* Completed Raffles */}
            {completedDraws.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-gold" />
                  Past Raffles
                </h2>
                
                <div className="space-y-3">
                  {completedDraws.map((draw) => (
                    <Card key={draw.id} className="bg-muted/30">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-foreground">{draw.title}</h3>
                          <p className="text-sm text-muted-foreground">{draw.prize_description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-gold" />
                          <span className="text-sm text-muted-foreground">Winner Selected</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
