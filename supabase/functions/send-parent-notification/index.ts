import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  type: "badge_earned" | "streak_warning" | "reward_earned";
  student_id: string;
  data: {
    badge_name?: string;
    current_streak?: number;
    xp_earned?: number;
    coins_earned?: number;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      throw new Error("BREVO_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: NotificationPayload = await req.json();
    const { type, student_id, data } = payload;

    // Get student info
    const { data: studentProfile, error: studentError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", student_id)
      .single();

    if (studentError || !studentProfile) {
      console.log("Student not found:", student_id);
      return new Response(JSON.stringify({ message: "Student not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      return new Response(JSON.stringify({ message: "No parents to notify" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get parent emails from auth.users via profiles
    const parentIds = parentLinks.map((p) => p.parent_id);
    
    // We need to get emails - using a workaround since we can't access auth.users directly
    // In production, you'd store email in profiles or use a different approach
    const { data: parentProfiles, error: parentProfilesError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", parentIds);

    if (parentProfilesError || !parentProfiles) {
      console.log("Parent profiles not found");
      return new Response(JSON.stringify({ message: "Parent profiles not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build email content based on notification type
    let subject = "";
    let htmlContent = "";
    const studentName = studentProfile.full_name;

    switch (type) {
      case "badge_earned":
        subject = `🏆 ${studentName} earned a new badge!`;
        htmlContent = `
          <html>
            <body style="font-family: 'Nunito', Arial, sans-serif; background-color: #f8f9fa; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h1 style="color: #7c3aed; text-align: center;">🎉 Congratulations!</h1>
                <p style="font-size: 18px; color: #374151; text-align: center;">
                  <strong>${studentName}</strong> just earned the <strong style="color: #7c3aed;">${data.badge_name}</strong> badge!
                </p>
                <p style="color: #6b7280; text-align: center;">Keep encouraging them on their learning journey!</p>
              </div>
            </body>
          </html>
        `;
        break;

      case "streak_warning":
        subject = `⚠️ ${studentName}'s streak is at risk!`;
        htmlContent = `
          <html>
            <body style="font-family: 'Nunito', Arial, sans-serif; background-color: #f8f9fa; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h1 style="color: #f59e0b; text-align: center;">⚠️ Streak Alert</h1>
                <p style="font-size: 18px; color: #374151; text-align: center;">
                  <strong>${studentName}</strong> hasn't completed any assignments today and their <strong style="color: #f59e0b;">${data.current_streak}-day streak</strong> is at risk!
                </p>
                <p style="color: #6b7280; text-align: center;">A gentle reminder might help keep the momentum going!</p>
              </div>
            </body>
          </html>
        `;
        break;

      case "reward_earned":
        subject = `🌟 ${studentName} earned rewards!`;
        htmlContent = `
          <html>
            <body style="font-family: 'Nunito', Arial, sans-serif; background-color: #f8f9fa; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
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
        `;
        break;
    }

    // For each parent, we need their email - in a real app you'd have this in profiles
    // For now, we'll use the Supabase admin API to get emails
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log("Could not fetch user emails:", authError);
      return new Response(JSON.stringify({ message: "Could not fetch parent emails" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parentEmails = authData.users
      .filter((u) => parentIds.includes(u.id))
      .map((u) => ({ email: u.email, name: parentProfiles.find((p) => p.id === u.id)?.full_name || "Parent" }))
      .filter((p) => p.email);

    if (parentEmails.length === 0) {
      console.log("No parent emails found");
      return new Response(JSON.stringify({ message: "No parent emails found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send emails via Brevo
    const emailPromises = parentEmails.map(async (parent) => {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: "ScholarQuest",
            email: "notifications@scholarquest.app", // Replace with your verified sender
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
    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`Sent ${successful} emails, ${failed} failed`);

    return new Response(
      JSON.stringify({ message: `Sent ${successful} emails`, failed }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-parent-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
