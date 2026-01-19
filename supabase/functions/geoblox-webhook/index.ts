/**
 * GeoBlox Webhook Edge Function
 *
 * Handles incoming webhooks from the GeoBlox integration.
 * Actions: create_practice_set, create_skill_game, update_student_weaknesses,
 * notify_student, sync_mastery_update.
 */

import {
  createHandler,
  logRequest,
  parseBody,
  createSuccessResponse,
  createErrorResponse,
  createServiceClient,
  validateApiKey,
  WebhookPayloadSchema,
  REWARDS,
  SOURCE_APPS,
  type MiddlewareContext,
  type WebhookPayload,
  type PracticeSetData,
  type SkillGameData,
  type MasteryUpdate,
} from "../_shared/index.ts";

/**
 * Practice question structure for mapping.
 */
interface PracticeQuestionInput {
  prompt: string;
  question_type?: string;
  options?: string[];
  answer_key: unknown;
  hint?: string;
  difficulty?: number;
  skill_tag?: string;
}

/**
 * Data for assigning content to a student.
 */
interface ContentAssignmentData {
  student_id: string;
  content_type: "practice_set" | "skill_game" | "assignment";
  content_id: string;
  notify_student?: boolean;
  message?: string;
}

/**
 * Data for updating student weaknesses.
 */
interface WeaknessUpdateData {
  student_id: string;
  weak_topics?: string[];
  misconceptions?: Record<string, string>[];
  remediation_recommendations?: string[];
}

/**
 * Middleware to validate GeoBlox API key.
 */
