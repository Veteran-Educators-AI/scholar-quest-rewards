import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { QuizQuestion } from "@/components/SimpleQuiz";

interface GradeResult {
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
}

interface GradeParams {
  studentId: string;
  assignmentId: string;
  attemptId?: string;
  answers: Record<string, string>;
  questions: QuizQuestion[];
}

export function useGradeAssignment() {
  const [isGrading, setIsGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gradeAssignment = async (params: GradeParams): Promise<GradeResult | null> => {
    setIsGrading(true);
    setError(null);

    try {
      // Transform answers to the expected format
      const formattedAnswers = Object.entries(params.answers).map(([question_id, answer]) => ({
        question_id,
        answer,
      }));

      // Transform questions to the expected format
      const formattedQuestions = params.questions.map(q => ({
        id: q.id,
        prompt: q.prompt,
        question_type: q.question_type,
        options: q.options,
        answer_key: q.answer_key,
        skill_tag: q.skill_tag,
      }));

      const { data, error: fnError } = await supabase.functions.invoke("grade-assignment", {
        body: {
          student_id: params.studentId,
          assignment_id: params.assignmentId,
          attempt_id: params.attemptId,
          answers: formattedAnswers,
          questions: formattedQuestions,
        },
      });

      if (fnError) {
        console.error("Grading function error:", fnError);
        setError(fnError.message);
        return null;
      }

      return data as GradeResult;
    } catch (err) {
      console.error("Grading error:", err);
      setError(err instanceof Error ? err.message : "Failed to grade assignment");
      return null;
    } finally {
      setIsGrading(false);
    }
  };

  return {
    gradeAssignment,
    isGrading,
    error,
  };
}
