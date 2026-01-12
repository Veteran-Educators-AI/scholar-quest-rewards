import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  GraduationCap, 
  BookOpen, 
  Calculator, 
  Palette, 
  Music, 
  Globe,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Rocket,
  Users,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface OnboardingData {
  classCode: string;
  gradeLevel: number | null;
  mathLevel: string;
  readingLevel: string;
  strengths: string[];
  accommodations: string[];
}

interface ClassJoinResult {
  success: boolean;
  className?: string;
  error?: string;
}

const GRADE_OPTIONS = [
  { value: 6, label: "6th Grade" },
  { value: 7, label: "7th Grade" },
  { value: 8, label: "8th Grade" },
  { value: 9, label: "9th Grade" },
  { value: 10, label: "10th Grade" },
  { value: 11, label: "11th Grade" },
  { value: 12, label: "12th Grade" },
];

const SKILL_LEVELS = [
  { value: "below", label: "Below Grade Level", description: "I need extra help" },
  { value: "on", label: "On Grade Level", description: "I'm right where I should be" },
  { value: "above", label: "Above Grade Level", description: "I'm ready for challenges" },
];

const STRENGTHS = [
  { id: "math", label: "Math & Numbers", icon: Calculator },
  { id: "reading", label: "Reading & Writing", icon: BookOpen },
  { id: "science", label: "Science & Discovery", icon: Globe },
  { id: "art", label: "Art & Creativity", icon: Palette },
  { id: "music", label: "Music & Rhythm", icon: Music },
];

const ACCOMMODATIONS = [
  { id: "extended_time", label: "Extended time on assignments" },
  { id: "text_to_speech", label: "Text-to-speech support" },
  { id: "visual_aids", label: "Visual aids and graphics" },
  { id: "frequent_breaks", label: "Frequent breaks" },
  { id: "simplified_instructions", label: "Simplified instructions" },
];

