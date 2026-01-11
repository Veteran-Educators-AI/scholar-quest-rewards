import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface Assignment {
  id: string;
  title: string;
  subject: string;
}

export interface TimeEntry {
  assignmentId: string;
  duration: number; // in seconds
  date: string; // ISO date string
}

interface StudyTimerContextType {
  currentAssignment: Assignment | null;
  setCurrentAssignment: (assignment: Assignment | null) => void;
  timeTracking: Record<string, number>; // assignmentId -> total seconds
  addTimeToAssignment: (assignmentId: string, seconds: number) => void;
  getTimeForAssignment: (assignmentId: string) => number;
  isTimerOpen: boolean;
  setIsTimerOpen: (open: boolean) => void;
  startTimerForAssignment: (assignment: Assignment) => void;
}

const StudyTimerContext = createContext<StudyTimerContextType | undefined>(undefined);

const STORAGE_KEY = "scholar_quest_time_tracking";

export function StudyTimerProvider({ children }: { children: React.ReactNode }) {
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [timeTracking, setTimeTracking] = useState<Record<string, number>>({});
  const [isTimerOpen, setIsTimerOpen] = useState(false);

  // Load time tracking from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTimeTracking(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse time tracking data:", e);
      }
    }
  }, []);

  // Save time tracking to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timeTracking));
  }, [timeTracking]);

  const addTimeToAssignment = useCallback((assignmentId: string, seconds: number) => {
    setTimeTracking((prev) => ({
      ...prev,
      [assignmentId]: (prev[assignmentId] || 0) + seconds,
    }));
  }, []);

  const getTimeForAssignment = useCallback((assignmentId: string) => {
    return timeTracking[assignmentId] || 0;
  }, [timeTracking]);

  const startTimerForAssignment = useCallback((assignment: Assignment) => {
    setCurrentAssignment(assignment);
    setIsTimerOpen(true);
  }, []);

  return (
    <StudyTimerContext.Provider
      value={{
        currentAssignment,
        setCurrentAssignment,
        timeTracking,
        addTimeToAssignment,
        getTimeForAssignment,
        isTimerOpen,
        setIsTimerOpen,
        startTimerForAssignment,
      }}
    >
      {children}
    </StudyTimerContext.Provider>
  );
}

export function useStudyTimer() {
  const context = useContext(StudyTimerContext);
  if (!context) {
    throw new Error("useStudyTimer must be used within a StudyTimerProvider");
  }
  return context;
}

export function formatStudyTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}
