import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft,
  CheckCircle2, 
  XCircle,
  Clock,
  User,
  BookOpen,
  Calendar,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Trophy
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import nycologicLogo from "@/assets/nycologic-ai-logo.png";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface PendingSubmission {
  id: string;
  student_id: string;
  assignment_id: string;
  submitted_at: string;
  mode: string;
  student_name: string;
  assignment_title: string;
  assignment_subject: string | null;
  xp_reward: number;
  coin_reward: number;
  due_at: string;
  assets: { id: string; file_url: string; file_type: string | null }[];
}

export default function TeacherVerify() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<PendingSubmission | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [score, setScore] = useState<number>(100);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingSubmissions();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('pending-submissions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attempts',
          filter: 'status=eq.submitted'
        },
        () => {
          fetchPendingSubmissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPendingSubmissions = async () => {
    try {
      setLoading(true);
      
      // Fetch attempts with status 'submitted' and mode 'paper' for teacher's classes
      const { data: attempts, error } = await supabase
        .from('attempts')
        .select(`
          id,
          student_id,
          assignment_id,
          submitted_at,
          mode,
          assignments!inner (
            id,
            title,
            subject,
            xp_reward,
            coin_reward,
            due_at,
            classes!inner (
              teacher_id
            )
          )
        `)
        .eq('status', 'submitted')
        .eq('mode', 'paper')
        .order('submitted_at', { ascending: true });

      if (error) throw error;

      // Get submission assets and student profiles for each attempt
      const submissionsWithDetails = await Promise.all(
        (attempts || []).map(async (attempt) => {
          // Get student profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', attempt.student_id)
            .single();

          // Get submission assets
          const { data: assets } = await supabase
            .from('submission_assets')
            .select('id, file_url, file_type')
            .eq('attempt_id', attempt.id);

          const assignment = attempt.assignments as any;

          return {
            id: attempt.id,
            student_id: attempt.student_id,
            assignment_id: attempt.assignment_id,
            submitted_at: attempt.submitted_at || '',
            mode: attempt.mode,
            student_name: profile?.full_name || 'Unknown Student',
            assignment_title: assignment.title,
            assignment_subject: assignment.subject,
            xp_reward: assignment.xp_reward,
            coin_reward: assignment.coin_reward,
            due_at: assignment.due_at,
            assets: assets || [],
          };
        })
      );

      setSubmissions(submissionsWithDetails);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error",
        description: "Failed to load pending submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedSubmission) return;
    
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update attempt status to verified
      const { error } = await supabase
        .from('attempts')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: user?.id,
          score: score,
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      // Award XP and coins
      const { error: rewardError } = await supabase
        .from('reward_ledger')
        .insert({
          student_id: selectedSubmission.student_id,
          xp_delta: Math.round(selectedSubmission.xp_reward * (score / 100)),
          coin_delta: Math.round(selectedSubmission.coin_reward * (score / 100)),
          reason: `Assignment completed: ${selectedSubmission.assignment_title}`,
          assignment_id: selectedSubmission.assignment_id,
        });

      if (rewardError) console.error('Reward error:', rewardError);

      toast({
        title: "Submission Approved! ✅",
        description: `${selectedSubmission.student_name} earned ${Math.round(selectedSubmission.xp_reward * (score / 100))} XP and ${Math.round(selectedSubmission.coin_reward * (score / 100))} coins!`,
      });

      // Remove from list and close modal
      setSubmissions(prev => prev.filter(s => s.id !== selectedSubmission.id));
      setSelectedSubmission(null);
      setScore(100);
    } catch (error) {
      console.error('Error approving submission:', error);
      toast({
        title: "Error",
        description: "Failed to approve submission",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission || !rejectionReason.trim()) return;
    
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('attempts')
        .update({
          status: 'rejected',
          verified_at: new Date().toISOString(),
          verified_by: user?.id,
          rejection_reason: rejectionReason,
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      toast({
        title: "Submission Rejected",
        description: "The student will be notified to resubmit.",
      });

      setSubmissions(prev => prev.filter(s => s.id !== selectedSubmission.id));
      setSelectedSubmission(null);
      setShowRejectDialog(false);
      setRejectionReason("");
    } catch (error) {
      console.error('Error rejecting submission:', error);
      toast({
        title: "Error",
        description: "Failed to reject submission",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const isOnTime = (submission: PendingSubmission) => {
    return new Date(submission.submitted_at) <= new Date(submission.due_at);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/teacher">
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <img 
                src={nycologicLogo} 
                alt="NYCologic Ai" 
                className="w-8 h-8 object-contain"
              />
              <div>
                <h1 className="font-bold text-foreground text-xl">Verification Queue</h1>
                <p className="text-sm text-muted-foreground">Review paper submissions</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : submissions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">All Caught Up!</h2>
            <p className="text-muted-foreground mb-6">No paper submissions need review right now.</p>
            <Link to="/teacher">
              <Button>Back to Dashboard</Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-warning/10 border border-warning/30 rounded-2xl p-4 flex items-center gap-3"
            >
              <Clock className="w-6 h-6 text-warning" />
              <p className="font-medium text-foreground">
                {submissions.length} submission{submissions.length !== 1 ? 's' : ''} waiting for review
              </p>
            </motion.div>

            {/* Submission Cards */}
            <div className="grid gap-4">
              <AnimatePresence mode="popLayout">
                {submissions.map((submission, index) => (
                  <motion.div
                    key={submission.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div
                      className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setCurrentImageIndex(0);
                      }}
                    >
                      <div className="flex items-start gap-4">
                        {/* Preview Image */}
                        <div className="w-20 h-20 bg-muted rounded-xl overflow-hidden flex-shrink-0">
                          {submission.assets.length > 0 ? (
                            <img
                              src={submission.assets[0].file_url}
                              alt="Submission preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h3 className="font-bold text-foreground truncate">{submission.assignment_title}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="w-4 h-4" />
                                <span>{submission.student_name}</span>
                              </div>
                            </div>
                            {isOnTime(submission) ? (
                              <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full font-medium">
                                On Time
                              </span>
                            ) : (
                              <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full font-medium">
                                Late
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(submission.submitted_at)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Trophy className="w-3 h-3" />
                              {submission.xp_reward} XP
                            </div>
                            <div className="flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              {submission.assets.length} image{submission.assets.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      {/* Review Modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSubmission && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  {selectedSubmission.assignment_title}
                </DialogTitle>
                <DialogDescription>
                  Submitted by {selectedSubmission.student_name} • {formatDate(selectedSubmission.submitted_at)}
                </DialogDescription>
              </DialogHeader>

              {/* Image Viewer */}
              {selectedSubmission.assets.length > 0 ? (
                <div className="relative bg-muted rounded-xl overflow-hidden">
                  <img
                    src={selectedSubmission.assets[currentImageIndex].file_url}
                    alt={`Submission page ${currentImageIndex + 1}`}
                    className="w-full max-h-[400px] object-contain"
                  />
                  
                  {selectedSubmission.assets.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                        onClick={() => setCurrentImageIndex(prev => 
                          prev === 0 ? selectedSubmission.assets.length - 1 : prev - 1
                        )}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                        onClick={() => setCurrentImageIndex(prev => 
                          prev === selectedSubmission.assets.length - 1 ? 0 : prev + 1
                        )}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {selectedSubmission.assets.length}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-muted rounded-xl p-10 text-center">
                  <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No images attached</p>
                </div>
              )}

              {/* Score Input */}
              <div className="space-y-2">
                <Label htmlFor="score">Score (%)</Label>
                <Input
                  id="score"
                  type="number"
                  min={0}
                  max={100}
                  value={score}
                  onChange={(e) => setScore(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-24"
                />
                <p className="text-xs text-muted-foreground">
                  Rewards: {Math.round(selectedSubmission.xp_reward * (score / 100))} XP, {Math.round(selectedSubmission.coin_reward * (score / 100))} coins
                </p>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={processing}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={processing}
                  className="bg-success hover:bg-success/90"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Approve
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. The student will see this message.
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            placeholder="e.g., Work is incomplete, please finish questions 5-10..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || processing}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
