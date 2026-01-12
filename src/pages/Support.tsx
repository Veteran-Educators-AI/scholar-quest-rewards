import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScholarBuddy } from "@/components/ScholarBuddy";
import { ArrowLeft, Lightbulb, BookOpen, MessageCircle, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type SupportMode = "select" | "hints" | "lesson" | "ai";

export default function Support() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get("assignment");
  const [mode, setMode] = useState<SupportMode>("select");
  const [question, setQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const hints = [
    { id: 1, text: "Remember: When multiplying, you can break big numbers into smaller parts!", unlocked: true },
    { id: 2, text: "Try using skip counting - it's like adding the same number over and over.", unlocked: true },
    { id: 3, text: "Draw an array with rows and columns to visualize the multiplication.", unlocked: false },
  ];

  const miniLessons = [
    { id: 1, title: "Multiplication Basics", duration: "3 min", completed: false },
    { id: 2, title: "Times Tables Tricks", duration: "5 min", completed: false },
    { id: 3, title: "Word Problem Strategies", duration: "4 min", completed: false },
  ];

  const handleAskAI = async () => {
    if (!question.trim()) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("scholar-ai-help", {
        body: { question, assignmentId },
      });
      
      if (error) throw error;
      setAiResponse(data?.response || "I'm here to help! Try breaking down the problem into smaller steps.");
    } catch (err) {
      console.error("AI help error:", err);
      setAiResponse("I'm having trouble connecting right now. Here's a tip: Try reading the problem again and identify what you already know!");
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (mode) {
      case "hints":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold text-foreground">💡 Helpful Hints</h2>
            <p className="text-muted-foreground">Use these hints to guide your thinking!</p>
            
            <div className="space-y-3">
              {hints.map((hint, idx) => (
                <motion.div
                  key={hint.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className={hint.unlocked ? "" : "opacity-50"}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
                          <Lightbulb className="w-4 h-4 text-warning" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Hint {hint.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {hint.unlocked ? hint.text : "🔒 Complete more questions to unlock"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case "lesson":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold text-foreground">📚 Mini-Lessons</h2>
            <p className="text-muted-foreground">Quick lessons to boost your skills!</p>
            
            <div className="space-y-3">
              {miniLessons.map((lesson, idx) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="cursor-pointer hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{lesson.title}</p>
                            <p className="text-sm text-muted-foreground">{lesson.duration}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Start</Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case "ai":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold text-foreground">🤖 Ask AI Tutor</h2>
            <p className="text-muted-foreground">Get personalized help with your questions!</p>
            
            <div className="space-y-4">
              <Textarea
                placeholder="Type your question here... For example: 'I don't understand how to multiply 7 x 8'"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="min-h-[100px]"
              />
              
              <Button 
                variant="hero" 
                onClick={handleAskAI} 
                disabled={isLoading || !question.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Ask AI Tutor
                  </>
                )}
              </Button>

              {aiResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary/5 border border-primary/20 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      🤖
                    </div>
                    <div>
                      <p className="font-medium text-primary mb-1">AI Tutor</p>
                      <p className="text-foreground">{aiResponse}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        );

      default:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <ScholarBuddy size="md" message="Need help? I've got you covered! Choose an option below." />
            
            <h2 className="text-xl font-bold text-center text-foreground mt-6">How can I help you?</h2>
            
            <div className="grid gap-4 mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode("hints")}
                className="bg-card rounded-2xl p-5 border-2 border-dashed border-warning/30 hover:border-warning transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                    <Lightbulb className="w-6 h-6 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Hints</h3>
                    <p className="text-sm text-muted-foreground">Get clues to solve problems</p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode("lesson")}
                className="bg-card rounded-2xl p-5 border-2 border-dashed border-primary/30 hover:border-primary transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Mini-Lesson</h3>
                    <p className="text-sm text-muted-foreground">Quick refresher on the topic</p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode("ai")}
                className="bg-gradient-primary rounded-2xl p-5 shadow-glow-primary text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="text-primary-foreground">
                    <h3 className="font-bold">Ask AI Tutor</h3>
                    <p className="text-sm opacity-80">Get personalized help</p>
                  </div>
                </div>
              </motion.button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (mode === "select") {
                  if (assignmentId) {
                    navigate(`/student/assignment/${assignmentId}`);
                  } else {
                    navigate("/student");
                  }
                } else {
                  setMode("select");
                }
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="font-bold text-foreground">Support Center</h1>
            <div className="w-16" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {renderContent()}
      </main>
    </div>
  );
}
