/**
 * Send Parent Notification Edge Function
 *
 * Sends email notifications to parents about their child's activity.
 * Supports badge earned, streak warnings, rewards, assignments, points deducted, and pledge progress.
 */

import {
  createHandler,
  logRequest,
  parseBody,
  createSuccessResponse,
  createErrorResponse,
  createServiceClient,
  type MiddlewareContext,
} from "../_shared/index.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ============================================================================
// Types & Validation
// ============================================================================

const NotificationTypeSchema = z.enum([
  "badge_earned",
  "streak_warning",
  "reward_earned",
  "assignment_completed",
  "points_deducted",
  "pledge_near_completion",
]);

const NotificationDataSchema = z.object({
  badge_name: z.string().optional(),
  current_streak: z.number().optional(),
  xp_earned: z.number().optional(),
  coins_earned: z.number().optional(),
  assignment_title: z.string().optional(),
  score: z.number().optional(),
  points_deducted: z.number().optional(),
  reason: z.string().optional(),
  student_name: z.string().optional(),
  current_coins: z.number().optional(),
  threshold: z.number().optional(),
  progress_percent: z.number().optional(),
  reward_description: z.string().optional(),
  coins_needed: z.number().optional(),
});

const NotificationRequestSchema = z.object({
  type: NotificationTypeSchema,
  student_id: z.string().uuid(),
  data: NotificationDataSchema,
});

type NotificationRequest = z.infer<typeof NotificationRequestSchema>;
type NotificationType = z.infer<typeof NotificationTypeSchema>;

// ============================================================================
// Email Templates
// ============================================================================

interface EmailContent {
  subject: string;
  htmlContent: string;
}

interface ParentEmail {
  email: string;
  name: string;
}

