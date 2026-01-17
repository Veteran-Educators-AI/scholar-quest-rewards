import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GeometryMastery {
  questions_attempted: number;
  questions_correct: number;
  mastery_percentage: number;
  geoblox_unlocked: boolean;
  unlocked_at: string | null;
}

export function useGeobloxAccess() {
  const [loading, setLoading] = useState(true);
  const [mastery, setMastery] = useState<GeometryMastery | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    fetchMastery();
  }, []);

  const fetchMastery = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("geometry_mastery")
        .select("*")
        .eq("student_id", userData.user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching geometry mastery:", error);
      }

      if (data) {
        setMastery({
          questions_attempted: data.questions_attempted,
          questions_correct: data.questions_correct,
          mastery_percentage: Number(data.mastery_percentage),
          geoblox_unlocked: data.geoblox_unlocked,
          unlocked_at: data.unlocked_at,
        });
        setIsUnlocked(data.geoblox_unlocked);
      } else {
        // No record means no progress yet
        setMastery({
          questions_attempted: 0,
          questions_correct: 0,
          mastery_percentage: 0,
          geoblox_unlocked: false,
          unlocked_at: null,
        });
        setIsUnlocked(false);
      }
    } catch (error) {
      console.error("Error in useGeobloxAccess:", error);
    } finally {
      setLoading(false);
    }
  };

  const progressToUnlock = mastery 
    ? Math.min(100, (mastery.mastery_percentage / 70) * 100)
    : 0;

  const questionsNeeded = mastery && mastery.mastery_percentage < 70
    ? Math.max(0, Math.ceil((0.7 * (mastery.questions_attempted + 10) - mastery.questions_correct) / 0.7))
    : 0;

  return {
    loading,
    mastery,
    isUnlocked,
    progressToUnlock,
    questionsNeeded,
    refresh: fetchMastery,
  };
}
