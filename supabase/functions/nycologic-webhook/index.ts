/**
 * NYCologic Webhook Edge Function
 *
 * Handles incoming webhooks from NYCologic AI integration.
 * Actions: assignment, student_profile, status_query, remediation.
 */

import {
  createHandler,
  logRequest,
  createSuccessResponse,
  createErrorResponse,
  createServiceClient,
  hashApiKey,
  REWARDS,
  SOURCE_APPS,
  type MiddlewareContext,
} from "../_shared/index.ts";

// ============================================================================
// Types
// ============================================================================

interface AssignmentQuestion {
  prompt: string;
  question_type: "multiple_choice" | "short_answer" | "numeric" | "drag_order" | "matching";
  options?: string[];
  answer_key: unknown;
  hint?: string;
  difficulty?: number;
  skill_tag?: string;
}

interface AssignmentPayload {
  type: "assignment";
  data: {
    external_ref: string;
    class_code: string;
    title: string;
    subject?: string;
    description?: string;
    due_at: string;
    printable_url?: string;
    xp_reward?: number;
    coin_reward?: number;
    questions?: AssignmentQuestion[];
  };
}

interface StudentProfilePayload {
  type: "student_profile";
  data: {
    user_id: string;
    grade_level?: number;
    reading_level?: string;
    math_level?: string;
    skill_tags?: string[];
    strengths?: string[];
    weaknesses?: string[];
    accommodations?: string[];
  };
}

interface StatusQueryPayload {
  type: "status_query";
  data: {
    external_ref: string;
  };
}

interface RemediationPayload {
  type: "remediation";
  data: {
    student_id: string;
    external_ref?: string;
    title: string;
    description?: string;
    skill_tags: string[];
    printable_url?: string;
    xp_reward?: number;
    coin_reward?: number;
    questions: AssignmentQuestion[];
  };
}

type WebhookPayload = AssignmentPayload | StudentProfilePayload | StatusQueryPayload | RemediationPayload;

// ============================================================================
// API Key Verification
// ============================================================================

async function verifyApiKey(
  apiKey: string,
  supabase: ReturnType<typeof createServiceClient>
): Promise<boolean> {
  const tokenHash = await hashApiKey(apiKey);

  console.log("Checking API key, hash:", tokenHash.substring(0, 20) + "...");

  // Check integration_tokens table first
  const { data: token } = await supabase
    .from("integration_tokens")
    .select("id, is_active")
    .eq("token_hash", tokenHash)
    .eq("is_active", true)
    .single();

  if (token) {
    await supabase
      .from("integration_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", token.id);
    console.log("Valid token found in integration_tokens");
    return true;
  }

  // Also check api_tokens table
  const { data: apiToken } = await supabase
    .from("api_tokens")
    .select("id, is_active")
    .eq("token_hash", tokenHash)
    .eq("is_active", true)
    .single();

  if (apiToken) {
    await supabase
      .from("api_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", apiToken.id);
    console.log("Valid token found in api_tokens");
    return true;
  }

  // Legacy support: check if the plain API key matches a token_hash directly
  const { data: legacyToken } = await supabase
    .from("integration_tokens")
    .select("id, is_active")
    .eq("token_hash", apiKey)
    .eq("is_active", true)
    .single();

  if (legacyToken) {
    await supabase
      .from("integration_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", legacyToken.id);
    console.log("Valid legacy token found");
    return true;
  }

  console.log("No valid token found for hash:", tokenHash.substring(0, 20) + "...");
  return false;
}

// ============================================================================
// Action Handlers
// ============================================================================

async function handleAssignment(
  supabase: ReturnType<typeof createServiceClient>,
  data: AssignmentPayload["data"]
): Promise<Response> {
  // Find class by code
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("id")
    .eq("class_code", data.class_code)
    .single();

  if (classError || !classData) {
    return createErrorResponse("NOT_FOUND", `Class not found: ${data.class_code}`);
  }

  // Create assignment
  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .insert({
      class_id: classData.id,
      external_ref: data.external_ref,
      title: data.title,
      subject: data.subject,
      description: data.description,
      due_at: data.due_at,
      printable_url: data.printable_url,
      xp_reward: data.xp_reward || 50,
      coin_reward: data.coin_reward || 10,
      status: "active",
    })
    .select("id")
    .single();

  if (assignmentError) {
    return createErrorResponse("DATABASE_ERROR", `Failed to create assignment: ${assignmentError.message}`);
  }

  // Create questions if provided
  if (data.questions && data.questions.length > 0) {
    const questionsToInsert = data.questions.map((q: AssignmentQuestion, index: number) => ({
      assignment_id: assignment.id,
      prompt: q.prompt,
      question_type: q.question_type,
      options: q.options ? JSON.stringify(q.options) : null,
      answer_key: q.answer_key,
      hint: q.hint,
      difficulty: q.difficulty || 1,
      skill_tag: q.skill_tag,
      order_index: index,
    }));

    await supabase.from("questions").insert(questionsToInsert);
  }

  return createSuccessResponse({
    assignment_id: assignment.id,
    status: "received",
  });
}

