/**
 * Send Welcome Email Edge Function
 *
 * Sends a welcome email to new students via Brevo SMTP API.
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

const WelcomeEmailRequestSchema = z.object({
  student_id: z.string().uuid(),
  student_name: z.string().min(1),
  student_email: z.string().email(),
  class_name: z.string().optional(),
  teacher_name: z.string().optional(),
});

type WelcomeEmailRequest = z.infer<typeof WelcomeEmailRequestSchema>;

// ============================================================================
// Email Template
// ============================================================================

function buildWelcomeEmailHtml(firstName: string, className?: string, teacherName?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ScholarQuest!</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Welcome to ScholarQuest!</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Your learning adventure begins now</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 18px; color: #18181b;">Hey ${firstName}!</p>

              <p style="margin: 0 0 20px; font-size: 16px; color: #52525b; line-height: 1.6;">
                You've just joined an awesome learning community where studying pays off—literally!
                Complete assignments, master standards, and earn coins & XP along the way.
              </p>

              ${className ? `
              <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 600;">Your Class</p>
                <p style="margin: 8px 0 0; color: #15803d; font-size: 16px;">${className}${teacherName ? ` with ${teacherName}` : ''}</p>
              </div>
              ` : ''}

              <h2 style="margin: 30px 0 15px; font-size: 18px; color: #18181b;">Getting Started</h2>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
                    <table role="presentation" style="border-collapse: collapse;">
                      <tr>
                        <td style="width: 40px; vertical-align: top;">
                          <span style="display: inline-block; width: 28px; height: 28px; background-color: #ddd6fe; color: #7c3aed; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 600;">1</span>
                        </td>
                        <td style="vertical-align: top;">
                          <p style="margin: 0; font-size: 15px; color: #18181b; font-weight: 500;">Check Your Dashboard</p>
                          <p style="margin: 4px 0 0; font-size: 14px; color: #71717a;">See your grades, streak, and progress toward rewards</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
                    <table role="presentation" style="border-collapse: collapse;">
                      <tr>
                        <td style="width: 40px; vertical-align: top;">
                          <span style="display: inline-block; width: 28px; height: 28px; background-color: #ddd6fe; color: #7c3aed; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 600;">2</span>
                        </td>
                        <td style="vertical-align: top;">
                          <p style="margin: 0; font-size: 15px; color: #18181b; font-weight: 500;">Practice to Earn Points</p>
                          <p style="margin: 4px 0 0; font-size: 14px; color: #71717a;">Complete practice sets and games to earn XP and coins</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table role="presentation" style="border-collapse: collapse;">
                      <tr>
                        <td style="width: 40px; vertical-align: top;">
                          <span style="display: inline-block; width: 28px; height: 28px; background-color: #ddd6fe; color: #7c3aed; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 600;">3</span>
                        </td>
                        <td style="vertical-align: top;">
                          <p style="margin: 0; font-size: 15px; color: #18181b; font-weight: 500;">Build Your Streak</p>
                          <p style="margin: 4px 0 0; font-size: 14px; color: #71717a;">Study daily to keep your streak alive and unlock badges</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 35px 0 20px;">
                <a href="https://scholar-quest-rewards.lovable.app/student" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Start Learning Now</a>
              </div>

              <p style="margin: 30px 0 0; font-size: 14px; color: #a1a1aa; text-align: center;">
                Questions? Talk to your teacher or reply to this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f4f4f5; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #71717a;">
                ScholarQuest - Making learning rewarding
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// ============================================================================
// Main Handler
// ============================================================================

async function handleSendWelcomeEmail(
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

  const { student_name, student_email, class_name, teacher_name } = ctx.body as WelcomeEmailRequest;

  if (!student_email) {
    return createErrorResponse("VALIDATION_ERROR", "No email provided", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
    });
  }

  const firstName = student_name?.split(" ")[0] || "Scholar";
  const htmlContent = buildWelcomeEmailHtml(firstName, class_name, teacher_name);

  // Send email via Brevo
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-key": brevoApiKey,
    },
    body: JSON.stringify({
      sender: {
        name: "ScholarQuest",
        email: "noreply@scholarquest.app",
      },
      to: [{ email: student_email, name: student_name }],
      subject: `Welcome to ScholarQuest, ${firstName}!`,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Brevo error:", errorData);
    return createErrorResponse("EXTERNAL_SERVICE_ERROR", `Failed to send email: ${response.status}`, {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
    });
  }

  const result = await response.json();
  console.log("Welcome email sent successfully:", result);

  return createSuccessResponse(
    { messageId: result.messageId },
    { cors: ctx.corsHeaders, requestId: ctx.requestId }
  );
}

// Create and export the handler with middleware
Deno.serve(
  createHandler(handleSendWelcomeEmail, {
    middleware: [logRequest, parseBody(WelcomeEmailRequestSchema)],
  })
);
