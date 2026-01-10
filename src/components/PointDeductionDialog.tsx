import { useState } from "react";
import { motion } from "framer-motion";
import { MinusCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  full_name: string;
  coins: number;
}

interface PointDeductionDialogProps {
  students: Student[];
  classId: string;
  onDeductionComplete?: () => void;
}

const COMMON_REASONS = [
  "Disruptive behavior in class",
  "Not following instructions",
  "Talking out of turn",
  "Not completing classwork",
  "Late to class",
  "Inappropriate language",
  "Not paying attention",
  "Other (custom reason)",
];

export function PointDeductionDialog({
  students,
  classId,
  onDeductionComplete,
}: PointDeductionDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [points, setPoints] = useState<number>(5);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleDeduct = async () => {
    const reason = selectedReason === "Other (custom reason)" ? customReason : selectedReason;
    
    if (!selectedStudent || !points || !reason) {
      toast({
        title: "Missing Information",
        description: "Please select a student, points, and reason.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.rpc("deduct_student_points", {
        p_student_id: selectedStudent,
        p_class_id: classId,
        p_points: points,
        p_reason: reason,
      });

      if (error) throw error;

      // Notify parents via edge function
      try {
        const student = students.find((s) => s.id === selectedStudent);
        await supabase.functions.invoke("send-parent-notification", {
          body: {
            type: "points_deducted",
            student_id: selectedStudent,
            data: {
              points_deducted: points,
              reason: reason,
              student_name: student?.full_name,
            },
          },
        });
      } catch (notifyError) {
        console.log("Parent notification failed:", notifyError);
      }

      toast({
        title: "Points Deducted",
        description: `${points} points deducted. The student and parents have been notified.`,
      });

      setOpen(false);
      setSelectedStudent("");
      setPoints(5);
      setSelectedReason("");
      setCustomReason("");
      onDeductionComplete?.();
    } catch (error) {
      console.error("Error deducting points:", error);
      toast({
        title: "Error",
        description: "Failed to deduct points. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedStudentData = students.find((s) => s.id === selectedStudent);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10">
          <MinusCircle className="w-4 h-4" />
          Deduct Points
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Deduct Behavior Points
          </DialogTitle>
          <DialogDescription>
            Deduct points from a student for behavior issues. Parents will be notified automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Student Selection */}
          <div className="space-y-2">
            <Label htmlFor="student">Select Student</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a student..." />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.full_name} ({student.coins} coins)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Points to Deduct */}
          <div className="space-y-2">
            <Label htmlFor="points">Points to Deduct</Label>
            <div className="flex gap-2">
              {[1, 5, 10, 25].map((p) => (
                <motion.button
                  key={p}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPoints(p)}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold transition-colors ${
                    points === p
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  -{p}
                </motion.button>
              ))}
            </div>
            <Input
              type="number"
              min={1}
              max={100}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              placeholder="Or enter custom amount"
            />
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {COMMON_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Reason */}
          {selectedReason === "Other (custom reason)" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-2"
            >
              <Label htmlFor="customReason">Custom Reason</Label>
              <Textarea
                id="customReason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Describe the behavior issue..."
                rows={3}
              />
            </motion.div>
          )}

          {/* Preview */}
          {selectedStudentData && points > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-destructive/10 border border-destructive/30 rounded-lg p-4"
            >
              <p className="text-sm font-medium text-foreground">
                <span className="text-destructive">{selectedStudentData.full_name}</span> will lose{" "}
                <span className="font-bold text-destructive">{points} points</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                New balance: {Math.max(0, selectedStudentData.coins - points)} coins
              </p>
            </motion.div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeduct}
            disabled={isSubmitting || !selectedStudent || !points || !selectedReason}
          >
            {isSubmitting ? "Deducting..." : "Deduct Points"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}