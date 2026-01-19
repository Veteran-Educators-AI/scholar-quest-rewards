/**
 * Generate Study Plan Edge Function
 *
 * Creates personalized AI-powered study plans based on student performance data.
 * Uses function calling to ensure structured output.
 */

import {
  createHandler,
  logRequest,
  requireAuth,
  createSuccessResponse,
  createErrorResponse,
  AI_GATEWAY,
  SYSTEM_PROMPTS,
  type MiddlewareContext,
} from "../_shared/index.ts";

/**
 * Study plan priority area.
 */
interface PriorityArea {
  standardCode: string;
  subject: string;
  topic: string;
  reason: string;
  currentLevel: "not_started" | "developing" | "approaching" | "mastered";
  urgency: "high" | "medium" | "low";
  suggestedTime: string;
}

/**
 * Weekly goal.
 */
interface WeeklyGoal {
  goal: string;
  metric: string;
  relatedStandard?: string;
}

/**
 * Daily schedule item.
 */
interface DailyScheduleItem {
  day: string;
  focusArea: string;
  activities: string[];
  estimatedTime: string;
}

/**
 * Generated study plan structure.
 */
interface StudyPlan {
  summary: string;
  priorityAreas: PriorityArea[];
  weeklyGoals: WeeklyGoal[];
  dailySchedule: DailyScheduleItem[];
  encouragement: string;
}

/**
 * Tool definition for structured study plan output.
 */
const STUDY_PLAN_TOOL = {
  type: "function" as const,
  function: {
    name: "generate_study_plan",
    description: "Generate a structured study plan with prioritized focus areas and daily recommendations",
    parameters: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "A brief encouraging summary of the student's current standing and what to focus on",
        },
        priorityAreas: {
          type: "array",
          description: "Top 3-5 standards/areas to focus on, in priority order",
          items: {
            type: "object",
            properties: {
              standardCode: { type: "string", description: "The standard code (e.g., AI-A.REI.3)" },
              subject: { type: "string" },
              topic: { type: "string", description: "Brief topic name" },
              reason: { type: "string", description: "Why this is a priority" },
              currentLevel: { type: "string", enum: ["not_started", "developing", "approaching", "mastered"] },
              urgency: { type: "string", enum: ["high", "medium", "low"] },
              suggestedTime: { type: "string", description: "Suggested daily study time for this area" },
            },
            required: ["standardCode", "subject", "topic", "reason", "currentLevel", "urgency", "suggestedTime"],
          },
        },
        weeklyGoals: {
          type: "array",
          description: "3-4 specific, achievable goals for this week",
          items: {
            type: "object",
            properties: {
              goal: { type: "string" },
              metric: { type: "string", description: "How to measure success" },
              relatedStandard: { type: "string", description: "Related standard code if applicable" },
            },
            required: ["goal", "metric"],
          },
        },
        dailySchedule: {
          type: "array",
          description: "Suggested daily study activities for the next 5 days",
          items: {
            type: "object",
            properties: {
              day: { type: "string", description: "Day name (Today, Tomorrow, Day 3, etc.)" },
              focusArea: { type: "string" },
              activities: { type: "array", items: { type: "string" } },
              estimatedTime: { type: "string" },
            },
            required: ["day", "focusArea", "activities", "estimatedTime"],
          },
        },
        encouragement: {
          type: "string",
          description: "A motivational message based on the student's progress",
        },
      },
      required: ["summary", "priorityAreas", "weeklyGoals", "dailySchedule", "encouragement"],
    },
  },
};

/**
 * Fetches all student performance data for study plan generation.
 */
