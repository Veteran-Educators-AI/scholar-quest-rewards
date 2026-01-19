/**
 * Generate Invite Edge Function
 *
 * Generates student invite links for teachers to share.
 * Supports single and bulk invite generation, listing, and revoking.
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

interface InviteRequest {
  action?: "generate" | "bulk_generate" | "list" | "revoke";
  student_name?: string;
  student_email?: string;
  external_ref?: string;
  class_id?: string;
  expires_days?: number;
  students?: Array<{
    name?: string;
    email?: string;
    external_ref?: string;
  }>;
  token?: string;
  id?: string;
}

interface InviteResult {
  id: string;
  token: string;
  invite_url: string;
  student_name?: string;
  student_email?: string;
  expires_at: string;
}

// ============================================================================
// Utilities
// ============================================================================

function generateToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let token = "";
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  for (const byte of array) {
    token += chars[byte % chars.length];
  }
  return token;
}

// ============================================================================
// Main Handler
// ============================================================================

async function handleGenerateInvite(
  req: Request,
  ctx: MiddlewareContext
): Promise<Response> {
  const supabase = createServiceClient();

  // Validate API key
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return createErrorResponse("UNAUTHORIZED", "Missing API key", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
    });
  }

  // Verify API token and get teacher ID
  const tokenHash = await hashApiKey(apiKey);

  const { data: tokenData, error: tokenError } = await supabase
    .from("integration_tokens")
    .select("id, created_by, is_active")
    .eq("token_hash", tokenHash)
    .single();

  if (tokenError || !tokenData?.is_active) {
    return createErrorResponse("UNAUTHORIZED", "Invalid or inactive API key", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
    });
  }

  // Use created_by if set, otherwise use the token's own ID as a system identifier
  const teacherId = tokenData.created_by || tokenData.id;
  const body: InviteRequest = await req.json();
  const action = body.action || "generate";

  // Get base URL for invite links
  const baseUrl = Deno.env.get("INVITE_BASE_URL") || "https://scholar-quest-rewards.lovable.app";

  // Handle different actions
  if (action === "generate") {
    const { student_name, student_email, external_ref, class_id, expires_days = 30 } = body;

    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expires_days);

    const { data: invite, error } = await supabase
      .from("student_invite_links")
      .insert({
        token,
        teacher_id: teacherId,
        student_name,
        student_email,
        external_ref,
        class_id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      return createErrorResponse("INTERNAL_ERROR", `Failed to create invite: ${error.message}`, {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    const result: InviteResult = {
      id: invite.id,
      token: invite.token,
      invite_url: `${baseUrl}/invite/${invite.token}`,
      student_name: invite.student_name,
      expires_at: invite.expires_at,
    };

    return createSuccessResponse(
      { invite: result },
      { cors: ctx.corsHeaders, requestId: ctx.requestId }
    );
  }

  if (action === "bulk_generate") {
    const { students, class_id, expires_days = 30 } = body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return createErrorResponse("VALIDATION_ERROR", "students array is required", {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expires_days);

    const invites = students.map((student: { name?: string; email?: string; external_ref?: string }) => ({
      token: generateToken(),
      teacher_id: teacherId,
      student_name: student.name,
      student_email: student.email,
      external_ref: student.external_ref,
      class_id,
      expires_at: expiresAt.toISOString(),
    }));

    const { data: createdInvites, error } = await supabase
      .from("student_invite_links")
      .insert(invites)
      .select();

    if (error) {
      return createErrorResponse("INTERNAL_ERROR", `Failed to create invites: ${error.message}`, {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    const results: InviteResult[] = (createdInvites || []).map((inv: {
      id: string;
      token: string;
      student_name?: string;
      student_email?: string;
      expires_at: string;
    }) => ({
      id: inv.id,
      token: inv.token,
      invite_url: `${baseUrl}/invite/${inv.token}`,
      student_name: inv.student_name,
      student_email: inv.student_email,
      expires_at: inv.expires_at,
    }));

    return createSuccessResponse(
      { count: results.length, invites: results },
      { cors: ctx.corsHeaders, requestId: ctx.requestId }
    );
  }

  if (action === "list") {
    const { data: invites, error } = await supabase
      .from("student_invite_links")
      .select("*")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });

    if (error) {
      return createErrorResponse("INTERNAL_ERROR", `Failed to fetch invites: ${error.message}`, {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    const results = (invites || []).map((inv: {
      id: string;
      token: string;
      student_name?: string;
      student_email?: string;
      expires_at: string;
      used_at?: string;
      created_at: string;
    }) => ({
      ...inv,
      invite_url: `${baseUrl}/invite/${inv.token}`,
      is_valid: !inv.used_at && new Date(inv.expires_at) > new Date(),
    }));

    return createSuccessResponse(
      { invites: results },
      { cors: ctx.corsHeaders, requestId: ctx.requestId }
    );
  }

  if (action === "revoke") {
    const { token, id } = body;

    if (!token && !id) {
      return createErrorResponse("VALIDATION_ERROR", "token or id is required", {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    let query = supabase
      .from("student_invite_links")
      .delete()
      .eq("teacher_id", teacherId);

    if (id) {
      query = query.eq("id", id);
    } else if (token) {
      query = query.eq("token", token);
    }

    const { error } = await query;

    if (error) {
      return createErrorResponse("INTERNAL_ERROR", `Failed to revoke invite: ${error.message}`, {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    return createSuccessResponse(
      { message: "Invite revoked" },
      { cors: ctx.corsHeaders, requestId: ctx.requestId }
    );
  }

  return createErrorResponse("VALIDATION_ERROR", `Unknown action: ${action}`, {
    cors: ctx.corsHeaders,
    requestId: ctx.requestId,
  });
}

// Create and export the handler with middleware
Deno.serve(
  createHandler(handleGenerateInvite, {
    middleware: [logRequest],
  })
);
