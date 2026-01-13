import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";

interface PracticeQuestion {
  id: string;
  prompt: string;
  question_type: string;
  options: any;
  order_index: number;
}

interface PracticeSetData {
  id: string;
  title: string;
  description: string | null;
  skill_tags: string[] | null;
}

export default function PrintableWorksheet() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [practiceSet, setPracticeSet] = useState<PracticeSetData | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setStudentName(profile.full_name);
        }
      }

      const { data: set } = await supabase
        .from("practice_sets")
        .select("id, title, description, skill_tags")
        .eq("id", id)
        .single();

      if (set) {
        setPracticeSet(set);
      }

      const { data: questionsData } = await supabase
        .from("practice_questions")
        .select("id, prompt, question_type, options, order_index")
        .eq("practice_set_id", id)
        .order("order_index", { ascending: true });

      if (questionsData) {
        setQuestions(questionsData.map(q => ({
          ...q,
          options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : null,
        })));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Print controls - hidden when printing */}
      <div className="print:hidden bg-gray-100 border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print Worksheet
          </Button>
        </div>
      </div>

      {/* Printable Content */}
      <div className="container mx-auto px-8 py-8 max-w-3xl">
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{practiceSet?.title}</h1>
              {practiceSet?.description && (
                <p className="text-gray-600 mt-1">{practiceSet.description}</p>
              )}
              {practiceSet?.skill_tags && practiceSet.skill_tags.length > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Skills: {practiceSet.skill_tags.join(", ")}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">NYCLogic Scholar AI</p>
              <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="mt-4 flex gap-8">
            <div className="flex-1">
              <label className="text-sm text-gray-600">Name:</label>
              <div className="border-b border-gray-400 h-8 flex items-end">
                <span className="text-gray-800">{studentName}</span>
              </div>
            </div>
            <div className="w-32">
              <label className="text-sm text-gray-600">Date:</label>
              <div className="border-b border-gray-400 h-8"></div>
            </div>
            <div className="w-24">
              <label className="text-sm text-gray-600">Score:</label>
              <div className="border-b border-gray-400 h-8 flex items-end justify-center">
                <span className="text-gray-400">/ {questions.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-8">
          {questions.map((question, idx) => (
            <div key={question.id} className="page-break-inside-avoid">
              <div className="flex gap-4">
                <span className="font-bold text-gray-800 text-lg">{idx + 1}.</span>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium mb-3">{question.prompt}</p>
                  
                  {question.question_type === "multiple_choice" && question.options && (
                    <div className="space-y-2 ml-4">
                      {(question.options as string[]).map((option, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-3">
                          <div className="w-5 h-5 border-2 border-gray-400 rounded-full flex-shrink-0" />
                          <span className="text-gray-800">{option}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.question_type === "short_answer" && (
                    <div className="mt-2 space-y-2">
                      <div className="border-b border-gray-300 h-8"></div>
                      <div className="border-b border-gray-300 h-8"></div>
                    </div>
                  )}

                  {question.question_type === "numeric" && (
                    <div className="mt-2">
                      <div className="border border-gray-300 rounded h-12 w-32 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">Answer</span>
                      </div>
                    </div>
                  )}

                  {question.question_type === "drag_order" && question.options && (
                    <div className="mt-2 space-y-2">
                      <p className="text-sm text-gray-600 mb-2">
                        Put in order (number 1 to {(question.options as string[]).length}):
                      </p>
                      {(question.options as string[]).map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-center gap-3">
                          <div className="w-8 h-8 border border-gray-400 rounded flex-shrink-0 flex items-center justify-center">
                            <span className="text-gray-400 text-sm">#</span>
                          </div>
                          <span className="text-gray-800">{item}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.question_type === "matching" && question.options && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-2">
                        Draw lines to match, or write the letter:
                      </p>
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                          {(question.options as { left: string; right: string }[]).map((pair, pairIdx) => (
                            <div key={pairIdx} className="flex items-center gap-2">
                              <span className="font-medium">{pairIdx + 1}.</span>
                              <span>{pair.left}</span>
                              <div className="flex-1 border-b border-dashed border-gray-300"></div>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-3">
                          {(question.options as { left: string; right: string }[])
                            .map((pair, pairIdx) => ({ ...pair, letter: String.fromCharCode(65 + pairIdx) }))
                            .sort(() => Math.random() - 0.5)
                            .map((pair, pairIdx) => (
                              <div key={pairIdx} className="flex items-center gap-2">
                                <span className="font-medium">{pair.letter}.</span>
                                <span>{pair.right}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {question.question_type === "fill_blank" && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-2">Fill in the blanks:</p>
                      <p className="text-gray-800 leading-relaxed">
                        {question.prompt.split(/_{2,}/).map((part, partIdx, arr) => (
                          <span key={partIdx}>
                            {part}
                            {partIdx < arr.length - 1 && (
                              <span className="inline-block border-b-2 border-gray-400 w-24 mx-1"></span>
                            )}
                          </span>
                        ))}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-gray-300 text-center text-sm text-gray-500">
          <p>Generated by NYCLogic Scholar AI • For classroom use only</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            margin: 0.75in;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