function buildEmailContent(
  type: NotificationType,
  studentName: string,
  data: NotificationRequest["data"]
): EmailContent {
  const baseStyle = `font-family: 'Nunito', Arial, sans-serif; background-color: #f8f9fa; padding: 20px;`;
  const containerStyle = `max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);`;

  switch (type) {
    case "badge_earned":
      return {
        subject: `🏆 ${studentName} earned a new badge!`,
        htmlContent: `
          <html>
            <body style="${baseStyle}">
              <div style="${containerStyle}">
                <h1 style="color: #7c3aed; text-align: center;">🎉 Congratulations!</h1>
                <p style="font-size: 18px; color: #374151; text-align: center;">
                  <strong>${studentName}</strong> just earned the <strong style="color: #7c3aed;">${data.badge_name}</strong> badge!
                </p>
                <p style="color: #6b7280; text-align: center;">Keep encouraging them on their learning journey!</p>
              </div>
            </body>
          </html>
        `,
      };

    case "streak_warning":
      return {
        subject: `⚠️ ${studentName}'s streak is at risk!`,
        htmlContent: `
          <html>
            <body style="${baseStyle}">
              <div style="${containerStyle}">
                <h1 style="color: #f59e0b; text-align: center;">⚠️ Streak Alert</h1>
                <p style="font-size: 18px; color: #374151; text-align: center;">
                  <strong>${studentName}</strong> hasn't completed any assignments today and their <strong style="color: #f59e0b;">${data.current_streak}-day streak</strong> is at risk!
                </p>
                <p style="color: #6b7280; text-align: center;">A gentle reminder might help keep the momentum going!</p>
              </div>
            </body>
          </html>
        `,
      };

    case "reward_earned":
      return {
        subject: `🌟 ${studentName} earned rewards!`,
        htmlContent: `
          <html>
            <body style="${baseStyle}">
              <div style="${containerStyle}">
                <h1 style="color: #10b981; text-align: center;">🌟 Great Progress!</h1>
                <p style="font-size: 18px; color: #374151; text-align: center;">
                  <strong>${studentName}</strong> just earned:
                </p>
                <div style="text-align: center; margin: 20px 0;">
                  ${data.xp_earned ? `<span style="display: inline-block; background: #dbeafe; color: #1d4ed8; padding: 8px 16px; border-radius: 8px; margin: 4px;">+${data.xp_earned} XP</span>` : ""}
                  ${data.coins_earned ? `<span style="display: inline-block; background: #fef3c7; color: #d97706; padding: 8px 16px; border-radius: 8px; margin: 4px;">+${data.coins_earned} Coins</span>` : ""}
                </div>
                <p style="color: #6b7280; text-align: center;">They're making excellent progress!</p>
              </div>
            </body>
          </html>
        `,
      };

    case "assignment_completed":
      return {
        subject: `✅ ${studentName} completed an assignment!`,
        htmlContent: `
          <html>
            <body style="${baseStyle}">
              <div style="${containerStyle}">
                <h1 style="color: #7c3aed; text-align: center;">✅ Assignment Complete!</h1>
                <p style="font-size: 18px; color: #374151; text-align: center;">
                  <strong>${studentName}</strong> just completed <strong style="color: #7c3aed;">${data.assignment_title || "an assignment"}</strong>!
                </p>
                ${data.score !== undefined ? `<p style="font-size: 24px; color: #10b981; text-align: center; font-weight: bold;">Score: ${data.score}%</p>` : ""}
                <p style="color: #6b7280; text-align: center;">Great work! Keep up the encouragement!</p>
              </div>
            </body>
          </html>
        `,
      };

    case "points_deducted":
      return {
        subject: `⚠️ ${studentName} lost points for behavior`,
        htmlContent: `
          <html>
            <body style="${baseStyle}">
              <div style="${containerStyle}">
                <h1 style="color: #dc2626; text-align: center;">⚠️ Behavior Alert</h1>
                <p style="font-size: 18px; color: #374151; text-align: center;">
                  <strong>${studentName}</strong> had <strong style="color: #dc2626;">${data.points_deducted} points</strong> deducted by their teacher.
                </p>
                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <p style="color: #991b1b; font-weight: bold; margin: 0 0 8px 0;">Reason:</p>
                  <p style="color: #7f1d1d; margin: 0;">${data.reason || "Behavior issue"}</p>
                </div>
                <p style="color: #6b7280; text-align: center;">
                  Please talk to your child about their behavior. Points are needed to earn rewards!
                </p>
              </div>
            </body>
          </html>
        `,
      };

    case "pledge_near_completion":
      return {
        subject: `🔥 ${studentName} is almost at their reward goal!`,
        htmlContent: `
          <html>
            <body style="${baseStyle}">
              <div style="${containerStyle}">
                <h1 style="color: #f59e0b; text-align: center;">🔥 Almost There!</h1>
                <p style="font-size: 18px; color: #374151; text-align: center;">
                  <strong>${studentName}</strong> is <strong style="color: #f59e0b;">${data.progress_percent}%</strong> of the way to their reward!
                </p>
                <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                  <p style="font-size: 14px; color: #92400e; margin: 0 0 8px 0;">Working toward:</p>
                  <p style="font-size: 20px; color: #78350f; font-weight: bold; margin: 0;">${data.reward_description}</p>
                </div>
                <div style="display: flex; justify-content: center; gap: 16px; margin: 20px 0;">
                  <div style="background: #f3f4f6; padding: 12px 20px; border-radius: 8px; text-align: center;">
                    <p style="font-size: 12px; color: #6b7280; margin: 0;">Current</p>
                    <p style="font-size: 24px; font-weight: bold; color: #374151; margin: 0;">${data.current_coins}</p>
                  </div>
                  <div style="background: #f3f4f6; padding: 12px 20px; border-radius: 8px; text-align: center;">
                    <p style="font-size: 12px; color: #6b7280; margin: 0;">Goal</p>
                    <p style="font-size: 24px; font-weight: bold; color: #374151; margin: 0;">${data.threshold}</p>
                  </div>
                  <div style="background: #dbeafe; padding: 12px 20px; border-radius: 8px; text-align: center;">
                    <p style="font-size: 12px; color: #1e40af; margin: 0;">Needed</p>
                    <p style="font-size: 24px; font-weight: bold; color: #1d4ed8; margin: 0;">${data.coins_needed}</p>
                  </div>
                </div>
                <p style="color: #6b7280; text-align: center;">
                  Just a few more assignments and ${studentName} will earn their reward! Keep encouraging them! 🌟
                </p>
              </div>
            </body>
          </html>
        `,
      };

    default:
      // This should never be reached due to Zod validation
      throw new Error(`Unknown notification type: ${type}`);
  }
}

