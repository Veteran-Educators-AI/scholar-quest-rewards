/**
 * GeoBlox Sync Edge Function
 *
 * Syncs student data between ScholarQuest and GeoBlox.
 * Supports syncing individual students, all students, getting progress, and assigning content.
 */

import {
  createHandler,
  logRequest,
  createSuccessResponse,
  createErrorResponse,
  createServiceClient,
  type MiddlewareContext,
} from "../_shared/index.ts";

// ============================================================================
// Types
// ============================================================================

interface StudentMasteryData {
  standard_id: string;
  mastery_level: string;
  attempts_count: number;
  correct_count: number;
}

interface SyncStudentPayload {
  scholar_student_id: string;
  nickname: string;
  grade: string;
  mastery_data?: StudentMasteryData[];
  standards_progress?: Record<string, unknown>;
}

interface AssignContentPayload {
  class_id: string;
  assigned_by: string;
  content_type: string;
  content_ids: string[];
  title: string;
  description: string;
  due_date: string;
  difficulty_level: number;
}

// ============================================================================
// Constants
// ============================================================================

const GEOBLOX_API_URL = "https://wedghtmkaxkxrrbbeenq.supabase.co/functions/v1/scholar-sync";

// ============================================================================
// Helpers
// ============================================================================

async function fetchStudentMastery(
  supabase: ReturnType<typeof createServiceClient>,
  linkedUserId: string
): Promise<StudentMasteryData[]> {
  const { data: mastery } = await supabase
    .from("student_standard_mastery")
    .select("standard_id, mastery_level, attempts_count, correct_count")
    .eq("student_id", linkedUserId);

  return mastery || [];
}

function buildSyncPayload(
  studentId: string,
  student: Record<string, unknown> | null,
  body: Record<string, unknown>,
  masteryData: StudentMasteryData[]
): SyncStudentPayload {
  return {
    scholar_student_id: studentId,
    nickname: (student?.full_name as string) || (body.nickname as string) || "Student",
    grade: student?.grade_level ? `${student.grade_level}th` : (body.grade as string) || "6th",
    mastery_data: masteryData,
    standards_progress: {
      weak_topics: (student?.weak_topics as unknown[]) || [],
      misconceptions: (student?.misconceptions as unknown[]) || [],
      skill_tags: (student?.skill_tags as unknown[]) || [],
      overall_average: student?.overall_average,
    },
  };
}

async function callGeobloxApi(
  geobloxApiKey: string,
  action: string,
  data: unknown
): Promise<{ ok: boolean; status: number; result: unknown }> {
  const response = await fetch(GEOBLOX_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": geobloxApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, data }),
  });

  const responseText = await response.text();
  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    result = { raw: responseText };
  }

  return { ok: response.ok, status: response.status, result };
}

// ============================================================================
// Action Handlers
// ============================================================================

async function handleSyncStudent(
  supabase: ReturnType<typeof createServiceClient>,
  geobloxApiKey: string,
  body: Record<string, unknown>,
  ctx: MiddlewareContext
): Promise<Response> {
  const studentId = (body.student_id || body.scholar_student_id) as string;

  if (!studentId) {
    return createErrorResponse("MISSING_REQUIRED_FIELD", "student_id is required", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
    });
  }

  console.log(`Syncing student ${studentId} to GeoBlox...`);

  // Fetch student data
  const { data: student } = await supabase
    .from("external_students")
    .select("*")
    .eq("external_id", studentId)
    .maybeSingle();

  // Get mastery data if student is linked
  let masteryData: StudentMasteryData[] = [];
  if (student?.linked_user_id) {
    masteryData = await fetchStudentMastery(supabase, student.linked_user_id);
  }

  const payload = buildSyncPayload(studentId, student, body, masteryData);
  const { ok, status, result } = await callGeobloxApi(geobloxApiKey, "sync_student", payload);

  if (!ok) {
    console.error("GeoBlox sync_student error:", result);
    return createErrorResponse("EXTERNAL_SERVICE_ERROR", "Failed to sync student to GeoBlox", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
      status: 502,
      details: { geoblox_status: status, response: result },
    });
  }

  console.log("Sync student successful:", result);

  await supabase.from("webhook_event_logs").insert({
    event_type: "geoblox_sync_student",
    status: "success",
    payload: { student_id: studentId },
    response: result,
  });

  return createSuccessResponse(
    { student_id: studentId, geoblox_response: result },
    { cors: ctx.corsHeaders, requestId: ctx.requestId }
  );
}

