import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RateLimitStatus {
  isAllowed: boolean;
  attemptsRemaining: number;
  lockoutUntil: Date | null;
}

interface UseRateLimitReturn {
  checkRateLimit: (email: string) => Promise<RateLimitStatus>;
  recordAttempt: (email: string, success: boolean) => Promise<void>;
  rateLimitStatus: RateLimitStatus | null;
  isChecking: boolean;
}

export function useRateLimit(): UseRateLimitReturn {
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkRateLimit = useCallback(async (email: string): Promise<RateLimitStatus> => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.rpc("check_login_rate_limit", {
        p_email: email,
        p_ip_address: null,
      });

      if (error) {
        console.error("Rate limit check error:", error);
        // Default to allowing login if rate limit check fails
        return { isAllowed: true, attemptsRemaining: 5, lockoutUntil: null };
      }

      const result = data?.[0];
      const status: RateLimitStatus = {
        isAllowed: result?.is_allowed ?? true,
        attemptsRemaining: result?.attempts_remaining ?? 5,
        lockoutUntil: result?.lockout_until ? new Date(result.lockout_until) : null,
      };

      setRateLimitStatus(status);
      return status;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const recordAttempt = useCallback(async (email: string, success: boolean): Promise<void> => {
    try {
      await supabase.rpc("record_login_attempt", {
        p_email: email,
        p_ip_address: null,
        p_success: success,
      });

      // Update local status after recording
      if (success) {
        setRateLimitStatus({ isAllowed: true, attemptsRemaining: 5, lockoutUntil: null });
      } else if (rateLimitStatus) {
        const newRemaining = Math.max(0, rateLimitStatus.attemptsRemaining - 1);
        setRateLimitStatus({
          ...rateLimitStatus,
          attemptsRemaining: newRemaining,
          isAllowed: newRemaining > 0,
          lockoutUntil: newRemaining === 0 ? new Date(Date.now() + 15 * 60 * 1000) : null,
        });
      }
    } catch (error) {
      console.error("Record attempt error:", error);
    }
  }, [rateLimitStatus]);

  return {
    checkRateLimit,
    recordAttempt,
    rateLimitStatus,
    isChecking,
  };
}

export function formatLockoutTime(lockoutUntil: Date): string {
  const now = new Date();
  const diff = lockoutUntil.getTime() - now.getTime();

  if (diff <= 0) return "now";

  const minutes = Math.ceil(diff / 60000);
  if (minutes === 1) return "1 minute";
  return `${minutes} minutes`;
}
