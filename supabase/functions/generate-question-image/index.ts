/**
 * Generate Question Image Edge Function
 *
 * Generates educational diagrams and illustrations for Regents exam questions
 * using the Lovable AI gateway.
 */

import {
  createHandler,
  logRequest,
  parseBody,
  createSuccessResponse,
  createErrorResponse,
  type MiddlewareContext,
} from "../_shared/index.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ============================================================================
// Types & Validation
// ============================================================================

const GenerateImageRequestSchema = z.object({
  imagePrompt: z.string().min(1, "imagePrompt is required"),
  questionId: z.string().optional(),
  subject: z.string().optional(),
});

type GenerateImageRequest = z.infer<typeof GenerateImageRequestSchema>;

// ============================================================================
// Constants
// ============================================================================

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const IMAGE_MODEL = "google/gemini-2.5-flash-image-preview";

// ============================================================================
// Main Handler
// ============================================================================

async function handleGenerateQuestionImage(
  _req: Request,
  ctx: MiddlewareContext
): Promise<Response> {
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

  if (!lovableApiKey) {
    console.error("LOVABLE_API_KEY is not configured");
    return createErrorResponse("SERVICE_UNAVAILABLE", "AI service not configured", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
    });
  }

  const { imagePrompt, questionId, subject } = ctx.body as GenerateImageRequest;

  console.log(`Generating image for question ${questionId} in ${subject}: ${imagePrompt}`);

  // Call AI gateway to generate image
  const response = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      messages: [
        {
          role: "user",
          content: `Generate a clear, educational diagram or illustration for a Regents exam question. The image should be simple, clean, and suitable for a high school student. ${imagePrompt}`,
        },
      ],
      modalities: ["image", "text"],
    }),
  });

  if (!response.ok) {
    const status = response.status;
    const errorText = await response.text();
    console.error(`AI gateway error: ${status} - ${errorText}`);

    if (status === 429) {
      return createErrorResponse("RATE_LIMITED", "Rate limit exceeded. Please try again later.", {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
        status: 429,
      });
    }

    if (status === 402) {
      return createErrorResponse("PAYMENT_REQUIRED", "AI credits depleted. Please add more credits.", {
        cors: ctx.corsHeaders,
        requestId: ctx.requestId,
        status: 402,
      });
    }

    return createErrorResponse("EXTERNAL_SERVICE_ERROR", "Failed to generate image", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
    });
  }

  const data = await response.json();
  console.log("AI response received successfully");

  // Extract the image from the response
  const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

  if (!imageUrl) {
    console.error("No image in response:", JSON.stringify(data));
    return createErrorResponse("EXTERNAL_SERVICE_ERROR", "No image generated", {
      cors: ctx.corsHeaders,
      requestId: ctx.requestId,
      details: { response: data },
    });
  }

  console.log(`Image generated successfully for question ${questionId}`);

  return createSuccessResponse(
    { imageUrl, questionId, subject },
    { cors: ctx.corsHeaders, requestId: ctx.requestId }
  );
}

// Create and export the handler with middleware
Deno.serve(
  createHandler(handleGenerateQuestionImage, {
    middleware: [logRequest, parseBody(GenerateImageRequestSchema)],
  })
);
