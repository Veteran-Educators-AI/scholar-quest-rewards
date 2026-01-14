import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateClassCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const nycologicApiUrl = Deno.env.get("NYCOLOGIC_API_URL");

    if (!nycologicApiUrl) {
      return new Response(
        JSON.stringify({ error: "NYCOLOGIC_API_URL not configured", configured: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid user token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is a teacher
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || roleData.role !== "teacher") {
      return new Response(
        JSON.stringify({ error: "Only teachers can import classes" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching classes from NYCologic AI for teacher ${user.email}...`);

    // Fetch classes from NYCologic AI
    const response = await fetch(nycologicApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-source-app": "scholar-app",
      },
      body: JSON.stringify({
        source: "scholar-app",
        action: "get_teacher_classes",
        timestamp: new Date().toISOString(),
        data: {
          teacher_email: user.email,
          teacher_id: user.id,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("NYCologic API error:", errorText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch classes from NYCologic Ai", 
          status: response.status,
          imported: 0,
          skipped: 0,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    const nycologicClasses = result.classes || [];

    if (!nycologicClasses.length) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No classes found in NYCologic Ai",
          imported: 0,
          skipped: 0,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get existing classes for this teacher
    const { data: existingClasses } = await supabase
      .from("classes")
      .select("name, class_code")
      .eq("teacher_id", user.id);

    const existingNames = new Set(existingClasses?.map(c => c.name.toLowerCase()) || []);
    const existingCodes = new Set(existingClasses?.map(c => c.class_code) || []);

    let imported = 0;
    let skipped = 0;
    const importedClasses: Array<{ name: string; class_code: string }> = [];

    for (const nycClass of nycologicClasses) {
      // Skip if class name already exists
      if (existingNames.has(nycClass.name.toLowerCase())) {
        skipped++;
        continue;
      }

      // Generate unique class code
      let classCode = nycClass.class_code || generateClassCode();
      while (existingCodes.has(classCode)) {
        classCode = generateClassCode();
      }

      // Insert the class
      const { data: newClass, error: insertError } = await supabase
        .from("classes")
        .insert({
          name: nycClass.name,
          class_code: classCode,
          teacher_id: user.id,
          subject: nycClass.subject || null,
          grade_band: nycClass.grade_band || null,
          grade_level: nycClass.grade_level || null,
        })
        .select("id, name, class_code")
        .single();

      if (insertError) {
        console.error(`Failed to import class ${nycClass.name}:`, insertError);
        skipped++;
        continue;
      }

      existingCodes.add(classCode);
      existingNames.add(nycClass.name.toLowerCase());
      imported++;
      importedClasses.push({ name: newClass.name, class_code: newClass.class_code });
    }

    console.log(`Imported ${imported} classes, skipped ${skipped}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported,
        skipped,
        classes: importedClasses,
        synced_at: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Import error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage, imported: 0, skipped: 0 }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
