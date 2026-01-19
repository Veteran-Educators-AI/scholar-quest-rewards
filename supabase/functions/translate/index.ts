/**
 * Translate Edge Function
 *
 * Translates text to various languages using AI.
 * Optimized for educational content for children ages 6-14.
 */

import {
  createHandler,
  logRequest,
  parseBody,
  createSuccessResponse,
  createErrorResponse,
  createChatCompletion,
  type MiddlewareContext,
} from "../_shared/index.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

/**
 * Supported language codes and names.
 */
const LANGUAGE_NAMES: Record<string, string> = {
  es: "Spanish",
  ar: "Arabic",
  bn: "Bengali",
  ht: "Haitian Creole",
  zh: "Chinese (Simplified)",
  vi: "Vietnamese",
  pt: "Portuguese",
  fr: "French",
  ko: "Korean",
  ru: "Russian",
} as const;

/**
 * Request schema for translation.
 */
const TranslateRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  targetLanguage: z.string().min(2).max(10),
});

type TranslateRequest = z.infer<typeof TranslateRequestSchema>;

/**
 * Response structure for translation.
 */
interface TranslateResponse {
  translatedText: string;
}

/**
 * Main handler for translation requests.
 */
async function handleTranslate(
  _req: Request,
  ctx: MiddlewareContext
): Promise<Response> {
  const { text, targetLanguage } = ctx.body as TranslateRequest;

  // Don't translate if target is English
  if (targetLanguage === "en") {
    return createSuccessResponse<TranslateResponse>(
      { translatedText: text },
      { cors: ctx.corsHeaders, requestId: ctx.requestId }
    );
  }

  const langName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;

  console.log(`Translating ${text.length} chars to ${langName}`);

  try {
    const response = await createChatCompletion({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        {
          role: "system",
          content: `You are a professional translator for an educational app for children. Translate the following text to ${langName}. Keep the translation simple, friendly, and appropriate for students aged 6-14. Preserve any emojis or special formatting. Only respond with the translated text, nothing else.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.3,
      maxTokens: 500,
    });

    const translatedText = response.content.trim() || text;

    return createSuccessResponse<TranslateResponse>(
      { translatedText },
      { cors: ctx.corsHeaders, requestId: ctx.requestId }
    );
  } catch (error) {
    // Handle AI-specific errors
    if (error instanceof Error) {
      if (error.message.includes("rate limit")) {
        return createErrorResponse("RATE_LIMITED", "Rate limit exceeded, please try again later.", {
          cors: ctx.corsHeaders,
          requestId: ctx.requestId,
        });
      }
      if (error.message.includes("credits")) {
        return createErrorResponse("CREDITS_EXHAUSTED", "Payment required", {
          cors: ctx.corsHeaders,
          requestId: ctx.requestId,
        });
      }
    }
    throw error; // Re-throw for generic error handling
  }
}

// Create and export the handler with middleware
Deno.serve(
  createHandler(handleTranslate, {
    middleware: [logRequest, parseBody(TranslateRequestSchema)],
  })
);