async function handleSyncAll(
  supabase: ReturnType<typeof createServiceClient>,
  geobloxApiKey: string,
  ctx: MiddlewareContext
): Promise<Response> {
  console.log("Syncing all students to GeoBlox...");

  const { data: students, error } = await supabase
    .from("external_students")
    .select("external_id, full_name, grade_level, weak_topics, misconceptions, skill_tags, overall_average, linked_user_id");

  if (error || !students) {
    return createErrorResponse("DATABASE_ERROR", "Failed to fetch students", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
      details: { message: error?.message },
    });
  }

  const results: Array<{ student_id: string; status: string; http_status?: number; error?: string }> = [];

  for (const student of students) {
    let masteryData: StudentMasteryData[] = [];
    if (student.linked_user_id) {
      masteryData = await fetchStudentMastery(supabase, student.linked_user_id);
    }

    const payload: SyncStudentPayload = {
      scholar_student_id: student.external_id,
      nickname: student.full_name || "Student",
      grade: student.grade_level ? `${student.grade_level}th` : "6th",
      mastery_data: masteryData,
      standards_progress: {
        weak_topics: student.weak_topics || [],
        misconceptions: student.misconceptions || [],
        skill_tags: student.skill_tags || [],
        overall_average: student.overall_average,
      },
    };

    try {
      const { ok, status } = await callGeobloxApi(geobloxApiKey, "sync_student", payload);
      results.push({
        student_id: student.external_id,
        status: ok ? "synced" : "failed",
        http_status: status,
      });
    } catch (err) {
      results.push({
        student_id: student.external_id,
        status: "error",
        error: err instanceof Error ? err.message : "Unknown",
      });
    }
  }

  const successCount = results.filter((r) => r.status === "synced").length;

  await supabase.from("webhook_event_logs").insert({
    event_type: "geoblox_sync_all",
    status: successCount === students.length ? "success" : "partial",
    payload: { total: students.length, synced: successCount },
  });

  return createSuccessResponse(
    { total: students.length, synced: successCount, results },
    { cors: ctx.corsHeaders, requestId: ctx.requestId }
  );
}

async function handleGetProgress(
  geobloxApiKey: string,
  body: Record<string, unknown>,
  ctx: MiddlewareContext
): Promise<Response> {
  const studentId = (body.student_id || body.scholar_student_id) as string;

  if (!studentId) {
    return createErrorResponse("MISSING_REQUIRED_FIELD", "student_id is required", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
    });
  }

  console.log(`Getting GeoBlox progress for student ${studentId}...`);

  const { ok, status, result } = await callGeobloxApi(geobloxApiKey, "get_student_progress", {
    scholar_student_id: studentId,
  });

  if (!ok) {
    return createErrorResponse("EXTERNAL_SERVICE_ERROR", "Failed to get progress from GeoBlox", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
      status: 502,
      details: { geoblox_status: status, response: result },
    });
  }

  return createSuccessResponse(
    { student_id: studentId, progress: result },
    { cors: ctx.corsHeaders, requestId: ctx.requestId }
  );
}

async function handleAssignContent(
  supabase: ReturnType<typeof createServiceClient>,
  geobloxApiKey: string,
  body: AssignContentPayload,
  ctx: MiddlewareContext
): Promise<Response> {
  const required: (keyof AssignContentPayload)[] = [
    "class_id",
    "assigned_by",
    "content_type",
    "content_ids",
    "title",
    "description",
    "due_date",
    "difficulty_level",
  ];
  const missing = required.filter((f) => !body[f]);

  if (missing.length > 0) {
    return createErrorResponse("MISSING_REQUIRED_FIELD", `Missing required fields: ${missing.join(", ")}`, {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
    });
  }

  console.log(`Assigning content to class ${body.class_id}...`);

  const { ok, status, result } = await callGeobloxApi(geobloxApiKey, "assign_content", body);

  if (!ok) {
    return createErrorResponse("EXTERNAL_SERVICE_ERROR", "Failed to assign content via GeoBlox", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
      status: 502,
      details: { geoblox_status: status, response: result },
    });
  }

  await supabase.from("webhook_event_logs").insert({
    event_type: "geoblox_assign_content",
    status: "success",
    payload: body,
    response: result,
  });

  return createSuccessResponse(
    { geoblox_response: result },
    { cors: ctx.corsHeaders, requestId: ctx.requestId }
  );
}

// ============================================================================
// Main Handler
// ============================================================================

async function handleGeobloxSync(
  req: Request,
  ctx: MiddlewareContext
): Promise<Response> {
  const geobloxApiKey = Deno.env.get("GEOBLOX_API_KEY");

  if (!geobloxApiKey) {
    return createErrorResponse("SERVICE_UNAVAILABLE", "GEOBLOX_API_KEY not configured", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
    });
  }

  const supabase = createServiceClient();
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "sync_student";

  // Parse body for actions that need it
  let body: Record<string, unknown> = {};
  if (req.method === "POST") {
    try {
      body = await req.json();
    } catch {
      // No body or invalid JSON
    }
  }

  switch (action) {
    case "sync_student":
      return handleSyncStudent(supabase, geobloxApiKey, body, ctx);

    case "sync_all":
      return handleSyncAll(supabase, geobloxApiKey, ctx);

    case "get_progress":
      return handleGetProgress(geobloxApiKey, body, ctx);

    case "assign_content":
      return handleAssignContent(supabase, geobloxApiKey, body as unknown as AssignContentPayload, ctx);

    default:
      return createErrorResponse("INVALID_REQUEST", "Invalid action. Use: sync_student, sync_all, get_progress, or assign_content", {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
  }
}

// Create and export the handler with middleware
Deno.serve(
  createHandler(handleGeobloxSync, {
    middleware: [logRequest],
  })
);
