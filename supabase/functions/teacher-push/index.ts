/**
 * Teacher Push Edge Function
 *
 * Comprehensive API for teachers to push assignments, practice sets, and manage students.
 * Supports assignments, direct student work, class management, and student progress tracking.
 */

import {
  createHandler,
  logRequest,
  createSuccessResponse,
  createErrorResponse,
  createServiceClient,
  hashApiKey,
  type MiddlewareContext,
} from "../_shared/index.ts";

// ============================================================================
// Types
// ============================================================================

interface QuestionPayload {
  prompt: string;
  question_type: "multiple_choice" | "short_answer" | "numeric" | "drag_order" | "matching";
  options?: unknown;
  answer_key: unknown;
  difficulty?: number;
  hint?: string;
  skill_tag?: string;
}

interface AssignmentPayload {
  class_id: string;
  title: string;
  description?: string;
  due_at: string;
  standard_code?: string;
  standard_id?: string;
  subject?: string;
  xp_reward?: number;
  coin_reward?: number;
  printable_url?: string;
  external_ref?: string;
  questions?: QuestionPayload[];
}

interface DirectStudentPayload {
  student_email?: string;
  student_external_id?: string;
  student_id?: string;
  title: string;
  description?: string;
  skill_tags?: string[];
  xp_reward?: number;
  coin_reward?: number;
  printable_url?: string;
  external_ref?: string;
  source?: string;
  questions?: QuestionPayload[];
}

interface TokenData {
  id: string;
  created_by: string;
  is_active: boolean;
}

type SupabaseClient = ReturnType<typeof createServiceClient>;

// ============================================================================
// API Key Verification
// ============================================================================

async function verifyApiKey(
  apiKey: string,
  supabase: SupabaseClient
): Promise<{ valid: boolean; tokenData?: TokenData }> {
  const tokenHash = await hashApiKey(apiKey);

  const { data: token, error } = await supabase
    .from("integration_tokens")
    .select("*")
    .eq("token_hash", tokenHash)
    .eq("is_active", true)
    .single();

  if (error || !token) {
    return { valid: false };
  }

  await supabase
    .from("integration_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", token.id);

  return { valid: true, tokenData: token };
}

// ============================================================================
// Helper Functions
// ============================================================================

async function findStandardByCode(code: string, supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase
    .from("nys_standards")
    .select("id")
    .eq("code", code)
    .single();

  if (error || !data) return null;
  return data.id;
}

