import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Question {
  id: string;
  prompt: string;
  question_type: "multiple_choice" | "short_answer";
  options?: string[];
  answer_key: string | string[];
  skill_tag?: string;
}

interface SubmittedAnswer {
  question_id: string;
  answer: string;
}

interface GradeRequest {
  student_id: string;
  assignment_id: string;
  attempt_id?: string;
  answers: SubmittedAnswer[];
  questions: Question[];
}

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

// Use AI to grade short answer questions
async function gradeShortAnswer(
  studentAnswer: string,
  correctAnswer: string | string[],
  prompt: string
): Promise<{ isCorrect: boolean; feedback: string }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    // Fallback to simple string matching if no AI key
    const normalizedStudent = studentAnswer.toLowerCase().trim();
    const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
    const isCorrect = correctAnswers.some(ans => 
      normalizedStudent === ans.toLowerCase().trim() ||
      normalizedStudent.includes(ans.toLowerCase().trim())
    );
    return { isCorrect, feedback: isCorrect ? "Correct!" : "Not quite right." };
  }

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a friendly teacher grading student work. Be encouraging but accurate.
            
Given a question, the correct answer(s), and a student's answer, determine if the student's answer is correct.
Consider spelling variations, equivalent answers, and partial credit for short answers.

Respond with JSON only: {"isCorrect": boolean, "feedback": "brief encouraging feedback"}`
          },
          {
            role: "user",
            content: `Question: ${prompt}
Correct Answer(s): ${JSON.stringify(correctAnswer)}
Student's Answer: ${studentAnswer}

Is this correct?`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI grading failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        isCorrect: result.isCorrect === true,
        feedback: result.feedback || (result.isCorrect ? "Correct!" : "Not quite right.")
      };
    }
    
    // Fallback
    return { isCorrect: false, feedback: "Unable to grade this answer." };
  } catch (error) {
    console.error("AI grading error:", error);
    // Fallback to simple matching
    const normalizedStudent = studentAnswer.toLowerCase().trim();
    const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
    const isCorrect = correctAnswers.some(ans => 
      normalizedStudent === ans.toLowerCase().trim()
    );
    return { isCorrect, feedback: isCorrect ? "Correct!" : "Not quite right." };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const nycologicApiUrl = Deno.env.get("NYCOLOGIC_API_URL");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const gradeRequest: GradeRequest = await req.json();

    console.log(`Grading assignment ${gradeRequest.assignment_id} for student ${gradeRequest.student_id}`);

    const { student_id, assignment_id, attempt_id, answers, questions } = gradeRequest;
    
    // Grade each question
    const questionResults: GradeResult["question_results"] = [];
    const incorrectTopics: string[] = [];
    let correctCount = 0;

    for (const question of questions) {
      const submittedAnswer = answers.find(a => a.question_id === question.id);
      const studentAnswer = submittedAnswer?.answer || "";
      
      let isCorrect = false;
      const correctAnswer = Array.isArray(question.answer_key) 
        ? question.answer_key[0] 
        : question.answer_key;

      if (question.question_type === "multiple_choice") {
        // Simple exact match for multiple choice
        isCorrect = studentAnswer === correctAnswer;
      } else {
        // Use AI for short answer grading
        const gradeResult = await gradeShortAnswer(
          studentAnswer,
          question.answer_key,
          question.prompt
        );
        isCorrect = gradeResult.isCorrect;
      }

      if (isCorrect) {
        correctCount++;
      } else if (question.skill_tag && !incorrectTopics.includes(question.skill_tag)) {
        incorrectTopics.push(question.skill_tag);
      }

      questionResults.push({
        question_id: question.id,
        is_correct: isCorrect,
        correct_answer: correctAnswer,
        student_answer: studentAnswer,
      });
    }

    const totalQuestions = questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const threshold = 70;
    const meetsThreshold = percentage >= threshold;

    // Calculate rewards (only if passing)
    const baseXp = 10;
    const baseCoin = 2;
    const xpEarned = meetsThreshold ? baseXp * correctCount : 0;
    const coinsEarned = meetsThreshold ? baseCoin * correctCount : 0;

    // Generate feedback
    let feedback = "";
    if (percentage === 100) {
      feedback = "Perfect score! You're a superstar! 🌟";
    } else if (percentage >= 90) {
      feedback = "Amazing work! You really know your stuff!";
    } else if (percentage >= 80) {
      feedback = "Great job! Keep up the excellent work!";
    } else if (meetsThreshold) {
      feedback = "Good effort! You passed!";
    } else if (percentage >= 50) {
      feedback = "You're getting there! A little more practice and you'll nail it!";
    } else {
      feedback = "Keep trying! Practice makes perfect!";
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

    // Award XP and coins if passed
    if (meetsThreshold) {
      // Update student profile
      const { data: profile } = await supabase
        .from("student_profiles")
        .select("xp, coins, current_streak")
        .eq("user_id", student_id)
        .single();

      if (profile) {
        await supabase
          .from("student_profiles")
          .update({
            xp: profile.xp + xpEarned,
            coins: profile.coins + coinsEarned,
            current_streak: profile.current_streak + 1,
          })
          .eq("user_id", student_id);
      }

      // Add to reward ledger
      await supabase
        .from("reward_ledger")
        .insert({
          student_id,
          assignment_id,
          xp_delta: xpEarned,
          coin_delta: coinsEarned,
          reason: `Assignment completed: ${percentage}%`,
        });
    }

    // Sync to NYCologic if configured
    if (nycologicApiUrl) {
      try {
        await fetch(nycologicApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-source-app": "scholar-app",
          },
          body: JSON.stringify({
            source: "scholar-app",
            timestamp: new Date().toISOString(),
            event_type: "assignment_graded",
            data: {
              student_id,
              assignment_id,
              score: correctCount,
              total_questions: totalQuestions,
              percentage,
              passed: meetsThreshold,
              xp_earned: xpEarned,
              coins_earned: coinsEarned,
              incorrect_topics: incorrectTopics,
            },
          }),
        });
        console.log("Synced to NYCologic successfully");
      } catch (syncError) {
        console.error("NYCologic sync failed:", syncError);
        // Continue anyway - don't fail the grading
      }
    }

    console.log(`Grading complete: ${correctCount}/${totalQuestions} (${percentage}%)`);

    return new Response(
      JSON.stringify(gradeResult),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Grading error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Grading failed", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
