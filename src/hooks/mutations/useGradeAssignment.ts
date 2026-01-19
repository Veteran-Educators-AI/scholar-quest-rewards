/**
 * Grade Assignment Mutation Hook
 *
 * Handles assignment grading using React Query mutations.
 * Replaces the old useGradeAssignment hook.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/lib/query";
import type { QuizQuestion } from "@/components/SimpleQuiz";

// ============================================================================
// Types
// ============================================================================

export interface GradeResult {
  score: number;
  total_questions: number;
  percentage: number;
  meets_threshold: boolean;
  feedback: string;
  incorrect_topics: string[];
  xp_earned: number;
  coins_earned: number;
  question_results: {
    question_id: string;
    is_correct: boolean;
    correct_answer: string;
    student_answer: string;
  }[];
  geoblox_unlocked?: boolean;
}

export interface GradeParams {
  studentId: string;
  assignmentId: string;
  attemptId?: string;
  answers: Record<string, string>;
  questions: QuizQuestion[];
  examType?: string;
}

// ============================================================================
// API Functions
// ============================================================================

async function gradeAssignmentApi(params: GradeParams): Promise<GradeResult> {
  // Transform answers to the expected format
  const formattedAnswers = Object.entries(params.answers).map(
    ([question_id, answer]) => ({
      question_id,
      answer,
    })
  );

  // Transform questions to the expected format
  const formattedQuestions = params.questions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    question_type: q.question_type,
    options: q.options,
    answer_key: q.answer_key,
    skill_tag: q.skill_tag,
    examType: params.examType,
  }));

  const { data, error } = await supabase.functions.invoke("grade-assignment", {
    body: {
      student_id: params.studentId,
      assignment_id: params.assignmentId,
      attempt_id: params.attemptId,
      answers: formattedAnswers,
      questions: formattedQuestions,
      exam_type: params.examType,
    },
  });

  if (error) {
    throw new Error(error.message || "Failed to grade assignment");
  }

  return data as GradeResult;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to grade an assignment with cache invalidation
 */
export function useGradeAssignmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: gradeAssignmentApi,
    onSuccess: (data, variables) => {
      // Invalidate assignment data
      queryClient.invalidateQueries({
        queryKey: queryKeys.assignments.detail(variables.assignmentId),
      });

      // Invalidate attempts
      queryClient.invalidateQueries({
        queryKey: queryKeys.assignments.attempts(variables.assignmentId),
      });

      // Invalidate student profile (XP/coins may have changed)
      queryClient.invalidateQueries({
        queryKey: queryKeys.students.profile("me"),
      });

      // If GeoBlox was unlocked, invalidate that too
      if (data.geoblox_unlocked) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.geoblox.mastery("me"),
        });
      }
    },
  });
}

/**
 * Drop-in replacement for the old useGradeAssignment hook
 */
export function useGradeAssignment() {
  const mutation = useGradeAssignmentMutation();

  return {
    gradeAssignment: mutation.mutateAsync,
    isGrading: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}
