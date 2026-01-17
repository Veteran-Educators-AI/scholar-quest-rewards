import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseQuestionImageOptions {
  questionId: string;
  imagePrompt?: string;
  subject?: string;
  enabled?: boolean;
}

interface UseQuestionImageResult {
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
  generateImage: () => Promise<void>;
}

// Cache for generated images to avoid regenerating
const imageCache = new Map<string, string>();

export function useQuestionImage({
  questionId,
  imagePrompt,
  subject,
  enabled = true,
}: UseQuestionImageOptions): UseQuestionImageResult {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check cache first
  useEffect(() => {
    if (imageCache.has(questionId)) {
      setImageUrl(imageCache.get(questionId)!);
    }
  }, [questionId]);

  const generateImage = async () => {
    if (!imagePrompt || !enabled) return;
    
    // Check cache first
    if (imageCache.has(questionId)) {
      setImageUrl(imageCache.get(questionId)!);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-question-image', {
        body: {
          imagePrompt,
          questionId,
          subject,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.imageUrl) {
        // Cache the result
        imageCache.set(questionId, data.imageUrl);
        setImageUrl(data.imageUrl);
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Failed to generate image:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate on mount if enabled and has prompt
  useEffect(() => {
    if (enabled && imagePrompt && !imageUrl && !imageCache.has(questionId)) {
      generateImage();
    }
  }, [questionId, imagePrompt, enabled]);

  return {
    imageUrl,
    isLoading,
    error,
    generateImage,
  };
}

// Utility to clear cache if needed
export function clearImageCache() {
  imageCache.clear();
}