async function fetchStudentPerformanceData(
  supabase: MiddlewareContext["supabase"],
  userId: string
): Promise<Record<string, unknown>> {
  // Fetch student profile
  const { data: studentProfile } = await supabase
    .from("student_profiles")
    .select("weaknesses, strengths, grade_level, skill_tags")
    .eq("user_id", userId)
    .single();

  // Fetch mastery data
  const { data: masteryData } = await supabase
    .from("student_standard_mastery")
    .select(`
      standard_id,
      mastery_level,
      attempts_count,
      correct_count,
      last_attempt_at,
      nys_standards (
        code,
        subject,
        domain,
        standard_text,
        grade_band
      )
    `)
    .eq("student_id", userId);

  // Fetch upcoming assignments
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("class_id")
    .eq("student_id", userId);

  let upcomingAssignments: Record<string, unknown>[] = [];
  if (enrollments && enrollments.length > 0) {
    const classIds = enrollments.map((e: { class_id: string }) => e.class_id);
    const { data: assignments } = await supabase
      .from("assignments")
      .select("id, title, subject, due_at, standard_id, nys_standards(code, subject, domain)")
      .in("class_id", classIds)
      .gte("due_at", new Date().toISOString())
      .order("due_at", { ascending: true })
      .limit(10);

    upcomingAssignments = assignments || [];
  }

  // Fetch practice set performance
  const { data: practiceSets } = await supabase
    .from("practice_sets")
    .select("title, score, skill_tags, completed_at")
    .eq("student_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(20);

  // Fetch game performance
  const { data: gamePerformance } = await supabase
    .from("skill_games")
    .select("skill_tag, high_score, attempts_count")
    .eq("student_id", userId)
    .gt("attempts_count", 0);

  // Build context for AI
  return {
    weaknesses: studentProfile?.weaknesses || [],
    strengths: studentProfile?.strengths || [],
    gradeLevel: studentProfile?.grade_level,
    masteryData: (masteryData || []).map((m: Record<string, unknown>) => {
      const standard = m.nys_standards as Record<string, unknown> | null;
      const attemptsCount = (m.attempts_count as number) || 0;
      const correctCount = (m.correct_count as number) || 0;
      return {
        code: standard?.code,
        subject: standard?.subject,
        domain: standard?.domain,
        standardText: standard?.standard_text,
        masteryLevel: m.mastery_level,
        accuracy: attemptsCount > 0 ? Math.round((correctCount / attemptsCount) * 100) : 0,
        lastAttempt: m.last_attempt_at,
      };
    }),
    upcomingAssignments: upcomingAssignments.map((a: Record<string, unknown>) => {
      const standard = a.nys_standards as Record<string, unknown> | null;
      return {
        title: a.title,
        subject: a.subject,
        dueAt: a.due_at,
        standardCode: standard?.code,
        domain: standard?.domain,
      };
    }),
    recentPractice: (practiceSets || []).map((p: Record<string, unknown>) => ({
      title: p.title,
      score: p.score,
      skills: p.skill_tags,
    })),
    gamePerformance: (gamePerformance || []).map((g: Record<string, unknown>) => ({
      skill: g.skill_tag,
      highScore: g.high_score,
      attempts: g.attempts_count,
    })),
  };
}

/**
 * Calls AI with function calling to generate structured study plan.
 */
async function generateStudyPlanWithAI(
  performanceContext: Record<string, unknown>
): Promise<StudyPlan> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  const systemPrompt = `${SYSTEM_PROMPTS.STUDY_PLAN}

Consider:
1. Standards where mastery is low (developing or not_started)
2. Upcoming assignments and their related standards
3. Identified weaknesses that need attention
4. Time until upcoming exams/assignments

Be encouraging but realistic. Prioritize standards that are both weak AND have upcoming relevance.`;

  const userPrompt = `Create a personalized study plan based on this student data:

${JSON.stringify(performanceContext, null, 2)}

Today's date: ${new Date().toLocaleDateString()}`;

  const response = await fetch(AI_GATEWAY.URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AI_GATEWAY.DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [STUDY_PLAN_TOOL],
      tool_choice: { type: "function", function: { name: "generate_study_plan" } },
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw { code: "RATE_LIMITED", message: "Rate limit exceeded. Please try again later." };
    }
    if (response.status === 402) {
      throw { code: "CREDITS_EXHAUSTED", message: "AI credits depleted. Please add funds to continue." };
    }
    const errorText = await response.text();
    console.error("AI gateway error:", response.status, errorText);
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const aiResponse = await response.json();
  const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];

  if (!toolCall?.function?.arguments) {
    throw new Error("Invalid AI response structure");
  }

  return JSON.parse(toolCall.function.arguments) as StudyPlan;
}

/**
 * Main handler for generating study plans.
 */
async function handleGenerateStudyPlan(
  _req: Request,
  ctx: MiddlewareContext
): Promise<Response> {
  const userId = ctx.user!.id;

  console.log(`Generating study plan for user ${userId}`);

  // Fetch all performance data
  const performanceContext = await fetchStudentPerformanceData(ctx.supabase, userId);

  // Generate study plan with AI
  try {
    const studyPlan = await generateStudyPlanWithAI(performanceContext);

    return createSuccessResponse(
      {
        studyPlan,
        generatedAt: new Date().toISOString(),
      },
      {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      }
    );
  } catch (error) {
    // Handle specific AI errors
    if (error && typeof error === "object" && "code" in error) {
      const aiError = error as { code: string; message: string };
      if (aiError.code === "RATE_LIMITED") {
        return createErrorResponse("RATE_LIMITED", aiError.message, {
          cors: ctx.corsHeaders,
          requestId: ctx.requestId,
        });
      }
      if (aiError.code === "CREDITS_EXHAUSTED") {
        return createErrorResponse("CREDITS_EXHAUSTED", aiError.message, {
          cors: ctx.corsHeaders,
          requestId: ctx.requestId,
        });
      }
    }
    throw error; // Re-throw for generic error handling
  }
}

// Create and export the handler with middleware
Deno.serve(
  createHandler(handleGenerateStudyPlan, {
    middleware: [logRequest, requireAuth],
  })
);
