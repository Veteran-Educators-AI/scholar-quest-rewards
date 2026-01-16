import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeoBloxStudent {
  student_id: string;
  email: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  grade_level?: number;
  class_id?: string;
  class_name?: string;
}

interface StudentWeaknessPayload {
  student_id: string;
  email?: string;
  full_name?: string;
  weak_topics?: Record<string, unknown>;
  misconceptions?: Record<string, unknown>;
  skill_tags?: string[];
  overall_average?: number;
  remediation_recommendations?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geobloxApiKey = Deno.env.get("GEOBLOX_API_KEY");

    if (!geobloxApiKey) {
      return new Response(
        JSON.stringify({ error: "GEOBLOX_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "fetch";

    // Action: fetch - Get students from GeoBlox and sync to external_students
    if (action === "fetch") {
      console.log("Fetching students from GeoBlox...");

      // Call GeoBlox API to get students
      const geobloxResponse = await fetch("https://api.geoblox.app/v1/students", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${geobloxApiKey}`,
          "Content-Type": "application/json",
          "x-source-app": "scholar-quest",
        },
      });

      if (!geobloxResponse.ok) {
        const errorText = await geobloxResponse.text();
        console.error("GeoBlox API error:", errorText);
        return new Response(
          JSON.stringify({ 
            error: "Failed to fetch from GeoBlox", 
            status: geobloxResponse.status,
            details: errorText 
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const students: GeoBloxStudent[] = await geobloxResponse.json();
      console.log(`Received ${students.length} students from GeoBlox`);

      let synced = 0;
      let errors = 0;

      for (const student of students) {
        const { error } = await supabase
          .from("external_students")
          .upsert({
            external_id: student.student_id,
            email: student.email,
            full_name: student.full_name,
            first_name: student.first_name,
            last_name: student.last_name,
            grade_level: student.grade_level,
            class_id: student.class_id,
            class_name: student.class_name,
            source: "geoblox",
            sync_timestamp: new Date().toISOString(),
          }, {
            onConflict: "external_id,source",
          });

        if (error) {
          console.error(`Error syncing student ${student.student_id}:`, error);
          errors++;
        } else {
          synced++;
        }
      }

      // Log the sync event
      await supabase.from("webhook_event_logs").insert({
        event_type: "geoblox_fetch",
        status: errors > 0 ? "partial" : "success",
        payload: { total: students.length, synced, errors },
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          fetched: students.length,
          synced,
          errors,
          synced_at: new Date().toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: push - Send student weakness data to GeoBlox
    if (action === "push") {
      const body = await req.json();
      const students: StudentWeaknessPayload[] = Array.isArray(body) ? body : [body];

      console.log(`Pushing ${students.length} student weakness profiles to GeoBlox...`);

      const geobloxResponse = await fetch("https://api.geoblox.app/v1/students/weaknesses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${geobloxApiKey}`,
          "Content-Type": "application/json",
          "x-source-app": "scholar-quest",
        },
        body: JSON.stringify({
          source: "nycologic",
          students: students.map(s => ({
            student_id: s.student_id,
            email: s.email,
            full_name: s.full_name,
            weak_topics: s.weak_topics,
            misconceptions: s.misconceptions,
            skill_tags: s.skill_tags,
            overall_average: s.overall_average,
            remediation_recommendations: s.remediation_recommendations,
          })),
        }),
      });

      if (!geobloxResponse.ok) {
        const errorText = await geobloxResponse.text();
        console.error("GeoBlox push error:", errorText);
        return new Response(
          JSON.stringify({ 
            error: "Failed to push to GeoBlox", 
            status: geobloxResponse.status,
            details: errorText 
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await geobloxResponse.json();

      // Log the push event
      await supabase.from("webhook_event_logs").insert({
        event_type: "geoblox_push",
        status: "success",
        payload: { students_count: students.length },
        response: result,
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          pushed: students.length,
          geoblox_response: result,
          pushed_at: new Date().toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: push-all - Push all external_students with weakness data to GeoBlox
    if (action === "push-all") {
      console.log("Pushing all student weakness data to GeoBlox...");

      const { data: students, error: fetchError } = await supabase
        .from("external_students")
        .select("external_id, email, full_name, weak_topics, misconceptions, skill_tags, overall_average, remediation_recommendations")
        .not("weak_topics", "is", null);

      if (fetchError) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch students", details: fetchError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!students || students.length === 0) {
        return new Response(
          JSON.stringify({ message: "No students with weakness data to push" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const geobloxResponse = await fetch("https://api.geoblox.app/v1/students/weaknesses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${geobloxApiKey}`,
          "Content-Type": "application/json",
          "x-source-app": "scholar-quest",
        },
        body: JSON.stringify({
          source: "nycologic",
          students: students.map(s => ({
            student_id: s.external_id,
            email: s.email,
            full_name: s.full_name,
            weak_topics: s.weak_topics,
            misconceptions: s.misconceptions,
            skill_tags: s.skill_tags,
            overall_average: s.overall_average,
            remediation_recommendations: s.remediation_recommendations,
          })),
        }),
      });

      if (!geobloxResponse.ok) {
        const errorText = await geobloxResponse.text();
        console.error("GeoBlox push error:", errorText);
        return new Response(
          JSON.stringify({ 
            error: "Failed to push to GeoBlox", 
            status: geobloxResponse.status,
            details: errorText 
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await geobloxResponse.json();

      await supabase.from("webhook_event_logs").insert({
        event_type: "geoblox_push_all",
        status: "success",
        payload: { students_count: students.length },
        response: result,
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          pushed: students.length,
          geoblox_response: result,
          pushed_at: new Date().toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use: fetch, push, or push-all" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("GeoBlox sync error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
