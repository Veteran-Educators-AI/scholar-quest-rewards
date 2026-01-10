-- Update the check_point_pledge_thresholds function to also notify at 90% progress
CREATE OR REPLACE FUNCTION public.check_point_pledge_thresholds()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pledge RECORD;
  v_student_name TEXT;
  v_progress_percent NUMERIC;
BEGIN
  -- Only check when coins increase (from reward_ledger or after deduction recovery)
  IF NEW.coins > OLD.coins THEN
    -- Get student name
    SELECT full_name INTO v_student_name FROM profiles WHERE id = NEW.user_id;
    
    -- Check all active unclaimed pledges for this student
    FOR v_pledge IN 
      SELECT * FROM parent_point_pledges
      WHERE student_id = NEW.user_id
      AND is_active = true
      AND claimed = false
    LOOP
      -- Calculate progress percentage
      v_progress_percent := (NEW.coins::NUMERIC / v_pledge.coin_threshold::NUMERIC) * 100;
      
      -- Check if threshold is reached (100%)
      IF v_pledge.coin_threshold <= NEW.coins THEN
        -- Create notification for parent
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
          v_pledge.parent_id,
          'point_pledge_reached',
          '🎉 Reward Milestone Reached!',
          v_student_name || ' reached ' || v_pledge.coin_threshold || ' coins! Time to deliver: ' || v_pledge.reward_description,
          jsonb_build_object(
            'pledge_id', v_pledge.id,
            'student_id', NEW.user_id,
            'student_name', v_student_name,
            'threshold', v_pledge.coin_threshold,
            'current_coins', NEW.coins,
            'reward_description', v_pledge.reward_description
          )
        );
        
        -- Create notification for student
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
          NEW.user_id,
          'reward_unlocked',
          '🎁 Reward Unlocked!',
          'You reached ' || v_pledge.coin_threshold || ' coins! Your parent promised: ' || v_pledge.reward_description,
          jsonb_build_object(
            'pledge_id', v_pledge.id,
            'threshold', v_pledge.coin_threshold,
            'reward_description', v_pledge.reward_description
          )
        );
        
      -- Check if near threshold (90% or more but not yet 100%)
      ELSIF v_progress_percent >= 90 AND OLD.coins < (v_pledge.coin_threshold * 0.9) THEN
        -- Only notify if we just crossed the 90% mark (wasn't at 90% before)
        -- Create notification for parent about near completion
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
          v_pledge.parent_id,
          'point_pledge_near',
          '🔥 Almost There!',
          v_student_name || ' is at ' || ROUND(v_progress_percent) || '% (' || NEW.coins || '/' || v_pledge.coin_threshold || ' coins) toward their reward: ' || v_pledge.reward_description,
          jsonb_build_object(
            'pledge_id', v_pledge.id,
            'student_id', NEW.user_id,
            'student_name', v_student_name,
            'threshold', v_pledge.coin_threshold,
            'current_coins', NEW.coins,
            'progress_percent', ROUND(v_progress_percent),
            'reward_description', v_pledge.reward_description
          )
        );
        
        -- Create notification for student about being close
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
          NEW.user_id,
          'reward_almost_unlocked',
          '🔥 You''re So Close!',
          'You''re at ' || ROUND(v_progress_percent) || '% toward your reward: ' || v_pledge.reward_description || '. Just ' || (v_pledge.coin_threshold - NEW.coins) || ' more coins to go!',
          jsonb_build_object(
            'pledge_id', v_pledge.id,
            'threshold', v_pledge.coin_threshold,
            'current_coins', NEW.coins,
            'coins_needed', v_pledge.coin_threshold - NEW.coins,
            'progress_percent', ROUND(v_progress_percent),
            'reward_description', v_pledge.reward_description
          )
        );
        
        -- Call edge function to send email notification
        PERFORM net.http_post(
          url := 'https://rjlqmfthemfpetpcydog.supabase.co/functions/v1/send-parent-notification',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
          ),
          body := jsonb_build_object(
            'type', 'pledge_near_completion',
            'student_id', NEW.user_id,
            'data', jsonb_build_object(
              'student_name', v_student_name,
              'current_coins', NEW.coins,
              'threshold', v_pledge.coin_threshold,
              'progress_percent', ROUND(v_progress_percent),
              'reward_description', v_pledge.reward_description,
              'coins_needed', v_pledge.coin_threshold - NEW.coins
            )
          )
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;