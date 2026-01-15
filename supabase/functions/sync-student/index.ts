import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

interface StudentSyncPayload {
  user_id: string;
  full_name?: string;
  email?: string;
  grade_level?: number;
  reading_level?: string;
  math_level?: string;
  skill_tags?: string[];
  strengths?: string[];
  weaknesses?: string[];
  accommodations?: string[];
  class_code?: string;
}

interface BulkSyncPayload {
  students: StudentSyncPayload[];
}

async function verifyApiKey(apiKey: string, supabaseUrl: string, supabaseKey: string): Promise<boolean> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Hash the API key and check against stored hashes
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const tokenHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  // Check both integration_tokens and api_tokens tables
  const { data: token1 } = await supabase
    .from("integration_tokens")
    .select("id, is_active")
    .eq("token_hash", tokenHash)
    .eq("is_active", true)
    .single();

  const { data: token2 } = await supabase
    .from("api_tokens")
    .select("id, is_active")
    .eq("token_hash", tokenHash)
    .eq("is_active", true)
    .single();

  const token = token1 || token2;

  if (!token) {
    // Also check for unhashed token (legacy support)
    const { data: legacyToken } = await supabase
      .from("integration_tokens")
      .select("id, is_active")
      .eq("token_hash", apiKey)
      .eq("is_active", true)
      .single();
    
    if (legacyToken) {
      await supabase
        .from("integration_tokens")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", legacyToken.id);
      return true;
    }
    return false;
  }

  // Update last_used_at
  if (token1) {
    await supabase
      .from("integration_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", token.id);
  } else if (token2) {
    await supabase
      .from("api_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", token.id);
  }

  return true;
}

Deno.serve(async (req) => {
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
      console.log("Missing API key in request");
      return new Response(
        JSON.stringify({ error: "Missing API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isValid = await verifyApiKey(apiKey, supabaseUrl, supabaseServiceKey);
    if (!isValid) {
      console.log("Invalid API key:", apiKey.substring(0, 10) + "...");
      return new Response(
        JSON.stringify({ error: "Invalid or inactive API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    
    // Support both single student and bulk sync
    const students: StudentSyncPayload[] = body.students || [body];
    const results: { user_id: string; status: string; error?: string }[] = [];

    for (const student of students) {
      try {
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", student.user_id)
          .single();

        if (!existingProfile) {
          // Create profile first
          await supabase.from("profiles").insert({
            id: student.user_id,
            full_name: student.full_name || "Student",
            role: "student",
          });
        }

        // Check if student_profiles exists
        const { data: existingStudentProfile } = await supabase
          .from("student_profiles")
          .select("id")
          .eq("user_id", student.user_id)
          .single();

        if (existingStudentProfile) {
          // Update existing
          const { error } = await supabase
            .from("student_profiles")
            .update({
              grade_level: student.grade_level,
              reading_level: student.reading_level,
              math_level: student.math_level,
              skill_tags: student.skill_tags,
              strengths: student.strengths,
              weaknesses: student.weaknesses,
              accommodations: student.accommodations,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", student.user_id);

          if (error) throw error;
          results.push({ user_id: student.user_id, status: "updated" });
        } else {
          // Create new
          const { error } = await supabase.from("student_profiles").insert({
            user_id: student.user_id,
            grade_level: student.grade_level,
            reading_level: student.reading_level,
            math_level: student.math_level,
            skill_tags: student.skill_tags,
            strengths: student.strengths,
            weaknesses: student.weaknesses,
            accommodations: student.accommodations,
          });

          if (error) throw error;
          results.push({ user_id: student.user_id, status: "created" });
        }

        // Handle class enrollment if class_code provided
        if (student.class_code) {
          const { data: classData } = await supabase
            .from("classes")
            .select("id")
            .eq("class_code", student.class_code)
            .single();

          if (classData) {
            const { data: existingEnrollment } = await supabase
              .from("enrollments")
              .select("id")
              .eq("student_id", student.user_id)
              .eq("class_id", classData.id)
              .single();

            if (!existingEnrollment) {
              await supabase.from("enrollments").insert({
                student_id: student.user_id,
                class_id: classData.id,
              });
            }
          }
        }
      } catch (err) {
        console.error(`Error syncing student ${student.user_id}:`, err);
        results.push({ 
          user_id: student.user_id, 
          status: "error", 
          error: err instanceof Error ? err.message : "Unknown error" 
        });
      }
    }

    // Log the webhook event
    await supabase.from("webhook_event_logs").insert({
      event_type: "student_sync",
      payload: body,
      status: results.every(r => r.status !== "error") ? "success" : "partial",
      processed_at: new Date().toISOString(),
      response: { results },
    });

    const successCount = results.filter(r => r.status !== "error").length;
    console.log(`Synced ${successCount}/${students.length} students`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: successCount,
        total: students.length,
        results 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