async function handleStudentProfile(
  supabase: ReturnType<typeof createServiceClient>,
  data: StudentProfilePayload["data"]
): Promise<Response> {
  const { error } = await supabase
    .from("student_profiles")
    .update({
      grade_level: data.grade_level,
      reading_level: data.reading_level,
      math_level: data.math_level,
      skill_tags: data.skill_tags,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      accommodations: data.accommodations,
    })
    .eq("user_id", data.user_id);

  if (error) {
    return createErrorResponse("DATABASE_ERROR", `Failed to update student profile: ${error.message}`);
  }

  return createSuccessResponse({ status: "profile_updated" });
}

async function handleStatusQuery(
  supabase: ReturnType<typeof createServiceClient>,
  data: StatusQueryPayload["data"]
): Promise<Response> {
  const { data: assignment, error } = await supabase
    .from("assignments")
    .select(`
      id,
      status,
      attempts (
        id,
        student_id,
        status,
        score,
        submitted_at,
        verified_at
      )
    `)
    .eq("external_ref", data.external_ref)
    .single();

  if (error || !assignment) {
    return createErrorResponse("NOT_FOUND", `Assignment not found: ${data.external_ref}`);
  }

  return createSuccessResponse({
    assignment_id: assignment.id,
    status: assignment.status,
    attempts: assignment.attempts,
  });
}

