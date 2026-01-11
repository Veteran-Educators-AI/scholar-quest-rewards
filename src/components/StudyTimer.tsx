import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
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
import {
  Play,
  Pause,
  RotateCcw,
  Timer,
  Coffee,
  Brain,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  CheckCircle2,
  BookOpen,
  Target,
  Zap,
  X,
  Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudyTimer, formatStudyTime, Assignment } from "@/contexts/StudyTimerContext";

type TimerMode = "work" | "shortBreak" | "longBreak";

interface TimerSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

const DEFAULT_SETTINGS: TimerSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
};

// Demo assignments for the selector
const DEMO_ASSIGNMENTS: Assignment[] = [
  { id: "1", title: "Algebra II: Quadratic Functions", subject: "math" },
  { id: "2", title: "AP Literature: The Great Gatsby Analysis", subject: "english" },
  { id: "3", title: "Chemistry: Molecular Bonding Lab Report", subject: "science" },
];

export function StudyTimer() {
  const {
    currentAssignment,
    setCurrentAssignment,
    addTimeToAssignment,
    getTimeForAssignment,
    isTimerOpen,
    setIsTimerOpen,
  } = useStudyTimer();

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [settings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Track time spent in current session for the linked assignment
  const sessionStartTime = useRef<number | null>(null);
  const accumulatedTime = useRef<number>(0);

  const getDuration = useCallback((timerMode: TimerMode) => {
    switch (timerMode) {
      case "work":
        return settings.workDuration * 60;
      case "shortBreak":
        return settings.shortBreakDuration * 60;
      case "longBreak":
        return settings.longBreakDuration * 60;
    }
  }, [settings]);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    gainNode.gain.value = 0.3;
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    oscillator.stop(audioContext.currentTime + 0.5);
  }, [soundEnabled]);

  // Save accumulated time when stopping or completing
  const saveAccumulatedTime = useCallback(() => {
    if (currentAssignment && mode === "work") {
      if (sessionStartTime.current) {
        const elapsed = Math.floor((Date.now() - sessionStartTime.current) / 1000);
        accumulatedTime.current += elapsed;
        sessionStartTime.current = null;
      }
      if (accumulatedTime.current > 0) {
        addTimeToAssignment(currentAssignment.id, accumulatedTime.current);
        accumulatedTime.current = 0;
      }
    }
  }, [currentAssignment, mode, addTimeToAssignment]);

  const handleTimerComplete = useCallback(() => {
    playNotificationSound();
    saveAccumulatedTime();
    
    if (mode === "work") {
      const newSessions = sessionsCompleted + 1;
      setSessionsCompleted(newSessions);
      
      if (newSessions % settings.sessionsUntilLongBreak === 0) {
        setMode("longBreak");
        setTimeLeft(settings.longBreakDuration * 60);
      } else {
        setMode("shortBreak");
        setTimeLeft(settings.shortBreakDuration * 60);
      }
    } else {
      setMode("work");
      setTimeLeft(settings.workDuration * 60);
    }
    
    setIsRunning(false);
  }, [mode, sessionsCompleted, settings, playNotificationSound, saveAccumulatedTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, handleTimerComplete]);

  // Track session start time
  useEffect(() => {
    if (isRunning && mode === "work" && currentAssignment) {
      sessionStartTime.current = Date.now();
    } else if (!isRunning && sessionStartTime.current) {
      saveAccumulatedTime();
    }
  }, [isRunning, mode, currentAssignment, saveAccumulatedTime]);

  const toggleTimer = () => {
    if (isRunning) {
      saveAccumulatedTime();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    saveAccumulatedTime();
    setIsRunning(false);
    setTimeLeft(getDuration(mode));
  };

  const switchMode = (newMode: TimerMode) => {
    saveAccumulatedTime();
    setMode(newMode);
    setTimeLeft(getDuration(newMode));
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = 1 - timeLeft / getDuration(mode);

  const getModeColor = () => {
    switch (mode) {
      case "work": return "text-primary";
      case "shortBreak": return "text-success";
      case "longBreak": return "text-accent";
    }
  };

  const getModeGradient = () => {
    switch (mode) {
      case "work": return "from-primary/20 to-primary/5";
      case "shortBreak": return "from-success/20 to-success/5";
      case "longBreak": return "from-accent/20 to-accent/5";
    }
  };

  const getModeBgColor = () => {
    switch (mode) {
      case "work": return "bg-primary";
      case "shortBreak": return "bg-success";
      case "longBreak": return "bg-accent";
    }
  };

  const getSubjectIcon = (subject: string) => {
    switch (subject) {
      case "math": return <Target className="w-4 h-4" />;
      case "english": return <BookOpen className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case "math": return "bg-primary/10 text-primary";
      case "english": return "bg-accent/10 text-accent";
      default: return "bg-success/10 text-success";
    }
  };

  // Assignment selector component
  const AssignmentSelector = () => (
    <div className="mb-4">
      <label className="text-xs text-muted-foreground mb-2 block">Linked Assignment</label>
      <Select
        value={currentAssignment?.id || "none"}
        onValueChange={(value) => {
          if (value === "none") {
            setCurrentAssignment(null);
          } else {
            const assignment = DEMO_ASSIGNMENTS.find((a) => a.id === value);
            if (assignment) setCurrentAssignment(assignment);
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an assignment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-muted-foreground">No assignment linked</span>
          </SelectItem>
          {DEMO_ASSIGNMENTS.map((assignment) => (
            <SelectItem key={assignment.id} value={assignment.id}>
              <div className="flex items-center gap-2">
                <div className={cn("w-5 h-5 rounded flex items-center justify-center", getSubjectColor(assignment.subject))}>
                  {getSubjectIcon(assignment.subject)}
                </div>
                <span className="truncate max-w-[200px]">{assignment.title}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {currentAssignment && (
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Time spent on this assignment:</span>
          <span className="font-medium text-foreground">
            {formatStudyTime(getTimeForAssignment(currentAssignment.id))}
          </span>
        </div>
      )}
    </div>
  );

  // Linked assignment badge
  const LinkedAssignmentBadge = ({ compact = false }: { compact?: boolean }) => {
    if (!currentAssignment) return null;
    
    return (
      <div className={cn(
        "flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2",
        compact && "px-2 py-1"
      )}>
        <div className={cn("w-6 h-6 rounded flex items-center justify-center", getSubjectColor(currentAssignment.subject))}>
          {getSubjectIcon(currentAssignment.subject)}
        </div>
        <div className={cn("flex-1 min-w-0", compact && "hidden sm:block")}>
          <p className="text-xs font-medium text-foreground truncate">{currentAssignment.title}</p>
          <p className="text-[10px] text-muted-foreground">
            {formatStudyTime(getTimeForAssignment(currentAssignment.id))} logged
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            saveAccumulatedTime();
            setCurrentAssignment(null);
          }}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  };

  // Focus Mode Full Screen
  if (isFocusMode) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
      >
        {/* Ambient background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl",
              mode === "work" ? "bg-primary" : mode === "shortBreak" ? "bg-success" : "bg-accent"
            )}
          />
        </div>

        {/* Exit focus mode button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10"
          onClick={() => setIsFocusMode(false)}
        >
          <Minimize2 className="w-5 h-5" />
        </Button>

        {/* Timer content */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Linked assignment */}
          {currentAssignment && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <LinkedAssignmentBadge />
            </motion.div>
          )}

          {/* Mode indicator */}
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-8"
          >
            {mode === "work" ? (
              <Brain className={cn("w-6 h-6", getModeColor())} />
            ) : (
              <Coffee className={cn("w-6 h-6", getModeColor())} />
            )}
            <span className={cn("text-xl font-medium", getModeColor())}>
              {mode === "work" ? "Focus Time" : mode === "shortBreak" ? "Short Break" : "Long Break"}
            </span>
          </motion.div>

          {/* Timer circle */}
          <div className="relative w-72 h-72 md:w-96 md:h-96">
            <svg className="w-full h-full -rotate-90">
              <circle cx="50%" cy="50%" r="45%" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/20" />
              <motion.circle
                cx="50%" cy="50%" r="45%" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
                className={getModeColor()}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: progress }}
                transition={{ duration: 0.5 }}
                style={{ strokeDasharray: "283%", strokeDashoffset: `${283 * (1 - progress)}%` }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                key={timeLeft}
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                className="text-6xl md:text-8xl font-bold font-display text-foreground"
              >
                {formatTime(timeLeft)}
              </motion.span>
              <span className="text-muted-foreground mt-2">Session {sessionsCompleted + 1}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 mt-8">
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={resetTimer}>
              <RotateCcw className="w-5 h-5" />
            </Button>
            
            <Button
              size="lg"
              className={cn("h-16 w-16 rounded-full", getModeBgColor(), "hover:opacity-90")}
              onClick={toggleTimer}
            >
              {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </Button>

            <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={() => setSoundEnabled(!soundEnabled)}>
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
          </div>

          {/* Session indicators */}
          <div className="flex items-center gap-2 mt-8">
            {Array.from({ length: settings.sessionsUntilLongBreak }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-3 h-3 rounded-full transition-colors",
                  i < sessionsCompleted % settings.sessionsUntilLongBreak ? getModeBgColor() : "bg-muted"
                )}
              />
            ))}
          </div>

          {mode === "work" && (
            <Button variant="ghost" size="sm" className="mt-6 text-muted-foreground" onClick={() => switchMode("shortBreak")}>
              Skip to break
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <Dialog open={isTimerOpen} onOpenChange={setIsTimerOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Timer className="w-4 h-4" />
          <span className="hidden sm:inline">Study Timer</span>
          {currentAssignment && (
            <span className="w-2 h-2 bg-primary rounded-full" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-primary" />
            Pomodoro Timer
          </DialogTitle>
        </DialogHeader>

        {/* Assignment selector */}
        <AssignmentSelector />

        <div className={cn("rounded-2xl p-6 bg-gradient-to-b", getModeGradient())}>
          {/* Linked assignment badge in timer */}
          {currentAssignment && (
            <div className="mb-4">
              <LinkedAssignmentBadge compact />
            </div>
          )}

          {/* Mode tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={mode === "work" ? "default" : "ghost"}
              size="sm"
              className={cn(mode === "work" && "bg-primary")}
              onClick={() => switchMode("work")}
            >
              <Brain className="w-4 h-4 mr-1" />
              Focus
            </Button>
            <Button
              variant={mode === "shortBreak" ? "default" : "ghost"}
              size="sm"
              className={cn(mode === "shortBreak" && "bg-success")}
              onClick={() => switchMode("shortBreak")}
            >
              <Coffee className="w-4 h-4 mr-1" />
              Short
            </Button>
            <Button
              variant={mode === "longBreak" ? "default" : "ghost"}
              size="sm"
              className={cn(mode === "longBreak" && "bg-accent")}
              onClick={() => switchMode("longBreak")}
            >
              <Coffee className="w-4 h-4 mr-1" />
              Long
            </Button>
          </div>

          {/* Timer display */}
          <div className="text-center mb-6">
            <motion.div
              key={timeLeft}
              initial={{ scale: 1.02 }}
              animate={{ scale: 1 }}
              className="text-5xl font-bold font-display text-foreground"
            >
              {formatTime(timeLeft)}
            </motion.div>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "work" ? "Time to focus" : "Take a break"}
            </p>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-6">
            <motion.div
              className={cn("h-full rounded-full", getModeBgColor())}
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="icon" onClick={resetTimer}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            <Button
              size="lg"
              className={cn("h-14 w-14 rounded-full", getModeBgColor())}
              onClick={toggleTimer}
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setIsFocusMode(true);
                setIsTimerOpen(false);
              }}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Session counter */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {sessionsCompleted} session{sessionsCompleted !== 1 ? "s" : ""} completed
            </span>
          </div>

          {/* Session indicators */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {Array.from({ length: settings.sessionsUntilLongBreak }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  i < sessionsCompleted % settings.sessionsUntilLongBreak ? getModeBgColor() : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>

        {/* Sound toggle */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-muted-foreground">Sound notifications</span>
          <Button variant="ghost" size="sm" onClick={() => setSoundEnabled(!soundEnabled)}>
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
