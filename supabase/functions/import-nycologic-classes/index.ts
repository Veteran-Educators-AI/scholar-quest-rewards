/**
 * Import NYCologic Classes Edge Function
 *
 * Imports classes and students from NYCologic AI for teachers.
 * Handles class creation, student enrollment, and pending enrollments.
 */

import {
  createHandler,
  logRequest,
  createSuccessResponse,
  createErrorResponse,
  createServiceClient,
  extractAuthToken,
  type MiddlewareContext,
} from "../_shared/index.ts";

// ============================================================================
// Types
// ============================================================================

interface NYCologicClass {
  name: string;
  id?: string;
  class_code?: string;
  subject?: string;
  grade_band?: string;
  grade_level?: number;
}

interface NYCologicStudent {
  email?: string;
  name?: string;
  user_id?: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  classes: Array<{ name: string; class_code: string }>;
  students_enrolled: number;
  students_pending: number;
}

// ============================================================================
// Utilities
// ============================================================================

function generateClassCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================================
// Helpers
// ============================================================================

async function fetchNYCologicClasses(
  apiUrl: string,
  teacherEmail: string,
  teacherId: string
): Promise<{ classes: NYCologicClass[]; error?: string }> {
  try {
    const response = await fetchWithTimeout(
      apiUrl,
      {
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
            teacher_email: teacherEmail,
            teacher_id: teacherId,
          },
        }),
      },
      15000
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { classes: [], error: `HTTP ${response.status}: ${errorText.substring(0, 500)}` };
    }

    const responseText = await response.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      return { classes: [], error: "Invalid JSON response" };
    }

    return { classes: result.classes || [] };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    if (errorMsg.includes("aborted") || errorMsg.includes("timeout")) {
      return { classes: [], error: "API timed out" };
    }
    return { classes: [], error: errorMsg };
  }
}

async function fetchClassStudents(
  apiUrl: string,
  className: string,
  classId: string | undefined,
  teacherEmail: string
): Promise<NYCologicStudent[]> {
  try {
    const response = await fetchWithTimeout(
      apiUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-source-app": "scholar-app",
        },
        body: JSON.stringify({
          source: "scholar-app",
          action: "get_class_students",
          timestamp: new Date().toISOString(),
          data: {
            class_name: className,
            class_id: classId,
            teacher_email: teacherEmail,
          },
        }),
      },
      10000
    );

    if (!response.ok) {
      console.error(`Failed to fetch students for class ${className}: status ${response.status}`);
      return [];
    }

    const result = await response.json();
    return result.students || [];
  } catch (err) {
    console.error(`Error fetching students for class ${className}:`, err);
    return [];
  }
}