// ============================================================================
// Main Handler
// ============================================================================

async function handleSendParentNotification(
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

  const supabase = createServiceClient();
  const { type, student_id, data } = ctx.body as NotificationRequest;

  // Get student info
  const { data: studentProfile, error: studentError } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", student_id)
    .single();

  if (studentError || !studentProfile) {
    console.log("Student not found:", student_id);
    return createErrorResponse("NOT_FOUND", "Student not found", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
    });
  }

  // Get linked parents
  const { data: parentLinks, error: parentLinksError } = await supabase
    .from("parent_students")
    .select("parent_id")
    .eq("student_id", student_id)
    .eq("verified", true);

  if (parentLinksError || !parentLinks || parentLinks.length === 0) {
    console.log("No verified parents found for student:", student_id);
    return createSuccessResponse(
      { message: "No parents to notify" },
      { cors: ctx.corsHeaders, requestId: ctx.requestId }
    );
  }

  // Get parent profiles
  const parentIds = parentLinks.map((p: { parent_id: string }) => p.parent_id);
  const { data: parentProfiles, error: parentProfilesError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", parentIds);

  if (parentProfilesError || !parentProfiles) {
    console.log("Parent profiles not found");
    return createErrorResponse("NOT_FOUND", "Parent profiles not found", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
    });
  }

  // Get parent emails using admin API
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.log("Could not fetch user emails:", authError);
    return createErrorResponse("INTERNAL_ERROR", "Could not fetch parent emails", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
    });
  }

  const parentEmails: ParentEmail[] = authData.users
    .filter((u: { id: string }) => parentIds.includes(u.id))
    .map((u: { id: string; email?: string }) => ({
      email: u.email || "",
      name: parentProfiles.find((p: { id: string; full_name: string }) => p.id === u.id)?.full_name || "Parent",
    }))
    .filter((p: { email: string; name: string }): p is ParentEmail => !!p.email);

  if (parentEmails.length === 0) {
    console.log("No parent emails found");
    return createSuccessResponse(
      { message: "No parent emails found" },
      { cors: ctx.corsHeaders, requestId: ctx.requestId }
    );
  }

  // Build email content
  const studentName = studentProfile.full_name;
  const { subject, htmlContent } = buildEmailContent(type, studentName, data);

  // Send emails via Brevo
  const emailPromises = parentEmails.map(async (parent: ParentEmail) => {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "ScholarQuest",
          email: "notifications@scholarquest.app",
        },
        to: [{ email: parent.email, name: parent.name }],
        subject,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Brevo API error:", errorText);
      throw new Error(`Brevo API error: ${response.status}`);
    }

    return response.json();
  });

  const results = await Promise.allSettled(emailPromises);
  const successful = results.filter((r: PromiseSettledResult<unknown>) => r.status === "fulfilled").length;
  const failed = results.filter((r: PromiseSettledResult<unknown>) => r.status === "rejected").length;

  console.log(`Sent ${successful} emails, ${failed} failed`);

  return createSuccessResponse(
    { message: `Sent ${successful} emails`, failed },
    { cors: ctx.corsHeaders, requestId: ctx.requestId }
  );
}

// Create and export the handler with middleware
Deno.serve(
  createHandler(handleSendParentNotification, {
    middleware: [logRequest, parseBody(NotificationRequestSchema)],
  })
);
