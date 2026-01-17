import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ImageIcon, RefreshCw, AlertCircle, ZoomIn, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuestionImage } from '@/hooks/useQuestionImage';
import { cn } from '@/lib/utils';

interface QuestionImageProps {
  questionId: string;
  imagePrompt?: string;
  subject?: string;
  className?: string;
}

export function QuestionImage({ 
  questionId, 
  imagePrompt, 
  subject,
  className 
}: QuestionImageProps) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const { imageUrl, isLoading, error, generateImage } = useQuestionImage({
    questionId,
    imagePrompt,
    subject,
    enabled: !!imagePrompt,
  });

  // Don't render anything if no image prompt
  if (!imagePrompt) {
    return null;
  }

  return (
    <>
      <div className={cn(
        "relative rounded-lg overflow-hidden bg-muted/50 border border-border",
        className
      )}>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-8 min-h-[200px]"
            >
              <div className="relative">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <div className="absolute inset-0 animate-ping">
                  <ImageIcon className="w-8 h-8 text-primary/30" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">Generating diagram...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-6 min-h-[150px]"
            >
              <AlertCircle className="w-8 h-8 text-destructive mb-2" />
              <p className="text-sm text-muted-foreground text-center mb-3">{error}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={generateImage}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </Button>
            </motion.div>
          ) : imageUrl ? (
            <motion.div
              key="image"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="relative group"
            >
              <img
                src={imageUrl}
                alt="Question diagram"
                className="w-full h-auto max-h-[300px] object-contain"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity gap-2"
                  onClick={() => setShowFullscreen(true)}
                >
                  <ZoomIn className="w-4 h-4" />
                  Expand
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-6 min-h-[150px]"
            >
              <ImageIcon className="w-8 h-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground text-center mb-3">
                Diagram not loaded
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={generateImage}
                className="gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                Load Diagram
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {showFullscreen && imageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowFullscreen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={imageUrl}
                alt="Question diagram"
                className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => setShowFullscreen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
