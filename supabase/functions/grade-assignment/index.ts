/**
 * Grade Assignment Edge Function
 *
 * Grades student assignment submissions with support for multiple question types.
 * Uses AI for short answer grading and awards rewards for passing scores.
 */

import {
  createHandler,
  logRequest,
  parseBody,
  createSuccessResponse,
  gradeShortAnswer,
  GradeAssignmentRequestSchema,
  THRESHOLDS,
  REWARDS,
  getFeedbackMessage,
  SOURCE_APPS,
  type MiddlewareContext,
  type GradeAssignmentRequest,
  type Question,
  type SubmittedAnswer,
  type SupabaseClient,
} from "../_shared/index.ts";

/**
 * Result for a single question.
 */
interface QuestionResult {
  question_id: string;
  is_correct: boolean;
  correct_answer: string;
  student_answer: string;
}

/**
 * Complete grading result.
 */
interface GradeResult {
  score: number;
  total_questions: number;
  percentage: number;
  meets_threshold: boolean;
  feedback: string;
  incorrect_topics: string[];
  xp_earned: number;
  coins_earned: number;
  question_results: QuestionResult[];
  geoblox_unlocked?: boolean;
}

/**
 * Grades drag_order questions - check if arrays match.
 */
function gradeDragOrder(studentAnswer: string, correctOrder: string[]): boolean {
  try {
    const parsedAnswer = JSON.parse(studentAnswer);
    if (!Array.isArray(parsedAnswer)) return false;
    if (parsedAnswer.length !== correctOrder.length) return false;
    return parsedAnswer.every((item, idx) => item === correctOrder[idx]);
  } catch {
    return false;
  }
}

/**
 * Grades matching questions - check if all pairs match correctly.
 */
function gradeMatching(
  studentAnswer: string,
  correctPairs: { left: string; right: string }[]
): boolean {
  try {
    const parsedAnswer = JSON.parse(studentAnswer);
    if (typeof parsedAnswer !== "object") return false;

    for (const pair of correctPairs) {
      if (parsedAnswer[pair.left] !== pair.right) {
        return false;
      }
    }
    return Object.keys(parsedAnswer).length === correctPairs.length;
  } catch {
    return false;
  }
}

/**
 * Grades fill_blank questions - check if all blanks are correct.
 */
function gradeFillBlank(studentAnswer: string, correctAnswers: string[]): boolean {
  try {
    const parsedAnswer = JSON.parse(studentAnswer);
    if (!Array.isArray(parsedAnswer)) return false;
    if (parsedAnswer.length !== correctAnswers.length) return false;

    return parsedAnswer.every((answer, idx) => {
      const normalizedStudent = answer.toString().toLowerCase().trim();
      const normalizedCorrect = correctAnswers[idx].toString().toLowerCase().trim();
      return normalizedStudent === normalizedCorrect;
    });
  } catch {
    return false;
  }
}

/**
 * Updates geometry mastery and checks for GeoBlox unlock.
 */
async function updateGeometryMastery(
  supabase: SupabaseClient,
  studentId: string,
  questionsAttempted: number,
  questionsCorrect: number
): Promise<boolean> {
  try {
    const { data: existing } = await supabase
      .from("geometry_mastery")
      .select("*")
      .eq("student_id", studentId)
      .single();

    const existingData = existing as {
      questions_attempted?: number;
      questions_correct?: number;
      geoblox_unlocked?: boolean;
      unlocked_at?: string | null;
    } | null;

    const totalAttempted = (existingData?.questions_attempted || 0) + questionsAttempted;
    const totalCorrect = (existingData?.questions_correct || 0) + questionsCorrect;
    const percentage = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;
    const shouldUnlock = percentage >= THRESHOLDS.GEOBLOX_UNLOCK;

    if (existingData) {
      await supabase
        .from("geometry_mastery")
        .update({
          questions_attempted: totalAttempted,
          questions_correct: totalCorrect,
          mastery_percentage: percentage,
          geoblox_unlocked: shouldUnlock,
          unlocked_at:
            shouldUnlock && !existingData.geoblox_unlocked
              ? new Date().toISOString()
              : existingData.unlocked_at,
        })
        .eq("student_id", studentId);
    } else {
      await supabase.from("geometry_mastery").insert({
        student_id: studentId,
        questions_attempted: totalAttempted,
        questions_correct: totalCorrect,
        mastery_percentage: percentage,
        geoblox_unlocked: shouldUnlock,
        unlocked_at: shouldUnlock ? new Date().toISOString() : null,
      });
    }

    console.log(
      `Geometry mastery for ${studentId}: ${percentage.toFixed(1)}% (${shouldUnlock ? "UNLOCKED" : "locked"})`
    );
    return shouldUnlock;
  } catch (error) {
    console.error("Error updating geometry mastery:", error);
    return false;
  }
}

