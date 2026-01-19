/**
 * External API Edge Function
 *
 * REST API for external integrations to access ScholarQuest data.
 * Supports GET and POST operations with scope-based access control.
 */

import {
  createHandler,
  logRequest,
  createSuccessResponse,
  createErrorResponse,
  createServiceClient,
  hashApiKey,
  type MiddlewareContext,
} from "../_shared/index.ts";

// ============================================================================
// Types
// ============================================================================

interface TokenData {
  id: string;
  created_by: string;
  is_active: boolean;
  expires_at?: string;
  scopes?: string[];
}

// ============================================================================
// API Key Verification
// ============================================================================

async function verifyApiToken(
  apiKey: string,
  supabase: ReturnType<typeof createServiceClient>
): Promise<{ valid: boolean; tokenData?: TokenData; error?: string }> {
  const tokenHash = await hashApiKey(apiKey);

  const { data: tokenData, error: tokenError } = await supabase
    .from("api_tokens")
    .select("*")
    .eq("token_hash", tokenHash)
    .eq("is_active", true)
    .single();

  if (tokenError || !tokenData) {
    return { valid: false, error: "Invalid API key" };
  }

  // Check expiration
  if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
    return { valid: false, error: "API key expired" };
  }

  // Update last used
  await supabase
    .from("api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", tokenData.id);

  return { valid: true, tokenData };
}

// ============================================================================
// GET Handlers
// ============================================================================

