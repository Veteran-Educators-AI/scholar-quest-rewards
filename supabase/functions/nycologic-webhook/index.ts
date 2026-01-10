import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

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
    questions?: Array<{
      prompt: string;
      question_type: "multiple_choice" | "short_answer" | "numeric" | "drag_order" | "matching";
      options?: string[];
      answer_key: unknown;
      hint?: string;
      difficulty?: number;
      skill_tag?: string;
    }>;
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

type WebhookPayload = AssignmentPayload | StudentProfilePayload | StatusQueryPayload;

async function verifyApiKey(apiKey: string, supabaseUrl: string, supabaseKey: string): Promise<boolean> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Hash the API key and check against stored hashes
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const tokenHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  const { data: token, error } = await supabase
    .from("integration_tokens")
    .select("id, is_active")
    .eq("token_hash", tokenHash)
    .single();

  if (error || !token || !token.is_active) {
    return false;
  }

  // Update last_used_at
  await supabase
    .from("integration_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", token.id);

  return true;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify API key
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isValid = await verifyApiKey(apiKey, supabaseUrl, supabaseServiceKey);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid or inactive API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: WebhookPayload = await req.json();

    switch (payload.type) {
      case "assignment": {
        const { data } = payload as AssignmentPayload;
        
        // Find class by code
        const { data: classData, error: classError } = await supabase
          .from("classes")
          .select("id")
          .eq("class_code", data.class_code)
          .single();

        if (classError || !classData) {
          return new Response(
            JSON.stringify({ error: "Class not found", class_code: data.class_code }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
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
          return new Response(
            JSON.stringify({ error: "Failed to create assignment", details: assignmentError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create questions if provided
        if (data.questions && data.questions.length > 0) {
          const questionsToInsert = data.questions.map((q, index) => ({
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

        return new Response(
          JSON.stringify({ 
            success: true, 
            assignment_id: assignment.id,
            status: "received"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "student_profile": {
        const { data } = payload as StudentProfilePayload;
        
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
          return new Response(
            JSON.stringify({ error: "Failed to update student profile", details: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, status: "profile_updated" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "status_query": {
        const { data } = payload as StatusQueryPayload;
        
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
          return new Response(
            JSON.stringify({ error: "Assignment not found", external_ref: data.external_ref }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            assignment_id: assignment.id,
            status: assignment.status,
            attempts: assignment.attempts
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown payload type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