async function findStudent(
  supabase: SupabaseClient,
  email?: string,
  externalId?: string,
  studentId?: string
): Promise<{ found: boolean; student_id?: string; error?: string }> {
  if (studentId) {
    const { data } = await supabase.from("profiles").select("id").eq("id", studentId).single();
    if (data) return { found: true, student_id: data.id };
    return { found: false, error: "Student not found by ID" };
  }

  if (email) {
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const user = usersData?.users?.find(
      (u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (user) return { found: true, student_id: user.id };
    return { found: false, error: `No student found with email: ${email}` };
  }

  if (externalId) {
    const { data: practiceSet } = await supabase
      .from("practice_sets")
      .select("student_id")
      .eq("external_ref", externalId)
      .limit(1)
      .single();
    if (practiceSet) return { found: true, student_id: practiceSet.student_id };
    return { found: false, error: `No student found with external ID: ${externalId}` };
  }

  return { found: false, error: "Must provide student_email, student_external_id, or student_id" };
}

async function createPracticeSet(
  payload: DirectStudentPayload,
  studentId: string,
  supabase: SupabaseClient
): Promise<{ success: boolean; practice_set_id?: string; error?: string }> {
  const { data: practiceSet, error: setError } = await supabase
    .from("practice_sets")
    .insert({
      student_id: studentId,
      title: payload.title,
      description: payload.description || null,
      skill_tags: payload.skill_tags || null,
      xp_reward: payload.xp_reward || 50,
      coin_reward: payload.coin_reward || 25,
      printable_url: payload.printable_url || null,
      external_ref: payload.external_ref || null,
      source: payload.source || "external_api",
      status: "pending",
      total_questions: payload.questions?.length || 0,
    })
    .select("id")
    .single();

  if (setError) return { success: false, error: setError.message };

  if (payload.questions && payload.questions.length > 0) {
    const questionsToInsert = payload.questions.map((q: QuestionPayload, index: number) => ({
      practice_set_id: practiceSet.id,
      prompt: q.prompt,
      question_type: q.question_type || "short_answer",
      options: q.options || null,
      answer_key: q.answer_key,
      difficulty: q.difficulty || 1,
      hint: q.hint || null,
      skill_tag: q.skill_tag || null,
      order_index: index,
    }));

    await supabase.from("practice_questions").insert(questionsToInsert);
  }

  await supabase.from("notifications").insert({
    user_id: studentId,
    type: "new_practice",
    title: "📝 New Practice Assigned!",
    message: `You have new practice work: "${payload.title}"`,
    icon: "📝",
    data: { practice_set_id: practiceSet.id, title: payload.title },
  });

  return { success: true, practice_set_id: practiceSet.id };
}

async function createAssignment(
  payload: AssignmentPayload,
  supabase: SupabaseClient
): Promise<{ success: boolean; assignment_id?: string; error?: string }> {
  let standardId = payload.standard_id || null;
  if (!standardId && payload.standard_code) {
    standardId = await findStandardByCode(payload.standard_code, supabase);
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .insert({
      class_id: payload.class_id,
      title: payload.title,
      description: payload.description || null,
      due_at: payload.due_at,
      standard_id: standardId,
      subject: payload.subject || null,
      xp_reward: payload.xp_reward || 50,
      coin_reward: payload.coin_reward || 25,
      printable_url: payload.printable_url || null,
      external_ref: payload.external_ref || null,
      status: "active",
    })
    .select("id")
    .single();

  if (assignmentError) return { success: false, error: assignmentError.message };

  if (payload.questions && payload.questions.length > 0) {
    const questionsToInsert = payload.questions.map((q: QuestionPayload, index: number) => ({
      assignment_id: assignment.id,
      prompt: q.prompt,
      question_type: q.question_type || "short_answer",
      options: q.options || null,
      answer_key: q.answer_key,
      difficulty: q.difficulty || 1,
      hint: q.hint || null,
      skill_tag: q.skill_tag || null,
      order_index: index,
    }));

    await supabase.from("questions").insert(questionsToInsert);
  }

  return { success: true, assignment_id: assignment.id };
}

// ============================================================================
// Main Handler
// ============================================================================

async function handleTeacherPush(req: Request, ctx: MiddlewareContext): Promise<Response> {
  // Only allow POST
  if (req.method !== "POST") {
    return createErrorResponse("INVALID_REQUEST", "Method not allowed. Use POST.", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
      status: 405,
    });
  }

  const supabase = createServiceClient();

  // Verify API key
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return createErrorResponse("UNAUTHORIZED", "Missing x-api-key header", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
    });
  }

  const { valid, tokenData } = await verifyApiKey(apiKey, supabase);
  if (!valid || !tokenData) {
    return createErrorResponse("UNAUTHORIZED", "Invalid or inactive API key", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
    });
  }

  const body = await req.json();

  // Route based on payload structure or action
  if (body.assignments && Array.isArray(body.assignments)) {
    // Bulk assignment creation
    const results = [];
    for (const assignment of body.assignments) {
      const result = await createAssignment(assignment, supabase);
      results.push({ title: assignment.title, ...result });
    }

    const successful = results.filter((r: { success: boolean }) => r.success).length;
    const failed = results.filter((r: { success: boolean }) => !r.success).length;

    return createSuccessResponse(
      { message: `Created ${successful} assignments, ${failed} failed`, results },
      { cors: ctx.corsHeaders, requestId: ctx.requestId }
    );
  }

  if (body.class_id && body.title && !body.action) {
    // Single assignment creation
    const result = await createAssignment(body as AssignmentPayload, supabase);

    if (!result.success) {
      return createErrorResponse("INTERNAL_ERROR", result.error || "Failed to create assignment", {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    return createSuccessResponse(
      { message: "Assignment created successfully", assignment_id: result.assignment_id },
      { cors: ctx.corsHeaders, requestId: ctx.requestId, status: 201 }
    );
  }

  // Action-based routing
  const action = body.action;

  if (action === "list_classes") {
    const { data: classes, error } = await supabase
      .from("classes")
      .select("id, name, class_code, grade_level, grade_band, subject")
      .eq("teacher_id", tokenData.created_by);

    if (error) {
      return createErrorResponse("DATABASE_ERROR", error.message, {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    return createSuccessResponse({ classes }, { cors: ctx.corsHeaders, requestId: ctx.requestId });
  }

  if (action === "list_standards") {
    let query = supabase.from("nys_standards").select("id, code, standard_text, subject, grade_band, domain");
    if (body.grade_band) query = query.eq("grade_band", body.grade_band);
    if (body.subject) query = query.eq("subject", body.subject);

    const { data: standards, error } = await query.limit(100);

    if (error) {
      return createErrorResponse("DATABASE_ERROR", error.message, {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    return createSuccessResponse({ standards }, { cors: ctx.corsHeaders, requestId: ctx.requestId });
  }

  if (action === "get_student_progress") {
    const { class_id, student_id } = body;

    if (!class_id) {
      return createErrorResponse("MISSING_REQUIRED_FIELD", "class_id is required", {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    let studentsQuery = supabase
      .from("enrollments")
      .select(`student_id, profiles!inner(id, full_name)`)
      .eq("class_id", class_id);

    if (student_id) studentsQuery = studentsQuery.eq("student_id", student_id);

    const { data: enrollments, error: enrollError } = await studentsQuery;

    if (enrollError) {
      return createErrorResponse("DATABASE_ERROR", enrollError.message, {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    const progressData = [];
    for (const enrollment of enrollments || []) {
      const { data: studentProfile } = await supabase
        .from("student_profiles")
        .select("xp, coins, current_streak")
        .eq("user_id", enrollment.student_id)
        .single();

      const { data: attempts } = await supabase
        .from("attempts")
        .select("assignment_id, status, score")
        .eq("student_id", enrollment.student_id);

      const { data: mastery } = await supabase
        .from("student_standard_mastery")
        .select("standard_id, mastery_level, attempts_count, correct_count")
        .eq("student_id", enrollment.student_id);

      progressData.push({
        student_id: enrollment.student_id,
        name: (enrollment as { profiles?: { full_name?: string } }).profiles?.full_name,
        xp: studentProfile?.xp || 0,
        coins: studentProfile?.coins || 0,
        streak: studentProfile?.current_streak || 0,
        assignments_completed: attempts?.filter((a: { status: string }) => a.status === "verified").length || 0,
        average_score: attempts?.length
          ? Math.round(attempts.reduce((sum: number, a: { score?: number }) => sum + (a.score || 0), 0) / attempts.length)
          : 0,
        standards_mastered: mastery?.filter((m: { mastery_level: string }) => m.mastery_level === "mastered").length || 0,
      });
    }

    return createSuccessResponse({ students: progressData }, { cors: ctx.corsHeaders, requestId: ctx.requestId });
  }

  if (action === "pre_register_students") {
    const { class_id, students } = body;

    if (!class_id) {
      return createErrorResponse("MISSING_REQUIRED_FIELD", "class_id is required", {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    if (!students || !Array.isArray(students) || students.length === 0) {
      return createErrorResponse("VALIDATION_ERROR", "students array is required with at least one student", {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id, name")
      .eq("id", class_id)
      .eq("teacher_id", tokenData.created_by)
      .single();

    if (classError || !classData) {
      return createErrorResponse("NOT_FOUND", "Class not found or you don't have access", {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    const results = [];
    const { data: usersData } = await supabase.auth.admin.listUsers();

    for (const student of students) {
      const email = student.email?.toLowerCase();
      if (!email) {
        results.push({ email: null, success: false, error: "Email is required" });
        continue;
      }

      const existingAuthUser = usersData?.users?.find(
        (u: { email?: string }) => u.email?.toLowerCase() === email
      );

      if (existingAuthUser) {
        const { error: enrollError } = await supabase
          .from("enrollments")
          .insert({ student_id: existingAuthUser.id, class_id })
          .select()
          .single();

        if (enrollError && !enrollError.message.includes("duplicate")) {
          results.push({ email, success: false, error: enrollError.message });
        } else {
          results.push({ email, success: true, status: "enrolled_immediately" });
        }
      } else {
        const { error: pendingError } = await supabase
          .from("pending_enrollments")
          .upsert(
            { email, class_id, teacher_id: tokenData.created_by, student_name: student.name || null },
            { onConflict: "email,class_id" }
          );

        if (pendingError) {
          results.push({ email, success: false, error: pendingError.message });
        } else {
          results.push({ email, success: true, status: "pending_signup" });
        }
      }
    }

    const successful = results.filter((r: { success: boolean }) => r.success).length;
    const pending = results.filter((r: { status?: string }) => r.status === "pending_signup").length;
    const enrolled = results.filter((r: { status?: string }) => r.status === "enrolled_immediately").length;

    return createSuccessResponse(
      {
        message: `Processed ${successful} students: ${enrolled} enrolled immediately, ${pending} pending signup`,
        class_name: classData.name,
        results,
      },
      { cors: ctx.corsHeaders, requestId: ctx.requestId }
    );
  }

  if (action === "list_pending_enrollments") {
    let query = supabase
      .from("pending_enrollments")
      .select("id, email, student_name, class_id, created_at, processed, processed_at, classes(name)")
      .eq("teacher_id", tokenData.created_by);

    if (body.class_id) query = query.eq("class_id", body.class_id);

    const { data: pending, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return createErrorResponse("DATABASE_ERROR", error.message, {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    return createSuccessResponse(
      {
        pending_enrollments: pending,
        total: pending?.length || 0,
        unprocessed: pending?.filter((p: { processed?: boolean }) => !p.processed).length || 0,
      },
      { cors: ctx.corsHeaders, requestId: ctx.requestId }
    );
  }

  if (action === "create_class") {
    const { name, grade_level, grade_band, subject } = body;

    if (!name) {
      return createErrorResponse("MISSING_REQUIRED_FIELD", "Class name is required", {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    const classCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: newClass, error: createError } = await supabase
      .from("classes")
      .insert({
        name,
        teacher_id: tokenData.created_by,
        class_code: classCode,
        grade_level: grade_level || null,
        grade_band: grade_band || null,
        subject: subject || null,
      })
      .select()
      .single();

    if (createError) {
      return createErrorResponse("DATABASE_ERROR", createError.message, {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    return createSuccessResponse(
      { message: "Class created successfully", class: newClass },
      { cors: ctx.corsHeaders, requestId: ctx.requestId, status: 201 }
    );
  }

  if (action === "push_to_student") {
    const { student_email, student_external_id, student_id, title } = body;

    if (!title) {
      return createErrorResponse("MISSING_REQUIRED_FIELD", "title is required", {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    const studentResult = await findStudent(supabase, student_email, student_external_id, student_id);

    if (!studentResult.found) {
      return createErrorResponse("NOT_FOUND", studentResult.error || "Student not found", {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
        details: { hint: "Student must have a ScholarQuest account first" },
      });
    }

    const result = await createPracticeSet(body as DirectStudentPayload, studentResult.student_id!, supabase);

    if (!result.success) {
      return createErrorResponse("INTERNAL_ERROR", result.error || "Failed to create practice set", {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    return createSuccessResponse(
      {
        message: "Practice work pushed to student successfully",
        practice_set_id: result.practice_set_id,
        student_id: studentResult.student_id,
      },
      { cors: ctx.corsHeaders, requestId: ctx.requestId, status: 201 }
    );
  }

  if (action === "bulk_push_to_students") {
    const { students, title, description, skill_tags, xp_reward, coin_reward, printable_url, external_ref, source, questions } = body;

    if (!title) {
      return createErrorResponse("MISSING_REQUIRED_FIELD", "title is required", {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    if (!students || !Array.isArray(students) || students.length === 0) {
      return createErrorResponse("VALIDATION_ERROR", "students array is required with at least one student identifier", {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
      });
    }

    const results = [];
    for (const studentRef of students) {
      const email = typeof studentRef === "string" ? studentRef : studentRef.email;
      const extId = typeof studentRef === "object" ? studentRef.external_id : undefined;
      const sId = typeof studentRef === "object" ? studentRef.student_id : undefined;

      const studentResult = await findStudent(supabase, email, extId, sId);

      if (!studentResult.found) {
        results.push({ identifier: email || extId || sId, success: false, error: studentResult.error });
        continue;
      }

      const payload: DirectStudentPayload = {
        title,
        description,
        skill_tags,
        xp_reward,
        coin_reward,
        printable_url,
        external_ref: external_ref ? `${external_ref}_${studentResult.student_id}` : undefined,
        source,
        questions,
      };

      const result = await createPracticeSet(payload, studentResult.student_id!, supabase);
      results.push({
        identifier: email || extId || sId,
        student_id: studentResult.student_id,
        success: result.success,
        practice_set_id: result.practice_set_id,
        error: result.error,
      });
    }

    const successful = results.filter((r: { success: boolean }) => r.success).length;
    const failed = results.filter((r: { success: boolean }) => !r.success).length;

    return createSuccessResponse(
      { message: `Pushed to ${successful} students, ${failed} failed`, results },
      { cors: ctx.corsHeaders, requestId: ctx.requestId }
    );
  }

  if (action === "find_student") {
    const { student_email, student_external_id, student_id } = body;
    const result = await findStudent(supabase, student_email, student_external_id, student_id);

    if (!result.found) {
      return createSuccessResponse(
        { found: false, error: result.error },
        { cors: ctx.corsHeaders, requestId: ctx.requestId }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", result.student_id)
      .single();

    const { data: studentProfile } = await supabase
      .from("student_profiles")
      .select("xp, coins, current_streak")
      .eq("user_id", result.student_id)
      .single();

    return createSuccessResponse(
      {
        found: true,
        student: {
          id: result.student_id,
          name: profile?.full_name,
          xp: studentProfile?.xp || 0,
          coins: studentProfile?.coins || 0,
          streak: studentProfile?.current_streak || 0,
        },
      },
      { cors: ctx.corsHeaders, requestId: ctx.requestId }
    );
  }

  return createErrorResponse("INVALID_REQUEST", "Invalid request body", {
    cors: ctx.corsHeaders,
    requestId: ctx.requestId,
    details: {
      hint: "Available actions: 'push_to_student' | 'bulk_push_to_students' | 'find_student' | 'list_classes' | 'list_standards' | 'get_student_progress' | 'pre_register_students' | 'list_pending_enrollments' | 'create_class'. Or send assignment with class_id and title.",
    },
  });
}

// Create and export the handler with middleware
Deno.serve(
  createHandler(handleTeacherPush, {
    middleware: [logRequest],
  })
);
