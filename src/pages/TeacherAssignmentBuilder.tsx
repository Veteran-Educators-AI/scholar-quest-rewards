import { useState, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Loader2,
  CheckCircle,
  ListOrdered,
  AlignLeft,
  Link2,
  PenLine,
  Coins,
  Sparkles,
  BookOpen,
  LayoutDashboard,
  Users,
  CheckCircle2,
  Ticket,
  Key,
  Link as LinkIcon,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import nycologicLogo from "@/assets/nycologic-ai-logo.png";
import { PoweredByFooter } from "@/components/PoweredByFooter";
import type { Database } from "@/integrations/supabase/types";

// Use the database enum type for question_type
type DbQuestionType = Database["public"]["Enums"]["question_type"];

// Our internal type includes fill_blank which maps to short_answer in DB
type QuestionType = "multiple_choice" | "short_answer" | "drag_order" | "matching" | "fill_blank";

// Map our UI types to database types
const mapToDbType = (type: QuestionType): DbQuestionType => {
  if (type === "fill_blank") return "short_answer"; // Store as short_answer with special answer_key
  return type as DbQuestionType;
};

interface QuestionData {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correctAnswer?: string;
  correctOrder?: string[];
  pairs?: { left: string; right: string }[];
  blankAnswer?: string;
  hint?: string;
  difficulty: number;
}

interface ClassOption {
  id: string;
  name: string;
  class_code: string;
}

const QUESTION_TYPES: { value: QuestionType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: "multiple_choice", label: "Multiple Choice", icon: <CheckCircle className="w-4 h-4" />, description: "Select one correct answer from options" },
  { value: "short_answer", label: "Short Answer", icon: <AlignLeft className="w-4 h-4" />, description: "Free text response graded by AI" },
  { value: "drag_order", label: "Drag & Order", icon: <ListOrdered className="w-4 h-4" />, description: "Arrange items in correct sequence" },
  { value: "matching", label: "Matching Pairs", icon: <Link2 className="w-4 h-4" />, description: "Connect related items together" },
  { value: "fill_blank", label: "Fill in Blank", icon: <PenLine className="w-4 h-4" />, description: "Complete the sentence" },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export default function TeacherAssignmentBuilder() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  
  // Assignment details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [coinReward, setCoinReward] = useState(10);
  const [xpReward, setXpReward] = useState(50);
  
  // Questions
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [addQuestionOpen, setAddQuestionOpen] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: classesData } = await supabase
        .from("classes")
        .select("id, name, class_code")
        .eq("teacher_id", user.id);

      if (classesData) {
        setClasses(classesData);
        if (classesData.length > 0) {
          setSelectedClass(classesData[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = (type: QuestionType) => {
    const newQuestion: QuestionData = {
      id: generateId(),
      type,
      prompt: "",
      difficulty: 1,
    };

    if (type === "multiple_choice") {
      newQuestion.options = ["", "", "", ""];
      newQuestion.correctAnswer = "";
    } else if (type === "drag_order") {
      newQuestion.correctOrder = ["", "", ""];
    } else if (type === "matching") {
      newQuestion.pairs = [
        { left: "", right: "" },
        { left: "", right: "" },
        { left: "", right: "" },
      ];
    } else if (type === "fill_blank") {
      newQuestion.blankAnswer = "";
    }

    setQuestions([...questions, newQuestion]);
    setAddQuestionOpen(false);
  };

  const updateQuestion = (id: string, updates: Partial<QuestionData>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSaveAssignment = async () => {
    if (!title.trim()) {
      toast({ title: "Title required", description: "Please enter an assignment title.", variant: "destructive" });
      return;
    }
    if (!selectedClass) {
      toast({ title: "Class required", description: "Please select a class.", variant: "destructive" });
      return;
    }
    if (!dueDate) {
      toast({ title: "Due date required", description: "Please set a due date.", variant: "destructive" });
      return;
    }
    if (questions.length === 0) {
      toast({ title: "Questions required", description: "Please add at least one question.", variant: "destructive" });
      return;
    }

    // Validate questions
    for (const q of questions) {
      if (!q.prompt.trim()) {
        toast({ title: "Invalid question", description: "All questions must have a prompt.", variant: "destructive" });
        return;
      }
    }

    setSaving(true);
    try {
      // Create assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from("assignments")
        .insert({
          title,
          description: description || null,
          class_id: selectedClass,
          due_at: new Date(dueDate).toISOString(),
          coin_reward: coinReward,
          xp_reward: xpReward,
          status: "active",
        })
        .select()
        .single();

      if (assignmentError) throw assignmentError;

      // Create questions
      const questionsToInsert = questions.map((q, index) => {
        let answerKey: any = {};
        let options: any = null;

        if (q.type === "multiple_choice") {
          options = q.options;
          answerKey = { correct: q.correctAnswer };
        } else if (q.type === "short_answer") {
          answerKey = { keywords: [] }; // AI will grade
        } else if (q.type === "drag_order") {
          answerKey = { correct_order: q.correctOrder };
        } else if (q.type === "matching") {
          answerKey = { pairs: q.pairs };
        } else if (q.type === "fill_blank") {
          answerKey = { answer: q.blankAnswer, is_fill_blank: true };
        }

        return {
          assignment_id: assignment.id,
          prompt: q.prompt,
          question_type: mapToDbType(q.type),
          options,
          answer_key: answerKey,
          difficulty: q.difficulty,
          hint: q.hint || null,
          order_index: index,
        };
      });

      const { error: questionsError } = await supabase
        .from("questions")
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      toast({
        title: "Assignment Created! 🎉",
        description: `${title} has been assigned to your class.`,
      });

      navigate("/teacher");
    } catch (error: any) {
      console.error("Error saving assignment:", error);
      toast({
        title: "Error saving assignment",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2">
                <img src={nycologicLogo} alt="NYClogic Ai" className="w-8 h-8 object-contain" />
                <div className="hidden sm:block">
                  <p className="text-xs text-muted-foreground leading-none">Powered by</p>
                  <p className="text-sm font-semibold text-foreground leading-tight">NYClogic Ai™</p>
                </div>
              </div>
              <div className="hidden md:block">
                <h1 className="font-bold text-foreground text-xl">NYClogic Scholar Ai</h1>
                <p className="text-sm text-muted-foreground">Assignment Builder</p>
              </div>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={handleLogout}>
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="border-t border-border bg-muted/30">
          <div className="container mx-auto px-4">
            <nav className="flex items-center gap-1 overflow-x-auto py-2">
              <Link to="/teacher">
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="w-4 h-4 mr-1.5" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/teacher/students">
                <Button variant="ghost" size="sm">
                  <Users className="w-4 h-4 mr-1.5" />
                  Students
                </Button>
              </Link>
              <Link to="/teacher/verify">
                <Button variant="ghost" size="sm">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Verify
                </Button>
              </Link>
              <Link to="/teacher/raffle">
                <Button variant="ghost" size="sm">
                  <Ticket className="w-4 h-4 mr-1.5" />
                  Raffle
                </Button>
              </Link>
              <Link to="/teacher/integrations">
                <Button variant="ghost" size="sm">
                  <LinkIcon className="w-4 h-4 mr-1.5" />
                  Integrations
                </Button>
              </Link>
              <Link to="/teacher/api">
                <Button variant="ghost" size="sm">
                  <Key className="w-4 h-4 mr-1.5" />
                  API Settings
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Link to="/teacher">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-2xl font-extrabold text-foreground mb-1">
            Create New Assignment
          </h2>
          <p className="text-muted-foreground">
            Build a custom quiz with multiple question types and set rewards.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Assignment Details */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Assignment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Math Quiz - Fractions"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the assignment..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Assign to Class *</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="coins" className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-amber-500" />
                      Coins
                    </Label>
                    <Input
                      id="coins"
                      type="number"
                      min={0}
                      value={coinReward}
                      onChange={(e) => setCoinReward(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="xp" className="flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      XP
                    </Label>
                    <Input
                      id="xp"
                      type="number"
                      min={0}
                      value={xpReward}
                      onChange={(e) => setXpReward(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <p className="text-4xl font-bold text-primary">{questions.length}</p>
                  <p className="text-sm text-muted-foreground">
                    {questions.length === 1 ? "Question" : "Questions"} Added
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-1 justify-center">
                  {QUESTION_TYPES.map(type => {
                    const count = questions.filter(q => q.type === type.value).length;
                    if (count === 0) return null;
                    return (
                      <Badge key={type.value} variant="secondary" className="text-xs">
                        {count} {type.label}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Questions Builder */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Questions</h3>
              <Dialog open={addQuestionOpen} onOpenChange={setAddQuestionOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Question</DialogTitle>
                    <DialogDescription>
                      Choose a question type to add to your assignment.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3 mt-4">
                    {QUESTION_TYPES.map((type) => (
                      <Button
                        key={type.value}
                        variant="outline"
                        className="justify-start h-auto py-3 px-4"
                        onClick={() => addQuestion(type.value)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            {type.icon}
                          </div>
                          <div className="text-left">
                            <p className="font-medium">{type.label}</p>
                            <p className="text-xs text-muted-foreground">{type.description}</p>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {questions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No questions yet. Add your first question to get started!</p>
                  <Button variant="outline" onClick={() => setAddQuestionOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Reorder.Group axis="y" values={questions} onReorder={setQuestions} className="space-y-4">
                <AnimatePresence>
                  {questions.map((question, index) => (
                    <Reorder.Item key={question.id} value={question}>
                      <QuestionEditor
                        question={question}
                        index={index}
                        onUpdate={(updates) => updateQuestion(question.id, updates)}
                        onRemove={() => removeQuestion(question.id)}
                      />
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            )}
          </motion.div>
        </div>
      </main>

      {/* Fixed Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border py-4">
        <div className="container mx-auto px-4 flex justify-end gap-3">
          <Link to="/teacher">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSaveAssignment} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Assignment
          </Button>
        </div>
      </div>

      <PoweredByFooter />
    </div>
  );
}

// Question Editor Component
interface QuestionEditorProps {
  question: QuestionData;
  index: number;
  onUpdate: (updates: Partial<QuestionData>) => void;
  onRemove: () => void;
}

function QuestionEditor({ question, index, onUpdate, onRemove }: QuestionEditorProps) {
  const typeInfo = QUESTION_TYPES.find(t => t.value === question.type);

  return (
    <Card className="relative group">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <div className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground">
            <GripVertical className="w-5 h-5" />
          </div>

          <div className="flex-1 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  {typeInfo?.icon}
                  {typeInfo?.label}
                </Badge>
                <span className="text-sm text-muted-foreground">Question {index + 1}</span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                onClick={onRemove}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Prompt */}
            <div className="space-y-2">
              <Label>Question Prompt *</Label>
              <Textarea
                placeholder="Enter your question..."
                value={question.prompt}
                onChange={(e) => onUpdate({ prompt: e.target.value })}
                rows={2}
              />
            </div>

            {/* Type-specific fields */}
            {question.type === "multiple_choice" && (
              <MultipleChoiceEditor question={question} onUpdate={onUpdate} />
            )}
            {question.type === "short_answer" && (
              <ShortAnswerEditor question={question} onUpdate={onUpdate} />
            )}
            {question.type === "drag_order" && (
              <DragOrderEditor question={question} onUpdate={onUpdate} />
            )}
            {question.type === "matching" && (
              <MatchingEditor question={question} onUpdate={onUpdate} />
            )}
            {question.type === "fill_blank" && (
              <FillBlankEditor question={question} onUpdate={onUpdate} />
            )}

            {/* Optional Hint */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Hint (Optional)</Label>
              <Input
                placeholder="Provide a hint for students..."
                value={question.hint || ""}
                onChange={(e) => onUpdate({ hint: e.target.value })}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Multiple Choice Editor
function MultipleChoiceEditor({ question, onUpdate }: { question: QuestionData; onUpdate: (u: Partial<QuestionData>) => void }) {
  const updateOption = (index: number, value: string) => {
    const newOptions = [...(question.options || [])];
    newOptions[index] = value;
    onUpdate({ options: newOptions });
  };

  const addOption = () => {
    onUpdate({ options: [...(question.options || []), ""] });
  };

  const removeOption = (index: number) => {
    const newOptions = (question.options || []).filter((_, i) => i !== index);
    onUpdate({ options: newOptions });
  };

  return (
    <div className="space-y-3">
      <Label>Answer Options *</Label>
      {(question.options || []).map((option, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="radio"
            name={`correct-${question.id}`}
            checked={question.correctAnswer === option && option !== ""}
            onChange={() => onUpdate({ correctAnswer: option })}
            className="w-4 h-4 text-primary"
          />
          <Input
            placeholder={`Option ${index + 1}`}
            value={option}
            onChange={(e) => updateOption(index, e.target.value)}
            className="flex-1"
          />
          {(question.options || []).length > 2 && (
            <Button variant="ghost" size="icon-sm" onClick={() => removeOption(index)}>
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addOption}>
        <Plus className="w-4 h-4 mr-1" />
        Add Option
      </Button>
      <p className="text-xs text-muted-foreground">Select the radio button next to the correct answer.</p>
    </div>
  );
}

// Short Answer Editor
function ShortAnswerEditor({ question, onUpdate }: { question: QuestionData; onUpdate: (u: Partial<QuestionData>) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
        💡 Short answer questions are graded by AI. Students can write free-form responses that will be evaluated for correctness.
      </p>
    </div>
  );
}

// Drag Order Editor
function DragOrderEditor({ question, onUpdate }: { question: QuestionData; onUpdate: (u: Partial<QuestionData>) => void }) {
  const updateItem = (index: number, value: string) => {
    const newOrder = [...(question.correctOrder || [])];
    newOrder[index] = value;
    onUpdate({ correctOrder: newOrder });
  };

  const addItem = () => {
    onUpdate({ correctOrder: [...(question.correctOrder || []), ""] });
  };

  const removeItem = (index: number) => {
    const newOrder = (question.correctOrder || []).filter((_, i) => i !== index);
    onUpdate({ correctOrder: newOrder });
  };

  return (
    <div className="space-y-3">
      <Label>Items in Correct Order *</Label>
      <p className="text-xs text-muted-foreground">Enter items in the correct sequence. Students will see them shuffled.</p>
      {(question.correctOrder || []).map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
            {index + 1}
          </span>
          <Input
            placeholder={`Item ${index + 1}`}
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            className="flex-1"
          />
          {(question.correctOrder || []).length > 2 && (
            <Button variant="ghost" size="icon-sm" onClick={() => removeItem(index)}>
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}>
        <Plus className="w-4 h-4 mr-1" />
        Add Item
      </Button>
    </div>
  );
}

// Matching Editor
function MatchingEditor({ question, onUpdate }: { question: QuestionData; onUpdate: (u: Partial<QuestionData>) => void }) {
  const updatePair = (index: number, side: "left" | "right", value: string) => {
    const newPairs = [...(question.pairs || [])];
    newPairs[index] = { ...newPairs[index], [side]: value };
    onUpdate({ pairs: newPairs });
  };

  const addPair = () => {
    onUpdate({ pairs: [...(question.pairs || []), { left: "", right: "" }] });
  };

  const removePair = (index: number) => {
    const newPairs = (question.pairs || []).filter((_, i) => i !== index);
    onUpdate({ pairs: newPairs });
  };

  return (
    <div className="space-y-3">
      <Label>Matching Pairs *</Label>
      <p className="text-xs text-muted-foreground">Create pairs that students will need to match together.</p>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground font-medium">
          <span>Left Side</span>
          <span>Right Side (Correct Match)</span>
        </div>
        {(question.pairs || []).map((pair, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              placeholder={`Left ${index + 1}`}
              value={pair.left}
              onChange={(e) => updatePair(index, "left", e.target.value)}
              className="flex-1"
            />
            <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              placeholder={`Right ${index + 1}`}
              value={pair.right}
              onChange={(e) => updatePair(index, "right", e.target.value)}
              className="flex-1"
            />
            {(question.pairs || []).length > 2 && (
              <Button variant="ghost" size="icon-sm" onClick={() => removePair(index)}>
                <Trash2 className="w-4 h-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addPair}>
        <Plus className="w-4 h-4 mr-1" />
        Add Pair
      </Button>
    </div>
  );
}

// Fill Blank Editor
function FillBlankEditor({ question, onUpdate }: { question: QuestionData; onUpdate: (u: Partial<QuestionData>) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Use <code className="bg-muted px-1 rounded">___</code> in your prompt to indicate where the blank is. Example: "The capital of France is ___."
      </p>
      <div className="space-y-2">
        <Label>Correct Answer *</Label>
        <Input
          placeholder="Enter the correct answer for the blank"
          value={question.blankAnswer || ""}
          onChange={(e) => onUpdate({ blankAnswer: e.target.value })}
        />
      </div>
    </div>
  );
}
