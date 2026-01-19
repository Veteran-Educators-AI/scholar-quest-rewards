/**
 * AI Gateway integration for Lovable AI.
 * Provides consistent interface for AI-powered features.
 */

import { AI_GATEWAY } from "./constants.ts";
import { AppError } from "./errors.ts";

/**
 * AI chat message structure.
 */
export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Options for AI completion requests.
 */
export interface AiCompletionOptions {
  model?: string;
  messages: AiMessage[];
  maxTokens?: number;
  temperature?: number;
}

/**
 * Response from AI completion.
 */
export interface AiCompletionResponse {
  content: string;
  finishReason: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Gets the Lovable API key from environment.
 *
 * @returns API key
 * @throws AppError if key is not configured
 */
function getApiKey(): string {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    throw new AppError(
      "SERVICE_UNAVAILABLE",
      "LOVABLE_API_KEY is not configured"
    );
  }
  return apiKey;
}

/**
 * Makes a chat completion request to the AI gateway.
 *
 * @param options - Completion options
 * @returns AI completion response
 * @throws AppError on rate limit, credits exhausted, or other errors
 */
export async function createChatCompletion(
  options: AiCompletionOptions
): Promise<AiCompletionResponse> {
  const {
    model = AI_GATEWAY.DEFAULT_MODEL,
    messages,
    maxTokens = AI_GATEWAY.MAX_TOKENS_DEFAULT,
    temperature = AI_GATEWAY.TEMPERATURE_DEFAULT,
  } = options;

  const apiKey = getApiKey();

  const response = await fetch(AI_GATEWAY.URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    await handleAiError(response);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new AppError("EXTERNAL_SERVICE_ERROR", "No response from AI");
  }

  return {
    content,
    finishReason: data.choices?.[0]?.finish_reason ?? "unknown",
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined,
  };
}

/**
 * Handles AI gateway errors.
 *
 * @param response - Fetch response with error
 * @throws AppError with appropriate error code
 */
async function handleAiError(response: Response): Promise<never> {
  const status = response.status;

  if (status === 429) {
    throw new AppError("RATE_LIMITED", "AI rate limit exceeded. Please try again later.");
  }

  if (status === 402) {
    throw new AppError("CREDITS_EXHAUSTED", "AI credits exhausted. Please add credits to continue.");
  }

  // Try to get error details from response
  let errorMessage = "AI gateway error";
  try {
    const errorData = await response.text();
    console.error("AI gateway error:", status, errorData);
    errorMessage = `AI gateway error: ${status}`;
  } catch {
    // Ignore parse errors
  }

  throw new AppError("EXTERNAL_SERVICE_ERROR", errorMessage);
}

/**
 * Extracts JSON from AI response content.
 * AI sometimes wraps JSON in markdown code blocks.
 *
 * @param content - AI response content
 * @returns Parsed JSON object
 * @throws Error if no valid JSON found
 */
export function extractJson<T>(content: string): T {
  // Try to find JSON in the content
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]) as T;
  }

  // Try to find JSON array
  const arrayMatch = content.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return JSON.parse(arrayMatch[0]) as T;
  }

  throw new Error("No valid JSON found in AI response");
}

/**
 * Creates a system prompt for a specific task.
 *
 * @param basePrompt - Base system prompt
 * @param responseFormat - Expected response format
 * @returns Complete system prompt
 */
export function createSystemPrompt(
  basePrompt: string,
  responseFormat?: string
): string {
  let prompt = basePrompt;

  if (responseFormat) {
    prompt += `\n\nRespond with JSON only: ${responseFormat}`;
  }

  return prompt;
}

/**
 * Pre-built system prompts for common tasks.
 */
export const SYSTEM_PROMPTS = {
  GRADING: `You are a friendly teacher grading student work. Be encouraging but accurate.
Given a question, the correct answer(s), and a student's answer, determine if the student's answer is correct.
Consider spelling variations, equivalent answers, and partial credit for short answers.`,

  STUDY_PLAN: `You are an expert educational advisor creating personalized study plans.
Analyze student performance data and create actionable, encouraging study recommendations.
Focus on areas needing improvement while acknowledging strengths.`,

  ALGEBRA_TUTOR: `You are an expert Algebra tutor aligned with New York State Regents standards.
Your teaching style is:
- Patient and encouraging
- Uses step-by-step explanations
- Provides multiple approaches when helpful
- Relates concepts to real-world examples
- Uses proper mathematical notation
- Adapts to the student's level

Format your responses with clear structure using markdown:
- Use **bold** for key terms
- Use bullet points for steps
- Use LaTeX notation for equations when needed (wrap in $ for inline, $$ for display)`,
} as const;

/**
 * Result type for grading AI responses.
 */
export interface GradingResult {
  isCorrect: boolean;
  feedback: string;
}

/**
 * Grades a short answer question using AI.
 *
 * @param studentAnswer - Student's answer
 * @param correctAnswer - Correct answer(s)
 * @param prompt - Question prompt
 * @returns Grading result with correctness and feedback
 */
export async function gradeShortAnswer(
  studentAnswer: string,
  correctAnswer: string | string[],
  prompt: string
): Promise<GradingResult> {
  try {
    const response = await createChatCompletion({
      messages: [
        {
          role: "system",
          content: createSystemPrompt(
            SYSTEM_PROMPTS.GRADING,
            '{"isCorrect": boolean, "feedback": "brief encouraging feedback"}'
          ),
        },
        {
          role: "user",
          content: `Question: ${prompt}
Correct Answer(s): ${JSON.stringify(correctAnswer)}
Student's Answer: ${studentAnswer}

Is this correct?`,
        },
      ],
      temperature: AI_GATEWAY.TEMPERATURE_GRADING,
    });

    const result = extractJson<GradingResult>(response.content);
    return {
      isCorrect: result.isCorrect === true,
      feedback: result.feedback || (result.isCorrect ? "Correct!" : "Not quite right."),
    };
  } catch (error) {
    console.error("AI grading error:", error);

    // Fallback to simple string matching
    const normalizedStudent = studentAnswer.toLowerCase().trim();
    const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
    const isCorrect = correctAnswers.some(
      (ans) => normalizedStudent === ans.toLowerCase().trim()
    );

    return {
      isCorrect,
      feedback: isCorrect ? "Correct!" : "Not quite right.",
    };
  }
}