async function handleGet(
  supabase: ReturnType<typeof createServiceClient>,
  endpoint: string,
  url: URL,
  token: TokenData,
  ctx: MiddlewareContext
): Promise<Response> {
  const scopes = token.scopes || [];

  if (!scopes.includes("read") && !scopes.includes("admin")) {
    return createErrorResponse("FORBIDDEN", "Insufficient permissions", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
      details: { required: "read" },
    });
  }

  switch (endpoint) {
    case "students": {
      const classId = url.searchParams.get("class_id");
      let query = supabase
        .from("enrollments")
        .select(`
          student_id,
          enrolled_at,
          class:classes(id, name, grade_band),
          profile:profiles!enrollments_student_id_fkey(full_name, avatar_url),
          student_profile:student_profiles!enrollments_student_id_fkey(xp, coins, current_streak, grade_level)
        `);

      if (classId) {
        query = query.eq("class_id", classId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return createSuccessResponse(
        { data, count: data?.length || 0 },
        { cors: ctx.corsHeaders, requestId: ctx.requestId }
      );
    }

    case "standards": {
      const gradeBand = url.searchParams.get("grade_band");
      const subject = url.searchParams.get("subject");

      let query = supabase.from("nys_standards").select("*");
      if (gradeBand) query = query.eq("grade_band", gradeBand);
      if (subject) query = query.eq("subject", subject);

      const { data, error } = await query;
      if (error) throw error;

      return createSuccessResponse(
        { data, count: data?.length || 0 },
        { cors: ctx.corsHeaders, requestId: ctx.requestId }
      );
    }

    case "mastery": {
      const studentId = url.searchParams.get("student_id");
      const standardId = url.searchParams.get("standard_id");

      let query = supabase
        .from("student_standard_mastery")
        .select(`
          *,
          standard:nys_standards(code, subject, domain, standard_text)
        `);

      if (studentId) query = query.eq("student_id", studentId);
      if (standardId) query = query.eq("standard_id", standardId);

      const { data, error } = await query;
      if (error) throw error;

      return createSuccessResponse(
        { data, count: data?.length || 0 },
        { cors: ctx.corsHeaders, requestId: ctx.requestId }
      );
    }

    case "assignments": {
      const classId = url.searchParams.get("class_id");
      const status = url.searchParams.get("status");

      let query = supabase
        .from("assignments")
        .select(`
          *,
          standard:nys_standards(code, subject, domain, standard_text)
        `);

      if (classId) query = query.eq("class_id", classId);
      if (status) query = query.eq("status", status);

      const { data, error } = await query;
      if (error) throw error;

      return createSuccessResponse(
        { data, count: data?.length || 0 },
        { cors: ctx.corsHeaders, requestId: ctx.requestId }
      );
    }

    case "classes": {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("teacher_id", token.created_by);

      if (error) throw error;

      return createSuccessResponse(
        { data, count: data?.length || 0 },
        { cors: ctx.corsHeaders, requestId: ctx.requestId }
      );
    }

    default:
      return createErrorResponse("NOT_FOUND", "Unknown endpoint", {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
        details: { available_endpoints: ["students", "standards", "mastery", "assignments", "classes"] },
      });
  }
}

// ============================================================================
// POST Handlers
// ============================================================================

async function handlePost(
  supabase: ReturnType<typeof createServiceClient>,
  endpoint: string,
  req: Request,
  token: TokenData,
  ctx: MiddlewareContext
): Promise<Response> {
  const scopes = token.scopes || [];

  if (!scopes.includes("write") && !scopes.includes("admin")) {
    return createErrorResponse("FORBIDDEN", "Insufficient permissions", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
      details: { required: "write" },
    });
  }

  const body = await req.json();

  switch (endpoint) {
    case "assignments": {
      const { title, description, class_id, due_at, xp_reward, coin_reward, standard_id, subject } = body;

      if (!title || !class_id || !due_at) {
        return createErrorResponse("MISSING_REQUIRED_FIELD", "Missing required fields: title, class_id, due_at", {
          cors: ctx.corsHeaders,
          requestId: ctx.requestId,
        });
      }

      const { data, error } = await supabase
        .from("assignments")
        .insert({
          title,
          description,
          class_id,
          due_at,
          xp_reward: xp_reward || 50,
          coin_reward: coin_reward || 10,
          standard_id,
          subject,
        })
        .select()
        .single();

      if (error) throw error;

      return createSuccessResponse(
        { data, message: "Assignment created successfully" },
        { cors: ctx.corsHeaders, requestId: ctx.requestId, status: 201 }
      );
    }

    case "sync-student": {
      // Sync student data from external system
      const { external_id, name, email, grade_level, class_code } = body;

      return createSuccessResponse(
        {
          message: "Student sync endpoint ready",
          received: { external_id, name, email, grade_level, class_code },
        },
        { cors: ctx.corsHeaders, requestId: ctx.requestId }
      );
    }

    default:
      return createErrorResponse("NOT_FOUND", "Unknown endpoint", {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
        details: { available_endpoints: ["assignments", "sync-student"] },
      });
  }
}

// ============================================================================
// Main Handler
// ============================================================================

async function handleExternalApi(
  req: Request,
  ctx: MiddlewareContext
): Promise<Response> {
  const supabase = createServiceClient();

  // Get API key from header
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return createErrorResponse("UNAUTHORIZED", "Missing API key", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
      details: { code: "MISSING_API_KEY" },
    });
  }

  const { valid, tokenData, error } = await verifyApiToken(apiKey, supabase);
  if (!valid || !tokenData) {
    return createErrorResponse("UNAUTHORIZED", error || "Invalid API key", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
      details: { code: error === "API key expired" ? "EXPIRED_API_KEY" : "INVALID_API_KEY" },
    });
  }

  // Parse the URL path
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const endpoint = pathParts[pathParts.length - 1];

  // Route to appropriate handler
  switch (req.method) {
    case "GET":
      return handleGet(supabase, endpoint, url, tokenData, ctx);
    case "POST":
      return handlePost(supabase, endpoint, req, tokenData, ctx);
    default:
      return createErrorResponse("INVALID_REQUEST", "Method not allowed", {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
        status: 405,
      });
  }
}

// Create and export the handler with middleware
Deno.serve(
  createHandler(handleExternalApi, {
    middleware: [logRequest],
  })
);