async function requireGeoBloxApiKey(
  req: Request,
  ctx: MiddlewareContext
): Promise<Response | null> {
  const apiKey = req.headers.get("x-api-key");
  const expectedKeyHash = Deno.env.get("GEOBLOX_API_KEY_HASH");
  const expectedKey = Deno.env.get("GEOBLOX_API_KEY");

  // Try hash-based validation first, fall back to direct comparison
  if (expectedKeyHash) {
    if (!apiKey || !await validateApiKey(apiKey, expectedKeyHash)) {
      return createErrorResponse("UNAUTHORIZED", "Invalid API key", {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }
  } else if (expectedKey) {
    if (!apiKey || apiKey !== expectedKey) {
      return createErrorResponse("UNAUTHORIZED", "Invalid API key", {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }
  } else {
    console.error("No GEOBLOX_API_KEY or GEOBLOX_API_KEY_HASH configured");
    return createErrorResponse("SERVICE_UNAVAILABLE", "API key not configured", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
    });
  }

  return null; // Continue to next middleware
}

/**
 * Handles creating a practice set from GeoBlox.
 */
async function handleCreatePracticeSet(
  supabase: ReturnType<typeof createServiceClient>,
  data: PracticeSetData
): Promise<{ success: boolean; practice_set_id?: string; error?: string }> {
  // Create practice set
  const { data: practiceSet, error: setError } = await supabase
    .from("practice_sets")
    .insert({
      student_id: data.student_id,
      external_ref: data.external_ref,
      title: data.title,
      description: data.description,
      skill_tags: data.skill_tags,
      source: SOURCE_APPS.GEOBLOX,
      status: "pending",
      total_questions: data.questions?.length || 0,
      xp_reward: data.xp_reward || REWARDS.PRACTICE_SET_XP,
      coin_reward: data.coin_reward || REWARDS.PRACTICE_SET_COINS,
    })
    .select()
    .single();

  if (setError) {
    console.error("Error creating practice set:", setError);
    return { success: false, error: setError.message };
  }

  // Create questions for the practice set
  if (data.questions && data.questions.length > 0) {
    const questionsToInsert = data.questions.map((q: PracticeQuestionInput, index: number) => ({
      practice_set_id: practiceSet.id,
      prompt: q.prompt,
      question_type: q.question_type || "multiple_choice",
      options: q.options ? JSON.stringify(q.options) : null,
      answer_key: q.answer_key,
      hint: q.hint,
      difficulty: q.difficulty || 1,
      skill_tag: q.skill_tag,
      order_index: index,
    }));

    const { error: questionsError } = await supabase
      .from("practice_questions")
      .insert(questionsToInsert);

    if (questionsError) {
      console.error("Error creating questions:", questionsError);
    }
  }

  // Notify student
  await supabase.from("notifications").insert({
    user_id: data.student_id,
    type: "new_practice",
    title: "New Practice Set!",
    message: `GeoBlox created a personalized practice set for you: "${data.title}"`,
    icon: "book",
    data: { practice_set_id: practiceSet.id, source: SOURCE_APPS.GEOBLOX },
  });

  return { success: true, practice_set_id: practiceSet.id };
}

/**
 * Handles creating a skill game from GeoBlox.
 */
async function handleCreateSkillGame(
  supabase: ReturnType<typeof createServiceClient>,
  data: SkillGameData
): Promise<{ success: boolean; game_id?: string; error?: string }> {
  const { data: skillGame, error: gameError } = await supabase
    .from("skill_games")
    .insert({
      student_id: data.student_id,
      external_ref: data.external_ref,
      title: data.title,
      game_type: data.game_type,
      skill_tag: data.skill_tag,
      difficulty: data.difficulty || 1,
      game_data: data.game_data,
      source: SOURCE_APPS.GEOBLOX,
      status: "available",
      xp_reward: data.xp_reward || REWARDS.GAME_XP,
      coin_reward: data.coin_reward || REWARDS.GAME_COINS,
    })
    .select()
    .single();

  if (gameError) {
    console.error("Error creating skill game:", gameError);
    return { success: false, error: gameError.message };
  }

  // Notify student
  await supabase.from("notifications").insert({
    user_id: data.student_id,
    type: "new_game",
    title: "New Skill Game!",
    message: `GeoBlox created a game for you: "${data.title}"`,
    icon: "gamepad",
    data: { game_id: skillGame.id, source: SOURCE_APPS.GEOBLOX },
  });

  return { success: true, game_id: skillGame.id };
}

/**
 * Handles updating student weaknesses.
 */
async function handleUpdateWeaknesses(
  supabase: ReturnType<typeof createServiceClient>,
  data: WeaknessUpdateData
): Promise<{ success: boolean }> {
  const { student_id, weak_topics, misconceptions, remediation_recommendations } = data;

  // Update external_students if exists
  const { error: externalError } = await supabase
    .from("external_students")
    .update({
      weak_topics,
      misconceptions,
      remediation_recommendations,
      updated_at: new Date().toISOString(),
    })
    .eq("linked_user_id", student_id);

  if (externalError) {
    console.error("Error updating external student:", externalError);
  }

  // Update student_profiles weaknesses
  if (weak_topics && weak_topics.length > 0) {
    await supabase
      .from("student_profiles")
      .update({
        weaknesses: weak_topics,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", student_id);
  }

  return { success: true };
}

/**
 * Handles notifying a student.
 */
async function handleNotifyStudent(
  supabase: ReturnType<typeof createServiceClient>,
  data: ContentAssignmentData
): Promise<{ success: boolean }> {
  await supabase.from("notifications").insert({
    user_id: data.student_id,
    type: "geoblox_message",
    title: "Message from GeoBlox",
    message: data.message || "You have new personalized content available!",
    icon: "mail",
    data: {
      content_type: data.content_type,
      content_id: data.content_id,
      source: SOURCE_APPS.GEOBLOX,
    },
  });

  return { success: true };
}

/**
 * Handles syncing mastery updates.
 */
async function handleSyncMastery(
  supabase: ReturnType<typeof createServiceClient>,
  data: MasteryUpdate
): Promise<{ success: boolean }> {
  const { student_id, standard_code, mastery_level, attempts_count, correct_count } = data;

  // Find standard by code
  const { data: standard } = await supabase
    .from("nys_standards")
    .select("id")
    .eq("code", standard_code)
    .single();

  if (standard) {
    await supabase
      .from("student_standard_mastery")
      .upsert(
        {
          student_id,
          standard_id: standard.id,
          mastery_level,
          attempts_count,
          correct_count,
          last_attempt_at: new Date().toISOString(),
          mastered_at: mastery_level === "mastered" ? new Date().toISOString() : null,
        },
        { onConflict: "student_id,standard_id" }
      );
  }

  return { success: true };
}

/**
 * Main handler for GeoBlox webhooks.
 */
async function handleGeoBloxWebhook(
  _req: Request,
  ctx: MiddlewareContext
): Promise<Response> {
  const payload = ctx.body as WebhookPayload;
  const { action, data } = payload;

  console.log(`GeoBlox webhook received action: ${action}`);

  const supabase = createServiceClient();

  switch (action) {
    case "create_practice_set": {
      const result = await handleCreatePracticeSet(supabase, data as unknown as PracticeSetData);
      if (!result.success) {
        return createErrorResponse("DATABASE_ERROR", result.error || "Failed to create practice set", {
          cors: ctx.corsHeaders,
          requestId: ctx.requestId,
        });
      }
      return createSuccessResponse({ practice_set_id: result.practice_set_id }, {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    case "create_skill_game": {
      const result = await handleCreateSkillGame(supabase, data as unknown as SkillGameData);
      if (!result.success) {
        return createErrorResponse("DATABASE_ERROR", result.error || "Failed to create skill game", {
          cors: ctx.corsHeaders,
          requestId: ctx.requestId,
        });
      }
      return createSuccessResponse({ game_id: result.game_id }, {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    case "update_student_weaknesses": {
      const result = await handleUpdateWeaknesses(supabase, data as unknown as WeaknessUpdateData);
      return createSuccessResponse(result, {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    case "notify_student": {
      const result = await handleNotifyStudent(supabase, data as unknown as ContentAssignmentData);
      return createSuccessResponse(result, {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    case "sync_mastery_update": {
      const result = await handleSyncMastery(supabase, data as unknown as MasteryUpdate);
      return createSuccessResponse(result, {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    default:
      return createErrorResponse("INVALID_REQUEST", `Unknown action: ${action}`, {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
  }
}

// Create and export the handler with middleware
Deno.serve(
  createHandler(handleGeoBloxWebhook, {
    middleware: [logRequest, requireGeoBloxApiKey, parseBody(WebhookPayloadSchema)],
  })
);