async function handleRemediation(
  supabase: ReturnType<typeof createServiceClient>,
  data: RemediationPayload["data"]
): Promise<Response> {
  // Verify student exists
  const { data: studentProfile, error: studentError } = await supabase
    .from("student_profiles")
    .select("user_id")
    .eq("user_id", data.student_id)
    .single();

  if (studentError || !studentProfile) {
    return createErrorResponse("NOT_FOUND", `Student not found: ${data.student_id}`);
  }

  // Create practice set
  const { data: practiceSet, error: practiceError } = await supabase
    .from("practice_sets")
    .insert({
      student_id: data.student_id,
      title: data.title,
      description: data.description || `Practice exercises to strengthen: ${data.skill_tags.join(", ")}`,
      skill_tags: data.skill_tags,
      source: SOURCE_APPS.NYCOLOGIC,
      external_ref: data.external_ref,
      printable_url: data.printable_url,
      xp_reward: data.xp_reward || REWARDS.PRACTICE_SET_XP,
      coin_reward: data.coin_reward || 5,
      total_questions: data.questions.length,
      status: "pending",
    })
    .select("id")
    .single();

  if (practiceError) {
    console.error("Failed to create practice set:", practiceError);
    return createErrorResponse("DATABASE_ERROR", `Failed to create practice set: ${practiceError.message}`);
  }

  // Create practice questions
  if (data.questions && data.questions.length > 0) {
    const questionsToInsert = data.questions.map((q: AssignmentQuestion, index: number) => ({
      practice_set_id: practiceSet.id,
      prompt: q.prompt,
      question_type: q.question_type,
      options: q.options || null,
      answer_key: q.answer_key,
      hint: q.hint,
      difficulty: q.difficulty || 1,
      skill_tag: q.skill_tag,
      order_index: index,
    }));

    const { error: questionsError } = await supabase.from("practice_questions").insert(questionsToInsert);

    if (questionsError) {
      console.error("Failed to create practice questions:", questionsError);
      await supabase.from("practice_sets").delete().eq("id", practiceSet.id);
      return createErrorResponse("DATABASE_ERROR", `Failed to create practice questions: ${questionsError.message}`);
    }
  }

  // Create notification for the student
  const skillList = data.skill_tags.slice(0, 2).join(" & ");
  const xpReward = data.xp_reward || REWARDS.PRACTICE_SET_XP;
  const coinReward = data.coin_reward || 5;

  const { error: notifError } = await supabase.from("notifications").insert({
    user_id: data.student_id,
    type: "remediation",
    title: "New Practice Available!",
    message: `You have a new practice set: "${data.title}" to help with ${skillList}. Complete it to earn ${xpReward} XP and ${coinReward} coins!`,
    icon: "book",
    data: {
      practice_set_id: practiceSet.id,
      skill_tags: data.skill_tags,
      xp_reward: xpReward,
      coin_reward: coinReward,
    },
  });

  if (notifError) {
    console.error("Failed to create notification:", notifError);
  }

  // Update student weaknesses if skill_tags provided
  if (data.skill_tags && data.skill_tags.length > 0) {
    const { data: currentProfile } = await supabase
      .from("student_profiles")
      .select("weaknesses")
      .eq("user_id", data.student_id)
      .single();

    const existingWeaknesses = (currentProfile?.weaknesses as string[]) || [];
    const newWeaknesses = [...new Set([...existingWeaknesses, ...data.skill_tags])];

    await supabase.from("student_profiles").update({ weaknesses: newWeaknesses }).eq("user_id", data.student_id);
  }

  // Auto-generate skill games from remediation
  const gameTypes = ["flashcard_battle", "timed_challenge", "matching_puzzle"];
  for (const skillTag of data.skill_tags.slice(0, 2)) {
    const gameType = gameTypes[Math.floor(Math.random() * gameTypes.length)];
    const gameData =
      gameType === "flashcard_battle"
        ? {
            cards: data.questions.slice(0, 6).map((q: AssignmentQuestion, i: number) => ({
              id: `card-${i}`,
              front: q.prompt,
              back: String(q.answer_key),
              hint: q.hint,
            })),
          }
        : gameType === "timed_challenge"
          ? {
              questions: data.questions.slice(0, 6).map((q: AssignmentQuestion, i: number) => ({
                id: `q-${i}`,
                prompt: q.prompt,
                options: q.options || [],
                correctAnswer: String(q.answer_key),
                hint: q.hint,
              })),
              timePerQuestion: 15,
            }
          : {
              pairs: data.questions.slice(0, 6).map((q: AssignmentQuestion, i: number) => ({
                id: `pair-${i}`,
                term: q.prompt.substring(0, 50),
                definition: String(q.answer_key),
              })),
            };

    await supabase.from("skill_games").insert({
      student_id: data.student_id,
      game_type: gameType,
      skill_tag: skillTag,
      title: `${skillTag} ${gameType === "flashcard_battle" ? "Flashcards" : gameType === "timed_challenge" ? "Challenge" : "Match"}`,
      difficulty: Math.min(3, Math.max(1, data.questions[0]?.difficulty || 2)),
      game_data: gameData,
      xp_reward: 15,
      coin_reward: 5,
      source: SOURCE_APPS.NYCOLOGIC,
      external_ref: data.external_ref,
    });
  }

  console.log(`Created remediation practice set ${practiceSet.id} for student ${data.student_id}`);

  return createSuccessResponse({
    practice_set_id: practiceSet.id,
    questions_count: data.questions.length,
    status: "remediation_created",
    notification_sent: !notifError,
  });
}

// ============================================================================
// Main Handler
// ============================================================================

async function handleNYCologicWebhook(req: Request, ctx: MiddlewareContext): Promise<Response> {
  const supabase = createServiceClient();

  // Verify API key
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return createErrorResponse("UNAUTHORIZED", "Missing API key", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
    });
  }

  const isValid = await verifyApiKey(apiKey, supabase);
  if (!isValid) {
    return createErrorResponse("UNAUTHORIZED", "Invalid or inactive API key", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
    });
  }

  // Parse payload
  const payload: WebhookPayload = await req.json();

  console.log(`NYCologic webhook received: ${payload.type}`);

  // Route to appropriate handler
  switch (payload.type) {
    case "assignment": {
      const response = await handleAssignment(supabase, (payload as AssignmentPayload).data);
      return response;
    }

    case "student_profile": {
      const response = await handleStudentProfile(supabase, (payload as StudentProfilePayload).data);
      return response;
    }

    case "status_query": {
      const response = await handleStatusQuery(supabase, (payload as StatusQueryPayload).data);
      return response;
    }

    case "remediation": {
      const response = await handleRemediation(supabase, (payload as RemediationPayload).data);
      return response;
    }

    default:
      return createErrorResponse("INVALID_REQUEST", "Unknown payload type", {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
  }
}

// Create and export the handler with middleware
Deno.serve(
  createHandler(handleNYCologicWebhook, {
    middleware: [logRequest],
  })
);
