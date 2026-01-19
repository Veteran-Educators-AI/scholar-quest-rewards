/**
 * Send Password Reset Confirmation Edge Function
 *
 * Sends a confirmation email when a user's password has been changed.
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

const PasswordResetRequestSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>;

// ============================================================================
// Email Template
// ============================================================================

function buildPasswordResetEmailHtml(name?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Nunito', Arial, sans-serif; background-color: #f8f9fa; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #dc2626; margin: 0;">Password Changed</h1>
    </div>
    <p style="font-size: 18px; color: #374151; text-align: center;">
      Hi${name ? ` <strong>${name}</strong>` : ""},
    </p>
    <p style="font-size: 16px; color: #374151; text-align: center;">
      Your password for NYCologic Scholar has been successfully changed.
    </p>
    <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="color: #166534; margin: 0; font-weight: bold;">
        Your account is secure
      </p>
    </div>
    <p style="color: #6b7280; text-align: center; font-size: 14px;">
      If you did not make this change, please contact us immediately or reset your password again.
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
    <p style="color: #9ca3af; text-align: center; font-size: 12px;">
      This email was sent by NYCologic Scholar. Do not reply to this email.
    </p>
  </div>
</body>
</html>
  `;
}

// ============================================================================
// Main Handler
// ============================================================================

async function handleSendPasswordResetConfirmation(
  _req: Request,
  ctx: MiddlewareContext
): Promise<Response> {
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  if (!brevoApiKey) {
    return createErrorResponse("SERVICE_UNAVAILABLE", "BREVO_API_KEY not configured", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
    });
  }

  const { email, name } = ctx.body as PasswordResetRequest;
  const htmlContent = buildPasswordResetEmailHtml(name);

  // Send email via Brevo
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": brevoApiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "NYCologic Scholar",
        email: "notifications@scholarquest.app",
      },
      to: [{ email, name: name || "User" }],
      subject: "Your password has been changed",
      htmlContent,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Brevo API error:", errorText);
    return createErrorResponse("EXTERNAL_SERVICE_ERROR", `Brevo API error: ${response.status}`, {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
    });
  }

  const result = await response.json();
  console.log("Password reset confirmation email sent to:", email);

  return createSuccessResponse(
    { message: "Confirmation email sent" },
    { cors: ctx.corsHeaders, requestId: ctx.requestId }
  );
}

// Create and export the handler with middleware
Deno.serve(
  createHandler(handleSendPasswordResetConfirmation, {
    middleware: [logRequest, parseBody(PasswordResetRequestSchema)],
  })
);
