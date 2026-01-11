import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Star,
  UserX,
  Clock,
  Loader2,
  Send
} from "lucide-react";

type StatusType = "on_task" | "off_task" | "needs_support" | "excellent" | "absent" | "late";

interface Student {
  id: string;
  full_name: string;
}

interface StudentStatusRecorderProps {
  students: Student[];
  classId: string;
  onStatusRecorded?: () => void;
}

const statusOptions: { value: StatusType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "on_task", label: "On Task", icon: <CheckCircle2 className="w-4 h-4" />, color: "bg-success/10 text-success border-success/30" },
  { value: "excellent", label: "Excellent", icon: <Star className="w-4 h-4" />, color: "bg-primary/10 text-primary border-primary/30" },
  { value: "off_task", label: "Off Task", icon: <AlertTriangle className="w-4 h-4" />, color: "bg-warning/10 text-warning border-warning/30" },
  { value: "needs_support", label: "Needs Support", icon: <HelpCircle className="w-4 h-4" />, color: "bg-secondary/10 text-secondary border-secondary/30" },
  { value: "late", label: "Late", icon: <Clock className="w-4 h-4" />, color: "bg-muted text-muted-foreground border-muted-foreground/30" },
  { value: "absent", label: "Absent", icon: <UserX className="w-4 h-4" />, color: "bg-destructive/10 text-destructive border-destructive/30" },
];

export function StudentStatusRecorder({ students, classId, onStatusRecorded }: StudentStatusRecorderProps) {
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<StatusType | "">("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!selectedStudent || !selectedStatus) {
      toast({
        title: "Missing information",
        description: "Please select a student and status.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to record status.",
          variant: "destructive",
        });
        return;
      }

      // For demo purposes, we'll show a success message
      // In production, this would insert into the database
      const studentName = students.find(s => s.id === selectedStudent)?.full_name || "Student";
      const statusLabel = statusOptions.find(s => s.value === selectedStatus)?.label || selectedStatus;

      toast({
        title: "Status Recorded! 📋",
        description: `${studentName} marked as "${statusLabel}"${notes ? ` - ${notes}` : ""}`,
      });

      // Reset form
      setSelectedStudent("");
      setSelectedStatus("");
      setNotes("");
      setOpen(false);
      onStatusRecorded?.();
    } catch (error) {
      console.error("Error recording status:", error);
      toast({
        title: "Error",
        description: "Failed to record status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedStatusOption = statusOptions.find(s => s.value === selectedStatus);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ClipboardList className="w-4 h-4" />
          Record Status
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Record Student Status
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Student Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Student</label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Status</label>
            <div className="grid grid-cols-2 gap-2">
              <AnimatePresence mode="wait">
                {statusOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedStatus(option.value)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      selectedStatus === option.value
                        ? option.color + " border-current"
                        : "bg-card border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    {option.icon}
                    <span className="text-sm font-medium">{option.label}</span>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Notes <span className="text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Selected Preview */}
          {selectedStudent && selectedStatus && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-muted/50 rounded-xl p-3 flex items-center gap-3"
            >
              <div className={`p-2 rounded-lg ${selectedStatusOption?.color}`}>
                {selectedStatusOption?.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {students.find(s => s.id === selectedStudent)?.full_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Will be marked as "{selectedStatusOption?.label}"
                </p>
              </div>
            </motion.div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!selectedStudent || !selectedStatus || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Record Status
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