async function processStudent(
  supabase: ReturnType<typeof createServiceClient>,
  student: NYCologicStudent,
  classId: string,
  teacherId: string
): Promise<{ enrolled: boolean; pending: boolean }> {
  if (!student.email) {
    return { enrolled: false, pending: false };
  }

  const studentUserId = student.user_id;

  if (studentUserId) {
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", studentUserId)
      .maybeSingle();

    if (existingProfile) {
      // Check if already enrolled
      const { data: existingEnrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("class_id", classId)
        .eq("student_id", studentUserId)
        .maybeSingle();

      if (existingEnrollment) {
        return { enrolled: false, pending: false };
      }

      // Enroll the student
      const { error: enrollError } = await supabase.from("enrollments").insert({
        class_id: classId,
        student_id: studentUserId,
      });

      if (enrollError) {
        console.error(`Failed to enroll student ${student.email}:`, enrollError.message);
        // Add to pending enrollments
        await supabase.from("pending_enrollments").upsert(
          {
            class_id: classId,
            email: student.email,
            student_name: student.name || null,
            teacher_id: teacherId,
            processed: false,
          },
          { onConflict: "class_id,email" }
        );
        return { enrolled: false, pending: true };
      }

      return { enrolled: true, pending: false };
    }
  }

  // Profile doesn't exist or no user_id, add to pending
  await supabase.from("pending_enrollments").upsert(
    {
      class_id: classId,
      email: student.email,
      student_name: student.name || null,
      teacher_id: teacherId,
      processed: false,
    },
    { onConflict: "class_id,email" }
  );

  return { enrolled: false, pending: true };
}

// ============================================================================
// Main Handler
// ============================================================================

async function handleImportNycologicClasses(
  req: Request,
  ctx: MiddlewareContext
): Promise<Response> {
  const nycologicApiUrl = Deno.env.get("NYCOLOGIC_API_URL");

  console.log("Starting import-nycologic-classes function");
  console.log("NYCOLOGIC_API_URL configured:", !!nycologicApiUrl);

  if (!nycologicApiUrl) {
    return createSuccessResponse(
      { error: "NYCOLOGIC_API_URL not configured", configured: false, imported: 0, skipped: 0 },
      { cors: ctx.corsHeaders, requestId: ctx.requestId }
    );
  }

  const supabase = createServiceClient();

  // Authenticate user
  const token = extractAuthToken(req);
  if (!token) {
    console.log("No authorization header provided");
    return createErrorResponse("UNAUTHORIZED", "Unauthorized", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
    });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    console.log("User auth failed:", userError?.message);
    return createErrorResponse("UNAUTHORIZED", "Invalid user token", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
    });
  }

  console.log("User authenticated:", user.email);

  // Check if user is a teacher
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!roleData || roleData.role !== "teacher") {
    console.log("User is not a teacher:", roleData?.role);
    return createErrorResponse("FORBIDDEN", "Only teachers can import classes", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
    });
  }

  console.log(`Fetching classes from NYCologic AI for teacher ${user.email}...`);

  // Fetch classes from NYCologic
  const { classes: nycologicClasses, error: fetchError } = await fetchNYCologicClasses(
    nycologicApiUrl,
    user.email!,
    user.id
  );

  if (fetchError) {
    console.error("Fetch to NYCologic API failed:", fetchError);
    return createSuccessResponse(
      { error: fetchError, imported: 0, skipped: 0 },
      { cors: ctx.corsHeaders, requestId: ctx.requestId }
    );
  }

  console.log("Found", nycologicClasses.length, "classes from NYCologic");

  if (!nycologicClasses.length) {
    return createSuccessResponse(
      {
        message: "No classes found in NYCologic Ai",
        imported: 0,
        skipped: 0,
        students_enrolled: 0,
        students_pending: 0,
      },
      { cors: ctx.corsHeaders, requestId: ctx.requestId }
    );
  }

  // Get existing classes for this teacher
  const { data: existingClasses } = await supabase
    .from("classes")
    .select("name, class_code, id")
    .eq("teacher_id", user.id);

  const existingNames = new Set(existingClasses?.map((c: { name: string }) => c.name.toLowerCase()) || []);
  const existingCodes = new Set(existingClasses?.map((c: { class_code: string }) => c.class_code) || []);
  const classNameToId = new Map(
    existingClasses?.map((c: { name: string; id: string }) => [c.name.toLowerCase(), c.id]) || []
  );

  const result: ImportResult = {
    imported: 0,
    skipped: 0,
    classes: [],
    students_enrolled: 0,
    students_pending: 0,
  };

  // Import classes
  for (const nycClass of nycologicClasses) {
    if (existingNames.has(nycClass.name.toLowerCase())) {
      console.log("Skipping existing class:", nycClass.name);
      result.skipped++;
      continue;
    }

    let classCode = nycClass.class_code || generateClassCode();
    while (existingCodes.has(classCode)) {
      classCode = generateClassCode();
    }

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
      result.skipped++;
      continue;
    }

    existingCodes.add(classCode);
    existingNames.add(nycClass.name.toLowerCase());
    classNameToId.set(nycClass.name.toLowerCase(), newClass.id);
    result.imported++;
    result.classes.push({ name: newClass.name, class_code: newClass.class_code });
    console.log("Imported class:", newClass.name);
  }

  console.log(`Imported ${result.imported} classes, skipped ${result.skipped}`);

  // Sync students for all classes (limit to 10 parallel)
  const studentPromises = nycologicClasses.slice(0, 10).map(async (nycClass: NYCologicClass) => {
    const classId = classNameToId.get(nycClass.name.toLowerCase());
    if (!classId) return { enrolled: 0, pending: 0 };

    try {
      const students = await fetchClassStudents(nycologicApiUrl, nycClass.name, nycClass.id, user.email!);
      console.log(`Found ${students.length} students for class ${nycClass.name}`);

      let localEnrolled = 0;
      let localPending = 0;

      for (const student of students) {
        const { enrolled, pending } = await processStudent(supabase, student, classId, user.id);
        if (enrolled) localEnrolled++;
        if (pending) localPending++;
      }

      return { enrolled: localEnrolled, pending: localPending };
    } catch (err) {
      console.error(`Error processing students for class ${nycClass.name}:`, err);
      return { enrolled: 0, pending: 0 };
    }
  });

  const studentResults = await Promise.all(studentPromises);
  for (const res of studentResults) {
    result.students_enrolled += res.enrolled;
    result.students_pending += res.pending;
  }

  console.log(`Enrolled ${result.students_enrolled} students, ${result.students_pending} pending`);

  return createSuccessResponse(
    {
      imported: result.imported,
      skipped: result.skipped,
      classes: result.classes,
      students_enrolled: result.students_enrolled,
      students_pending: result.students_pending,
      synced_at: new Date().toISOString(),
    },
    { cors: ctx.corsHeaders, requestId: ctx.requestId }
  );
}

// Create and export the handler with middleware
Deno.serve(
  createHandler(handleImportNycologicClasses, {
    middleware: [logRequest],
  })
);
