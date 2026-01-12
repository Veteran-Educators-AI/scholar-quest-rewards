import { supabase } from "@/integrations/supabase/client";

type SyncEventType = "assignment_completed" | "student_progress" | "badge_earned" | "mastery_update";

interface SyncData {
  type: SyncEventType;
  data: Record<string, unknown>;
}

export function useSyncToNYCologic() {
  const syncToNYCologic = async (payload: SyncData) => {
    try {
      const { data, error } = await supabase.functions.invoke("sync-to-nycologic", {
        body: payload,
      });

      if (error) {
        console.error("Sync to NYCologic failed:", error);
        return { success: false, error };
      }

      console.log("Synced to NYCologic:", data);
      return { success: true, data };
    } catch (err) {
      console.error("Sync to NYCologic error:", err);
      return { success: false, error: err };
    }
  };

  const syncAssignmentCompleted = async (params: {
    studentId: string;
    assignmentId: string;
    externalRef?: string;
    score: number;
    totalQuestions: number;
    xpEarned: number;
    coinsEarned: number;
    completedAt: string;
  }) => {
    return syncToNYCologic({
      type: "assignment_completed",
      data: {
        student_id: params.studentId,
        assignment_id: params.assignmentId,
        external_ref: params.externalRef,
        score: params.score,
        total_questions: params.totalQuestions,
        percentage: Math.round((params.score / params.totalQuestions) * 100),
        xp_earned: params.xpEarned,
        coins_earned: params.coinsEarned,
        completed_at: params.completedAt,
      },
    });
  };

  const syncStudentProgress = async (params: {
    studentId: string;
    totalXp: number;
    totalCoins: number;
    currentStreak: number;
    badgesEarned: number;
  }) => {
    return syncToNYCologic({
      type: "student_progress",
      data: {
        student_id: params.studentId,
        total_xp: params.totalXp,
        total_coins: params.totalCoins,
        current_streak: params.currentStreak,
        badges_earned: params.badgesEarned,
      },
    });
  };

  const syncBadgeEarned = async (params: {
    studentId: string;
    badgeId: string;
    badgeName: string;
    earnedAt: string;
  }) => {
    return syncToNYCologic({
      type: "badge_earned",
      data: {
        student_id: params.studentId,
        badge_id: params.badgeId,
        badge_name: params.badgeName,
        earned_at: params.earnedAt,
      },
    });
  };

  const syncMasteryUpdate = async (params: {
    studentId: string;
    standardId: string;
    standardCode: string;
    masteryLevel: string;
    attemptsCount: number;
    correctCount: number;
  }) => {
    return syncToNYCologic({
      type: "mastery_update",
      data: {
        student_id: params.studentId,
        standard_id: params.standardId,
        standard_code: params.standardCode,
        mastery_level: params.masteryLevel,
        attempts_count: params.attemptsCount,
        correct_count: params.correctCount,
      },
    });
  };

  return {
    syncToNYCologic,
    syncAssignmentCompleted,
    syncStudentProgress,
    syncBadgeEarned,
    syncMasteryUpdate,
  };
}
