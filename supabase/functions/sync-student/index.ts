import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

interface StudentSyncPayload {
  user_id?: string;
  external_id?: string; // Alternative identifier from NYCologic
  email?: string; // Alternative identifier
  full_name?: string;
  first_name?: string;
  last_name?: string;
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
    // Legacy support: check if the plain API key matches a token_hash directly
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

// Generate a deterministic UUID from an external_id or email
function generateDeterministicUUID(input: string): string {
  // Simple hash-based UUID generation (v5-like)
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Convert to hex and format as UUID
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const uuid = `${hex.slice(0, 8)}-${hex.slice(0, 4)}-4${hex.slice(1, 4)}-8${hex.slice(0, 3)}-${hex.padEnd(12, '0').slice(0, 12)}`;
  return uuid;
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
    console.log("Received sync payload:", JSON.stringify(body).substring(0, 500));
    
    // Support both single student and bulk sync
    const students: StudentSyncPayload[] = body.students || [body];
    const results: { identifier: string; user_id: string; status: string; error?: string }[] = [];

    for (const student of students) {
      try {
        // Determine user_id: use provided, or generate from external_id/email
        let userId = student.user_id;
        let identifier = userId || student.external_id || student.email || "unknown";
        
        if (!userId) {
          if (student.external_id) {
            // Check if we already have a mapping for this external_id
            const { data: existingInvite } = await supabase
              .from("student_invite_links")
              .select("used_by")
              .eq("external_ref", student.external_id)
              .not("used_by", "is", null)
              .single();
            
            if (existingInvite?.used_by) {
              userId = existingInvite.used_by;
            } else {
              // Check student_profiles for external reference match
              const { data: existingProfile } = await supabase
                .from("practice_sets")
                .select("student_id")
                .eq("external_ref", student.external_id)
                .limit(1)
                .single();
              
              if (existingProfile?.student_id) {
                userId = existingProfile.student_id;
              }
            }
          }
          
          if (!userId && student.email) {
            // Try to find user by email in auth.users (via profiles)
            // We can't query auth.users directly, but we can check if profile exists
            // For now, generate a deterministic ID from email
            userId = generateDeterministicUUID(`nycologic:${student.email}`);
          }
          
          if (!userId && student.external_id) {
            // Generate deterministic UUID from external_id
            userId = generateDeterministicUUID(`nycologic:${student.external_id}`);
          }
          
          if (!userId) {
            // Last resort: generate random UUID
            userId = crypto.randomUUID();
            console.log(`Generated new random UUID for student: ${identifier}`);
          }
        }

        // Build full name from parts if not provided
        let fullName = student.full_name;
        if (!fullName && (student.first_name || student.last_name)) {
          fullName = [student.first_name, student.last_name].filter(Boolean).join(" ");
        }
        fullName = fullName || "Student";

        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", userId)
          .single();

        if (!existingProfile) {
          // Create profile first
          const { error: profileError } = await supabase.from("profiles").insert({
            id: userId,
            full_name: fullName,
            role: "student",
          });
          
          if (profileError) {
            console.log(`Profile creation for ${identifier}:`, profileError.message);
            // If it's a duplicate, that's fine
            if (!profileError.message.includes("duplicate")) {
              throw profileError;
            }
          }
        } else {
          // Update profile name if provided
          if (fullName !== "Student") {
            await supabase
              .from("profiles")
              .update({ full_name: fullName, updated_at: new Date().toISOString() })
              .eq("id", userId);
          }
        }

        // Check if student_profiles exists
        const { data: existingStudentProfile } = await supabase
          .from("student_profiles")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (existingStudentProfile) {
          // Update existing
          const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          };
          
          if (student.grade_level !== undefined) updateData.grade_level = student.grade_level;
          if (student.reading_level !== undefined) updateData.reading_level = student.reading_level;
          if (student.math_level !== undefined) updateData.math_level = student.math_level;
          if (student.skill_tags !== undefined) updateData.skill_tags = student.skill_tags;
          if (student.strengths !== undefined) updateData.strengths = student.strengths;
          if (student.weaknesses !== undefined) updateData.weaknesses = student.weaknesses;
          if (student.accommodations !== undefined) updateData.accommodations = student.accommodations;

          const { error } = await supabase
            .from("student_profiles")
            .update(updateData)
            .eq("user_id", userId);

          if (error) throw error;
          results.push({ identifier, user_id: userId, status: "updated" });
        } else {
          // Create new student profile
          const { error } = await supabase.from("student_profiles").insert({
            user_id: userId,
            grade_level: student.grade_level,
            reading_level: student.reading_level,
            math_level: student.math_level,
            skill_tags: student.skill_tags,
            strengths: student.strengths,
            weaknesses: student.weaknesses,
            accommodations: student.accommodations,
          });

          if (error) throw error;
          results.push({ identifier, user_id: userId, status: "created" });
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
              .eq("student_id", userId)
              .eq("class_id", classData.id)
              .single();

            if (!existingEnrollment) {
              await supabase.from("enrollments").insert({
                student_id: userId,
                class_id: classData.id,
              });
            }
          }
        }

        // Store external_id mapping if provided (for future lookups)
        if (student.external_id) {
          // Check if invite link exists for this external_ref
          const { data: existingLink } = await supabase
            .from("student_invite_links")
            .select("id")
            .eq("external_ref", student.external_id)
            .single();

          if (!existingLink) {
            // Get a teacher_id (we'll use a system teacher or first available)
            const { data: anyClass } = await supabase
              .from("classes")
              .select("teacher_id")
              .limit(1)
              .single();

            if (anyClass?.teacher_id) {
              await supabase.from("student_invite_links").insert({
                teacher_id: anyClass.teacher_id,
                token: `nycologic-${student.external_id}`,
                external_ref: student.external_id,
                student_name: fullName,
                student_email: student.email,
                used_by: userId,
                used_at: new Date().toISOString(),
              });
            }
          }
        }

      } catch (err) {
        const identifier = student.user_id || student.external_id || student.email || "unknown";
        console.error(`Error syncing student ${identifier}:`, err);
        results.push({ 
          identifier,
          user_id: "",
          status: "error", 
          error: err instanceof Error ? err.message : "Unknown error" 
        });
      }
    }

    // Log the webhook event
    await supabase.from("webhook_event_logs").insert({
      event_type: "student_sync",
      payload: { student_count: students.length, sample: students[0] },
      status: results.every(r => r.status !== "error") ? "success" : 
              results.some(r => r.status !== "error") ? "partial" : "failed",
      processed_at: new Date().toISOString(),
      response: { results: results.slice(0, 20) }, // Limit stored results
    });

    const successCount = results.filter(r => r.status !== "error").length;
    console.log(`Synced ${successCount}/${students.length} students`);

    return new Response(
      JSON.stringify({ 
        success: successCount > 0, 
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