/**
 * Grades a single question based on its type.
 */
async function gradeQuestion(
  question: Question,
  studentAnswer: string
): Promise<{ isCorrect: boolean; correctAnswerStr: string }> {
  let isCorrect = false;
  let correctAnswerStr = "";

  switch (question.question_type) {
    case "multiple_choice": {
      const mcCorrect = Array.isArray(question.answer_key)
        ? question.answer_key[0]
        : question.answer_key;
      correctAnswerStr = String(mcCorrect);
      isCorrect = studentAnswer === correctAnswerStr;
      break;
    }

    case "short_answer": {
      const gradeResult = await gradeShortAnswer(
        studentAnswer,
        question.answer_key as string | string[],
        question.prompt
      );
      isCorrect = gradeResult.isCorrect;
      const saAnswerKey = question.answer_key;
      if (Array.isArray(saAnswerKey) && typeof saAnswerKey[0] === "string") {
        correctAnswerStr = saAnswerKey[0];
      } else if (typeof saAnswerKey === "string") {
        correctAnswerStr = saAnswerKey;
      } else {
        correctAnswerStr = JSON.stringify(saAnswerKey);
      }
      break;
    }

    case "drag_order": {
      const orderCorrect = question.answer_key as string[];
      isCorrect = gradeDragOrder(studentAnswer, orderCorrect);
      correctAnswerStr = JSON.stringify(orderCorrect);
      break;
    }

    case "matching": {
      const pairs = question.answer_key as { left: string; right: string }[];
      isCorrect = gradeMatching(studentAnswer, pairs);
      correctAnswerStr = JSON.stringify(pairs);
      break;
    }

    case "fill_blank": {
      const blankAnswers = question.answer_key as string[];
      isCorrect = gradeFillBlank(studentAnswer, blankAnswers);
      correctAnswerStr = JSON.stringify(blankAnswers);
      break;
    }

    default:
      console.warn(`Unknown question type: ${question.question_type}`);
      isCorrect = false;
      correctAnswerStr = "Unknown";
  }

  return { isCorrect, correctAnswerStr };
}

/**
 * Syncs grading results to NYCologic.
 */
async function syncToNYCologic(
  data: Record<string, unknown>
): Promise<void> {
  const nycologicApiUrl = Deno.env.get("NYCOLOGIC_API_URL");
  if (!nycologicApiUrl) return;

  try {
    await fetch(nycologicApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-source-app": SOURCE_APPS.SCHOLAR,
      },
      body: JSON.stringify({
        source: SOURCE_APPS.SCHOLAR,
        timestamp: new Date().toISOString(),
        event_type: "assignment_graded",
        data,
      }),
    });
    console.log("Synced to NYCologic successfully");
  } catch (syncError) {
    console.error("NYCologic sync failed:", syncError);
    // Continue anyway - don't fail the grading
  }
}

/**
 * Main handler for grading assignments.
 */
