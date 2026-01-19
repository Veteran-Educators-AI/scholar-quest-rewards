/**
 * Sync to NYCologic Edge Function
 *
 * Syncs data from ScholarQuest to NYCologic AI parent app.
 * Supports assignment completed, student progress, badge earned, and mastery updates.
 */

import {
  createHandler,
  logRequest,
  parseBody,
  createSuccessResponse,
  createErrorResponse,
  type MiddlewareContext,
} from "../_shared/index.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ============================================================================
// Types & Validation
// ============================================================================

const SyncTypeSchema = z.enum([
  "assignment_completed",
  "student_progress",
  "badge_earned",
  "mastery_update",
]);

const SyncPayloadSchema = z.object({
  type: SyncTypeSchema,
  data: z.record(z.unknown()),
});

type SyncPayload = z.infer<typeof SyncPayloadSchema>;

// ============================================================================
// Main Handler
// ============================================================================

async function handleSyncToNycologic(
  _req: Request,
  ctx: MiddlewareContext
): Promise<Response> {
  const nycologicApiUrl = Deno.env.get("NYCOLOGIC_API_URL");

  if (!nycologicApiUrl) {
    return createErrorResponse("SERVICE_UNAVAILABLE", "NYCOLOGIC_API_URL not configured", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
    });
  }

  const payload = ctx.body as SyncPayload;
  console.log(`Syncing ${payload.type} to NYCologic AI...`);

  // Send data to NYCologic AI parent app
  const response = await fetch(nycologicApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-source-app": "scholar-app",
    },
    body: JSON.stringify({
      source: "scholar-app",
      timestamp: new Date().toISOString(),
      event_type: payload.type,
      data: payload.data,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("NYCologic API error:", errorText);
    return createErrorResponse("EXTERNAL_SERVICE_ERROR", "Failed to sync with NYCologic", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
      status: 502,
      details: { nycologic_status: response.status, response: errorText },
    });
  }

  const result = await response.json();
  console.log("Sync successful:", result);

  return createSuccessResponse(
    { synced_at: new Date().toISOString(), nycologic_response: result },
    { cors: ctx.corsHeaders, requestId: ctx.requestId }
  );
}

// Create and export the handler with middleware
Deno.serve(
  createHandler(handleSyncToNycologic, {
    middleware: [logRequest, parseBody(SyncPayloadSchema)],
  })
);
