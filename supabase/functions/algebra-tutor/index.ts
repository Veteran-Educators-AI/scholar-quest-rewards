/**
 * Algebra Tutor Edge Function
 *
 * Provides AI-powered tutoring for Algebra 1 and Algebra 2 students
 * aligned with New York State Regents standards.
 */

import {
  createHandler,
  logRequest,
  parseBody,
  createSuccessResponse,
  createChatCompletion,
  SYSTEM_PROMPTS,
  AlgebraTutorRequestSchema,
  type MiddlewareContext,
  type AlgebraTutorRequest,
} from "../_shared/index.ts";

/**
 * Builds the user prompt based on request type.
 */
function buildUserPrompt(request: AlgebraTutorRequest): string {
  const { type, topic, course, problem, studentAnswer, context } = request;

  switch (type) {
    case "explain":
      return `Please explain the concept of "${topic}" in ${course}.
${context ? `Additional context: ${context}` : ""}

Include:
1. A clear definition
2. Key formulas or rules (with explanations of each part)
3. A worked example with step-by-step solution
4. Common mistakes to avoid
5. When this concept appears on the Regents exam`;

    case "hint":
      return `The student is working on this ${course} problem about ${topic}:

Problem: ${problem}

Please provide a helpful hint that:
1. Identifies what type of problem this is
2. Suggests the first step or approach
3. Reminds them of relevant formulas or concepts
4. Does NOT give away the answer

Keep the hint encouraging and concise.`;

    case "check":
      return `The student is solving this ${course} problem about ${topic}:

Problem: ${problem}
Student's Answer: ${studentAnswer}

Please:
1. Determine if the answer is correct
2. If correct: congratulate them and briefly explain why the solution works
3. If incorrect:
   - Gently point out where the error occurred
   - Explain the correct approach
   - Show the correct solution with steps
   - Provide a similar practice problem they can try`;

    case "practice":
      return `Generate 3 practice problems for ${course} on the topic of "${topic}".

For each problem:
1. Write a clear problem statement
2. Indicate difficulty (Easy/Medium/Hard)
3. Provide the correct answer
4. Include a brief explanation of the solution approach

Make sure problems vary in difficulty and cover different aspects of the topic.`;

    default:
      // Zod validation ensures this never happens
      throw new Error(`Unknown request type: ${type as string}`);
  }
}

/**
 * Builds the system prompt with type-specific additions.
 */
function buildSystemPrompt(type: AlgebraTutorRequest["type"], course: string): string {
  const basePrompt = SYSTEM_PROMPTS.ALGEBRA_TUTOR.replace(
    "Algebra tutor",
    `${course} tutor`
  );

  const typeAdditions: Record<AlgebraTutorRequest["type"], string> = {
    explain: "\n\nYou are explaining a mathematical concept. Be thorough but not overwhelming.",
    hint: "\n\nYou are providing a hint without giving away the answer. Lead the student to discover the solution themselves.",
    check: "\n\nYou are checking a student's answer. Be encouraging even if wrong, and explain clearly.",
    practice: "\n\nYou are generating practice problems. Create problems appropriate for Regents exam preparation.",
  };

  return basePrompt + typeAdditions[type];
}

/**
 * Response structure for the tutor.
 */
interface TutorResponse {
  type: AlgebraTutorRequest["type"];
  topic: string;
  course: string;
  response: string;
}

/**
 * Main handler for algebra tutoring requests.
 */
async function handleAlgebraTutor(
  _req: Request,
  ctx: MiddlewareContext
): Promise<Response> {
  const request = ctx.body as AlgebraTutorRequest;
  const { type, topic, course } = request;

  console.log(`Algebra tutor request: ${type} for ${topic} (${course})`);

  const systemPrompt = buildSystemPrompt(type, course);
  const userPrompt = buildUserPrompt(request);

  const aiResponse = await createChatCompletion({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const result: TutorResponse = {
    type,
    topic,
    course,
    response: aiResponse.content,
  };

  return createSuccessResponse(result, {
    cors: ctx.corsHeaders,
    requestId: ctx.requestId,
  });
}

// Create and export the handler with middleware
Deno.serve(
  createHandler(handleAlgebraTutor, {
    middleware: [logRequest, parseBody(AlgebraTutorRequestSchema)],
  })
);