async function handleGradeAssignment(
  _req: Request,
  ctx: MiddlewareContext
): Promise<Response> {
  const request = ctx.body as GradeAssignmentRequest;
  const { supabase } = ctx;
  const { student_id, assignment_id, attempt_id, answers, questions, exam_type } = request;

  console.log(`Grading assignment ${assignment_id} for student ${student_id}`);

  // Grade each question
  const questionResults: QuestionResult[] = [];
  const incorrectTopics: string[] = [];
  let correctCount = 0;

  for (const question of questions) {
    const submittedAnswer = answers.find((a: SubmittedAnswer) => a.question_id === question.id);
    const studentAnswer = submittedAnswer?.answer || "";

    const { isCorrect, correctAnswerStr } = await gradeQuestion(question, studentAnswer);

    if (isCorrect) {
      correctCount++;
    } else if (question.skill_tag && !incorrectTopics.includes(question.skill_tag)) {
      incorrectTopics.push(question.skill_tag);
    }

    questionResults.push({
      question_id: question.id,
      is_correct: isCorrect,
      correct_answer: correctAnswerStr,
      student_answer: studentAnswer,
    });
  }

  const totalQuestions = questions.length;
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const meetsThreshold = percentage >= THRESHOLDS.PASSING_SCORE;

  // Calculate rewards (only if passing)
  const xpEarned = meetsThreshold ? REWARDS.BASE_XP_PER_CORRECT * correctCount : 0;
  const coinsEarned = meetsThreshold ? REWARDS.BASE_COIN_PER_CORRECT * correctCount : 0;

  // Generate feedback
  const feedback = getFeedbackMessage(percentage, THRESHOLDS.PASSING_SCORE);

  // Track geometry exams for GeoBlox unlock
  let geobloxUnlocked = false;
  const isGeometryExam =
    exam_type === "geometry" || questions.some((q: Question) => q.examType === "geometry");

  if (isGeometryExam) {
    geobloxUnlocked = await updateGeometryMastery(
      supabase,
      student_id,
      totalQuestions,
      correctCount
    );
  }

  const gradeResult: GradeResult = {
    score: correctCount,
    total_questions: totalQuestions,
    percentage,
    meets_threshold: meetsThreshold,
    feedback,
    incorrect_topics: incorrectTopics,
    xp_earned: xpEarned,
    coins_earned: coinsEarned,
    question_results: questionResults,
    geoblox_unlocked: geobloxUnlocked,
  };

  // Update attempt in database if attempt_id provided
  if (attempt_id) {
    await supabase
      .from("attempts")
      .update({
        score: correctCount,
        status: "verified",
        answers: answers,
        verified_at: new Date().toISOString(),
      })
      .eq("id", attempt_id);
  }

  // Award XP and coins securely
  if (meetsThreshold && xpEarned > 0) {
    console.log(`Awarding rewards via secure function: ${xpEarned} XP, ${coinsEarned} coins`);

    const { data: rewardResult, error: rewardError } = await supabase.rpc(
      "award_rewards_secure",
      {
        p_student_id: student_id,
        p_claim_type: "assignment",
        p_reference_id: assignment_id,
        p_xp_amount: xpEarned,
        p_coin_amount: coinsEarned,
        p_reason: `Assignment completed: ${percentage}%`,
      }
    );

    if (rewardError) {
      console.error("Secure reward error:", rewardError);
      if (!rewardError.message?.includes("already claimed")) {
        console.warn("Failed to award rewards securely:", rewardError.message);
      }
    } else {
      console.log("Rewards awarded securely:", rewardResult);
    }
  }

  // Sync to NYCologic
  await syncToNYCologic({
    student_id,
    assignment_id,
    score: correctCount,
    total_questions: totalQuestions,
    percentage,
    passed: meetsThreshold,
    xp_earned: xpEarned,
    coins_earned: coinsEarned,
    incorrect_topics: incorrectTopics,
    question_results: questionResults,
    geoblox_unlocked: geobloxUnlocked,
  });

  console.log(`Grading complete: ${correctCount}/${totalQuestions} (${percentage}%)`);

  return createSuccessResponse(gradeResult, {
    cors: ctx.corsHeaders,
    requestId: ctx.requestId,
  });
}

// Create and export the handler with middleware
// Note: This endpoint doesn't require auth as it's called server-to-server
Deno.serve(
  createHandler(handleGradeAssignment, {
    middleware: [logRequest, parseBody(GradeAssignmentRequestSchema)],
  })
);
