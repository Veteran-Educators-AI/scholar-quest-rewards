import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bot, 
  Send, 
  Loader2, 
  Lightbulb, 
  BookOpen, 
  CheckCircle,
  X,
  Sparkles,
  MessageSquare,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AlgebraTutorProps {
  course: "Algebra 1" | "Algebra 2";
  currentTopic?: string;
  currentProblem?: string;
  onClose: () => void;
  isOpen: boolean;
}

export function AlgebraTutor({ 
  course, 
  currentTopic = "", 
  currentProblem = "",
  onClose,
  isOpen
}: AlgebraTutorProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `Hi! I'm your ${course} tutor. I can help you with:\n\n• **Explaining concepts** - Ask me about any topic\n• **Getting hints** - If you're stuck on a problem\n• **Checking answers** - Tell me your solution and I'll verify it\n• **Practice problems** - I can generate more problems for you\n\nHow can I help you today?`
      }]);
    }
  }, [isOpen, course, messages.length]);

  const sendMessage = async (type: "explain" | "hint" | "check" | "practice", customMessage?: string) => {
    const messageText = customMessage || input;
    if (!messageText.trim() && type !== "hint" && type !== "practice") return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText || (type === "hint" ? "I need a hint for this problem" : "Give me practice problems")
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("algebra-tutor", {
        body: {
          type,
          topic: currentTopic || messageText,
          course,
          problem: currentProblem || messageText,
          studentAnswer: type === "check" ? messageText : undefined,
          context: messages.slice(-4).map(m => `${m.role}: ${m.content}`).join("\n")
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I apologize, but I couldn't generate a response. Please try again."
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Tutor error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again in a moment."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Detect intent from message
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes("explain") || lowerInput.includes("what is") || lowerInput.includes("how do")) {
      sendMessage("explain", input);
    } else if (lowerInput.includes("hint") || lowerInput.includes("help") || lowerInput.includes("stuck")) {
      sendMessage("hint", input);
    } else if (lowerInput.includes("check") || lowerInput.includes("is this right") || lowerInput.includes("correct")) {
      sendMessage("check", input);
    } else if (lowerInput.includes("practice") || lowerInput.includes("more problems") || lowerInput.includes("quiz me")) {
      sendMessage("practice", input);
    } else {
      sendMessage("explain", input);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-4 right-4 z-50 w-[400px] max-w-[calc(100vw-32px)]"
      >
        <Card className="shadow-2xl border-primary/20">
          <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{course} AI Tutor</CardTitle>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Powered by AI
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Quick Actions */}
            {currentProblem && (
              <div className="px-4 py-2 border-b border-border/50 bg-muted/30">
                <p className="text-xs text-muted-foreground mb-2">Quick actions for current problem:</p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-xs"
                    onClick={() => sendMessage("hint")}
                    disabled={isLoading}
                  >
                    <Lightbulb className="w-3 h-3 mr-1" />
                    Get Hint
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-xs"
                    onClick={() => sendMessage("explain", `Explain the concept behind this problem: ${currentProblem}`)}
                    disabled={isLoading}
                  >
                    <BookOpen className="w-3 h-3 mr-1" />
                    Explain Concept
                  </Button>
                </div>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="h-[300px] p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "flex-row-reverse" : ""
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      message.role === "user" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted"
                    )}>
                      {message.role === "user" ? (
                        <MessageSquare className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    <div className={cn(
                      "rounded-lg px-4 py-2 max-w-[85%]",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}>
                      <div 
                        className="text-sm prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: message.content
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\n/g, '<br/>')
                            .replace(/• /g, '• ')
                        }}
                      />
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-border/50">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Topic Quick Actions */}
              {currentTopic && (
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    <HelpCircle className="w-3 h-3 mr-1" />
                    Topic: {currentTopic}
                  </Badge>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