export default function StudentOnboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [joiningClass, setJoiningClass] = useState(false);
  const [classJoinResult, setClassJoinResult] = useState<ClassJoinResult | null>(null);
  const [data, setData] = useState<OnboardingData>({
    classCode: "",
    gradeLevel: null,
    mathLevel: "on",
    readingLevel: "on",
    strengths: [],
    accommodations: [],
  });

  const totalSteps = 5;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleJoinClass = async () => {
    if (!data.classCode.trim()) return;
    
    setJoiningClass(true);
    setClassJoinResult(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Find the class by code
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("id, name")
        .eq("class_code", data.classCode.trim().toUpperCase())
        .single();

      if (classError || !classData) {
        setClassJoinResult({
          success: false,
          error: "Class not found. Check the code and try again.",
        });
        return;
      }

      // Check if already enrolled
      const { data: existingEnrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("student_id", user.id)
        .eq("class_id", classData.id)
        .single();

      if (existingEnrollment) {
        setClassJoinResult({
          success: true,
          className: classData.name,
          error: "You're already enrolled in this class!",
        });
        return;
      }

      // Enroll the student
      const { error: enrollError } = await supabase
        .from("enrollments")
        .insert({
          student_id: user.id,
          class_id: classData.id,
        });

      if (enrollError) throw enrollError;

      setClassJoinResult({
        success: true,
        className: classData.name,
      });

      toast({
        title: "Joined class! 🎉",
        description: `You're now enrolled in ${classData.name}`,
      });
    } catch (error) {
      console.error("Error joining class:", error);
      setClassJoinResult({
        success: false,
        error: "Something went wrong. Please try again.",
      });
    } finally {
      setJoiningClass(false);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Update student_profiles with onboarding data
      const { error } = await supabase
        .from("student_profiles")
        .update({
          grade_level: data.gradeLevel,
          math_level: data.mathLevel,
          reading_level: data.readingLevel,
          strengths: data.strengths,
          accommodations: data.accommodations,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Welcome to NYClogic Scholar Ai! 🎉",
        description: "Your profile is all set up. Let's start learning!",
      });

      navigate("/student");
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      toast({
        title: "Error",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleStrength = (id: string) => {
    setData(prev => ({
      ...prev,
      strengths: prev.strengths.includes(id)
        ? prev.strengths.filter(s => s !== id)
        : [...prev.strengths, id],
    }));
  };

  const toggleAccommodation = (id: string) => {
    setData(prev => ({
      ...prev,
      accommodations: prev.accommodations.includes(id)
        ? prev.accommodations.filter(a => a !== id)
        : [...prev.accommodations, id],
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true; // Class code is optional
      case 1:
        return data.gradeLevel !== null;
      case 2:
        return data.mathLevel && data.readingLevel;
      case 3:
        return true; // Strengths are optional
      case 4:
        return true; // Accommodations are optional
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        {/* Progress Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                Step {currentStep + 1} of {totalSteps}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="border-2 border-border shadow-lg">
          <AnimatePresence mode="wait">
            {/* Step 0: Class Code */}
            {currentStep === 0 && (
              <motion.div
                key="classCode"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Join Your Class</CardTitle>
                  <CardDescription>
                    Enter the class code from your teacher to join their class
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="classCode" className="text-sm font-medium">
                      Class Code
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="classCode"
                        placeholder="Enter code (e.g., ABC123)"
                        value={data.classCode}
                        onChange={(e) => {
                          setData({ ...data, classCode: e.target.value.toUpperCase() });
                          setClassJoinResult(null);
                        }}
                        className="text-center text-lg font-mono tracking-widest uppercase"
                        maxLength={10}
                        disabled={joiningClass}
                      />
                      <Button
                        onClick={handleJoinClass}
                        disabled={!data.classCode.trim() || joiningClass}
                        size="default"
                      >
                        {joiningClass ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Join"
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Result feedback */}
                  {classJoinResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-center gap-2 p-3 rounded-lg ${
                        classJoinResult.success
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {classJoinResult.success ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm">
                            {classJoinResult.error || `Joined "${classJoinResult.className}"!`}
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm">{classJoinResult.error}</span>
                        </>
                      )}
                    </motion.div>
                  )}

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or continue without a code
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Don't have a code? No problem! You can join a class later from your profile.
                  </p>
                </CardContent>
              </motion.div>
            )}

            {/* Step 1: Grade Level */}
            {currentStep === 1 && (
              <motion.div
                key="grade"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <GraduationCap className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">What grade are you in?</CardTitle>
                  <CardDescription>
                    This helps us personalize your learning experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <RadioGroup
                    value={data.gradeLevel?.toString() || ""}
                    onValueChange={(v) => setData({ ...data, gradeLevel: parseInt(v) })}
                    className="grid grid-cols-2 gap-3"
                  >
                    {GRADE_OPTIONS.map((grade) => (
                      <div key={grade.value}>
                        <RadioGroupItem
                          value={grade.value.toString()}
                          id={`grade-${grade.value}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`grade-${grade.value}`}
                          className="flex items-center justify-center p-4 rounded-xl border-2 border-muted cursor-pointer transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                        >
                          <span className="font-medium">{grade.label}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </motion.div>
            )}

            {/* Step 2: Skill Levels */}
            {currentStep === 2 && (
              <motion.div
                key="skills"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">How do you feel about...</CardTitle>
                  <CardDescription>
                    Be honest! This helps us find the right level for you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  {/* Math Level */}
                  <div>
                    <Label className="text-base font-semibold flex items-center gap-2 mb-3">
                      <Calculator className="w-4 h-4 text-primary" />
                      Math
                    </Label>
                    <RadioGroup
                      value={data.mathLevel}
                      onValueChange={(v) => setData({ ...data, mathLevel: v })}
                      className="space-y-2"
                    >
                      {SKILL_LEVELS.map((level) => (
                        <div key={level.value}>
                          <RadioGroupItem
                            value={level.value}
                            id={`math-${level.value}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`math-${level.value}`}
                            className="flex items-center justify-between p-3 rounded-lg border-2 border-muted cursor-pointer transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                          >
                            <div>
                              <span className="font-medium">{level.label}</span>
                              <p className="text-xs text-muted-foreground">{level.description}</p>
                            </div>
                            <div className="w-5 h-5 rounded-full border-2 border-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground hidden peer-data-[state=checked]:block" />
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Reading Level */}
                  <div>
                    <Label className="text-base font-semibold flex items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4 text-accent" />
                      Reading
                    </Label>
                    <RadioGroup
                      value={data.readingLevel}
                      onValueChange={(v) => setData({ ...data, readingLevel: v })}
                      className="space-y-2"
                    >
                      {SKILL_LEVELS.map((level) => (
                        <div key={level.value}>
                          <RadioGroupItem
                            value={level.value}
                            id={`reading-${level.value}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`reading-${level.value}`}
                            className="flex items-center justify-between p-3 rounded-lg border-2 border-muted cursor-pointer transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                          >
                            <div>
                              <span className="font-medium">{level.label}</span>
                              <p className="text-xs text-muted-foreground">{level.description}</p>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </CardContent>
              </motion.div>
            )}

            {/* Step 3: Strengths */}
            {currentStep === 3 && (
              <motion.div
                key="strengths"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">What are you good at?</CardTitle>
                  <CardDescription>
                    Select all that apply — we'll celebrate your strengths!
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    {STRENGTHS.map((strength) => {
                      const Icon = strength.icon;
                      const isSelected = data.strengths.includes(strength.id);
                      return (
                        <button
                          key={strength.id}
                          onClick={() => toggleStrength(strength.id)}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-primary/50"
                          }`}
                        >
                          <Icon className={`w-6 h-6 mb-2 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                          <span className="font-medium text-sm">{strength.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    This is optional — you can skip if you're not sure
                  </p>
                </CardContent>
              </motion.div>
            )}

            {/* Step 4: Accommodations */}
            {currentStep === 4 && (
              <motion.div
                key="accommodations"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Rocket className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Any extra support?</CardTitle>
                  <CardDescription>
                    We want to help you succeed — select any that would help
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {ACCOMMODATIONS.map((accommodation) => {
                      const isSelected = data.accommodations.includes(accommodation.id);
                      return (
                        <div
                          key={accommodation.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-primary/50"
                          }`}
                          onClick={() => toggleAccommodation(accommodation.id)}
                        >
                          <Checkbox
                            id={accommodation.id}
                            checked={isSelected}
                            className="pointer-events-none"
                          />
                          <Label
                            htmlFor={accommodation.id}
                            className="cursor-pointer flex-1"
                          >
                            {accommodation.label}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    This is optional and private — only your teachers will see this
                  </p>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="p-6 pt-0 flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            {currentStep < totalSteps - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1"
              >
                {currentStep === 0 ? "Continue" : "Next"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-primary to-primary/80"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <Sparkles className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>

        {/* Skip Option */}
        <div className="text-center mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/student")}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip for now
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
