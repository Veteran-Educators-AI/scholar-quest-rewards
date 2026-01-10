import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Gift, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Coins, 
  Trophy,
  Target,
  Loader2,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  student_id: string;
  student_name: string;
  coins: number;
}

interface PointPledge {
  id: string;
  student_id: string;
  coin_threshold: number;
  reward_description: string;
  reward_type: string;
  is_active: boolean;
  claimed: boolean;
  claimed_at: string | null;
  created_at: string;
  student_name?: string;
  current_coins?: number;
}

interface PointPledgeManagerProps {
  students: Student[];
  onPledgeChange?: () => void;
}

const REWARD_SUGGESTIONS = [
  { type: "treat", icon: "🍦", label: "Ice cream trip" },
  { type: "toy", icon: "🎮", label: "New game/toy" },
  { type: "activity", icon: "🎢", label: "Fun activity (park, movie, etc.)" },
  { type: "money", icon: "💵", label: "Allowance bonus" },
  { type: "screen", icon: "📺", label: "Extra screen time" },
  { type: "sleepover", icon: "🏠", label: "Sleepover with friend" },
  { type: "custom", icon: "✨", label: "Custom reward" },
];

const THRESHOLD_PRESETS = [50, 100, 250, 500, 1000];

export function PointPledgeManager({ students, onPledgeChange }: PointPledgeManagerProps) {
  const { toast } = useToast();
  const [pledges, setPledges] = useState<PointPledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [threshold, setThreshold] = useState<number>(100);
  const [customThreshold, setCustomThreshold] = useState<string>("");
  const [rewardType, setRewardType] = useState<string>("");
  const [customReward, setCustomReward] = useState<string>("");

  useEffect(() => {
    fetchPledges();
  }, []);

  const fetchPledges = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('parent_point_pledges')
        .select('*')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with student names and current coins
      const enrichedPledges = await Promise.all(
        (data || []).map(async (pledge) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', pledge.student_id)
            .single();
          
          const { data: studentProfile } = await supabase
            .from('student_profiles')
            .select('coins')
            .eq('user_id', pledge.student_id)
            .single();

          return {
            ...pledge,
            student_name: profile?.full_name || 'Unknown',
            current_coins: studentProfile?.coins || 0,
          };
        })
      );

      setPledges(enrichedPledges);
    } catch (error) {
      console.error('Error fetching pledges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePledge = async () => {
    const finalThreshold = customThreshold ? parseInt(customThreshold) : threshold;
    const rewardDesc = rewardType === 'custom' 
      ? customReward 
      : REWARD_SUGGESTIONS.find(r => r.type === rewardType)?.label || customReward;

    if (!selectedStudent || !finalThreshold || !rewardDesc) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('parent_point_pledges').insert({
        parent_id: user.id,
        student_id: selectedStudent,
        coin_threshold: finalThreshold,
        reward_description: rewardDesc,
        reward_type: rewardType || 'custom',
      });

      if (error) throw error;

      toast({
        title: "Reward Pledge Created! 🎁",
        description: `Your child will be notified when they reach ${finalThreshold} coins!`,
      });

      setShowCreateDialog(false);
      resetForm();
      fetchPledges();
      onPledgeChange?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create pledge",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleClaimPledge = async (pledgeId: string) => {
    try {
      const { error } = await supabase
        .from('parent_point_pledges')
        .update({ claimed: true, claimed_at: new Date().toISOString() })
        .eq('id', pledgeId);

      if (error) throw error;

      toast({
        title: "Reward Marked as Given! ✅",
        description: "Great job following through on your pledge!",
      });
      fetchPledges();
      onPledgeChange?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update pledge",
        variant: "destructive",
      });
    }
  };

  const handleDeletePledge = async (pledgeId: string) => {
    try {
      const { error } = await supabase
        .from('parent_point_pledges')
        .delete()
        .eq('id', pledgeId);

      if (error) throw error;

      toast({
        title: "Pledge Removed",
        description: "The reward pledge has been deleted",
      });
      fetchPledges();
      onPledgeChange?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete pledge",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedStudent("");
    setThreshold(100);
    setCustomThreshold("");
    setRewardType("");
    setCustomReward("");
  };

  const getProgressPercent = (current: number, target: number) => {
    return Math.min(100, Math.round((current / target) * 100));
  };

  const selectedStudentData = students.find(s => s.student_id === selectedStudent);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Point Reward Pledges
        </h2>
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add Pledge
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Set coin milestones and promise rewards when your child reaches them. 
        <span className="text-warning font-medium"> Teachers can deduct points for behavior</span>, 
        so kids must stay on track to earn their rewards!
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : pledges.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {pledges.map((pledge) => {
              const progress = getProgressPercent(pledge.current_coins || 0, pledge.coin_threshold);
              const isReached = (pledge.current_coins || 0) >= pledge.coin_threshold;
              
              return (
                <motion.div
                  key={pledge.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-card rounded-2xl p-5 border shadow-sm ${
                    pledge.claimed 
                      ? 'border-success/30 bg-success/5' 
                      : isReached
                      ? 'border-primary/50 bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {REWARD_SUGGESTIONS.find(r => r.type === pledge.reward_type)?.icon || '🎁'}
                        </span>
                        <span className="font-bold text-foreground">
                          {pledge.reward_description}
                        </span>
                        {pledge.claimed && (
                          <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                            Given ✓
                          </span>
                        )}
                        {isReached && !pledge.claimed && (
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            Ready!
                          </motion.span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        For: <span className="font-medium">{pledge.student_name}</span>
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {isReached && !pledge.claimed && (
                        <Button
                          size="sm"
                          variant="default"
                          className="text-xs"
                          onClick={() => handleClaimPledge(pledge.id)}
                        >
                          <Gift className="w-3 h-3 mr-1" />
                          Mark Given
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeletePledge(pledge.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Coins className="w-4 h-4 text-gold" />
                        <span>{pledge.current_coins || 0} / {pledge.coin_threshold}</span>
                      </div>
                      <span className={`font-bold ${isReached ? 'text-success' : 'text-primary'}`}>
                        {progress}%
                      </span>
                    </div>
                    <Progress 
                      value={progress} 
                      className={`h-3 ${isReached ? '[&>div]:bg-success' : ''}`}
                    />
                    {!isReached && (
                      <p className="text-xs text-muted-foreground text-center">
                        {pledge.coin_threshold - (pledge.current_coins || 0)} more coins needed
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-medium text-foreground mb-1">No Point Pledges Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Set coin milestones to motivate your child with real rewards!
          </p>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Create Your First Pledge
          </Button>
        </div>
      )}

      {/* Create Pledge Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Create Point Pledge
            </DialogTitle>
            <DialogDescription>
              Promise a reward when your child reaches a coin milestone. 
              Points can be earned through assignments but deducted for behavior!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Select Child */}
            <div className="space-y-2">
              <Label>Select Child</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a child" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.student_id} value={student.student_id}>
                      {student.student_name} ({student.coins} coins)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Coin Threshold */}
            <div className="space-y-2">
              <Label>Coin Goal</Label>
              <div className="flex gap-2 flex-wrap">
                {THRESHOLD_PRESETS.map((preset) => (
                  <motion.button
                    key={preset}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setThreshold(preset);
                      setCustomThreshold("");
                    }}
                    className={`py-2 px-4 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                      threshold === preset && !customThreshold
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Coins className="w-4 h-4" />
                    {preset}
                  </motion.button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Or custom:</span>
                <Input
                  type="number"
                  min={10}
                  max={10000}
                  placeholder="e.g., 750"
                  value={customThreshold}
                  onChange={(e) => setCustomThreshold(e.target.value)}
                  className="w-32"
                />
              </div>
              {selectedStudentData && (
                <p className="text-xs text-muted-foreground">
                  {selectedStudentData.student_name} currently has {selectedStudentData.coins} coins
                </p>
              )}
            </div>

            {/* Reward Type */}
            <div className="space-y-2">
              <Label>Reward</Label>
              <div className="grid grid-cols-2 gap-2">
                {REWARD_SUGGESTIONS.slice(0, -1).map((reward) => (
                  <motion.button
                    key={reward.type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setRewardType(reward.type)}
                    className={`p-3 rounded-xl text-left transition-all flex items-center gap-2 ${
                      rewardType === reward.type
                        ? "bg-primary/10 border-2 border-primary"
                        : "bg-muted border-2 border-transparent hover:bg-muted/80"
                    }`}
                  >
                    <span className="text-xl">{reward.icon}</span>
                    <span className="text-sm font-medium">{reward.label}</span>
                  </motion.button>
                ))}
              </div>
              
              <div className="pt-2">
                <Label className="text-xs text-muted-foreground">Or describe a custom reward:</Label>
                <Input
                  placeholder="e.g., Trip to the zoo, New book, Pizza party..."
                  value={customReward}
                  onChange={(e) => {
                    setCustomReward(e.target.value);
                    if (e.target.value) setRewardType('custom');
                  }}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Preview */}
            {selectedStudentData && (threshold || customThreshold) && (rewardType || customReward) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary/10 border border-primary/30 rounded-xl p-4"
              >
                <p className="text-sm font-medium text-foreground">
                  When <span className="text-primary font-bold">{selectedStudentData.student_name}</span> reaches{" "}
                  <span className="font-bold">{customThreshold || threshold} coins</span>, you'll give them:
                </p>
                <p className="text-lg font-bold text-primary mt-1">
                  {REWARD_SUGGESTIONS.find(r => r.type === rewardType)?.icon || '🎁'}{" "}
                  {rewardType === 'custom' || customReward 
                    ? customReward 
                    : REWARD_SUGGESTIONS.find(r => r.type === rewardType)?.label}
                </p>
              </motion.div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePledge} 
              disabled={creating || !selectedStudent || (!threshold && !customThreshold) || (!rewardType && !customReward)}
            >
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Gift className="w-4 h-4 mr-2" />}
              Create Pledge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.section>
  );
}