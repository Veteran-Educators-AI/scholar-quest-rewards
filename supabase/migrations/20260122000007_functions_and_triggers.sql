-- Functions and Triggers

-- Helper function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id LIMIT 1
$$;

-- Security definer functions for RLS
CREATE OR REPLACE FUNCTION public.is_teacher_of_class(p_teacher_id uuid, p_class_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.classes WHERE id = p_class_id AND teacher_id = p_teacher_id)
$$;

CREATE OR REPLACE FUNCTION public.teacher_can_view_student(p_teacher_id uuid, p_student_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.classes c ON c.id = e.class_id
    WHERE e.student_id = p_student_id AND c.teacher_id = p_teacher_id
  )
$$;

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Generate random class codes
CREATE OR REPLACE FUNCTION public.generate_class_code()
RETURNS text
LANGUAGE plpgsql SET search_path = public
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'::user_role)
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'::user_role)
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create student profile on signup
CREATE OR REPLACE FUNCTION public.create_student_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'student' THEN
    INSERT INTO public.student_profiles (user_id, xp, coins, current_streak, longest_streak, streak_shield_available)
    VALUES (NEW.id, 0, 0, 0, 0, true)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update student streak
CREATE OR REPLACE FUNCTION public.update_student_streak()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_assignment_due_at timestamptz;
  v_student_profile student_profiles%ROWTYPE;
  v_last_completion_date date;
  v_today date := CURRENT_DATE;
BEGIN
  IF NEW.status = 'verified' AND (OLD.status IS NULL OR OLD.status != 'verified') THEN
    SELECT due_at INTO v_assignment_due_at FROM assignments WHERE id = NEW.assignment_id;

    IF NEW.submitted_at <= v_assignment_due_at THEN
      SELECT * INTO v_student_profile FROM student_profiles WHERE user_id = NEW.student_id;

      SELECT DATE(created_at) INTO v_last_completion_date
      FROM reward_ledger
      WHERE student_id = NEW.student_id AND reason LIKE 'Assignment completed%'
      ORDER BY created_at DESC LIMIT 1;

      IF v_last_completion_date = v_today - INTERVAL '1 day' THEN
        UPDATE student_profiles
        SET current_streak = current_streak + 1,
            longest_streak = GREATEST(longest_streak, current_streak + 1),
            updated_at = NOW()
        WHERE user_id = NEW.student_id;
      ELSIF v_last_completion_date = v_today THEN
        NULL;
      ELSE
        UPDATE student_profiles
        SET current_streak = 1,
            longest_streak = GREATEST(longest_streak, 1),
            updated_at = NOW()
        WHERE user_id = NEW.student_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Award streak badges
CREATE OR REPLACE FUNCTION public.award_streak_badges()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_badge_id uuid;
  v_streak_milestones int[] := ARRAY[3, 7, 14, 30, 60, 100];
  v_milestone int;
BEGIN
  IF NEW.current_streak > OLD.current_streak THEN
    FOREACH v_milestone IN ARRAY v_streak_milestones LOOP
      IF NEW.current_streak >= v_milestone AND OLD.current_streak < v_milestone THEN
        SELECT id INTO v_badge_id FROM badges
        WHERE name ILIKE '%' || v_milestone || '%streak%'
           OR name ILIKE '%streak%' || v_milestone || '%'
           OR (criteria->>'streak_days')::int = v_milestone
        LIMIT 1;

        IF v_badge_id IS NOT NULL THEN
          INSERT INTO student_badges (student_id, badge_id)
          VALUES (NEW.user_id, v_badge_id)
          ON CONFLICT DO NOTHING;

          INSERT INTO reward_ledger (student_id, xp_delta, coin_delta, reason)
          SELECT NEW.user_id, b.xp_reward, 0, 'Badge earned: ' || b.name
          FROM badges b WHERE b.id = v_badge_id;
        END IF;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

-- Notify badge earned
CREATE OR REPLACE FUNCTION public.notify_badge_earned()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_badge badges%ROWTYPE;
BEGIN
  SELECT * INTO v_badge FROM badges WHERE id = NEW.badge_id;
  INSERT INTO notifications (user_id, type, title, message, icon, data)
  VALUES (
    NEW.student_id, 'badge_earned', 'New Badge Earned!',
    'You earned the "' || v_badge.name || '" badge!',
    v_badge.icon_url,
    jsonb_build_object('badge_id', NEW.badge_id, 'badge_name', v_badge.name, 'xp_reward', v_badge.xp_reward)
  );
  RETURN NEW;
END;
$$;

-- Notify reward received
CREATE OR REPLACE FUNCTION public.notify_reward_received()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.reason LIKE 'Assignment completed%' THEN
    INSERT INTO notifications (user_id, type, title, message, icon, data)
    VALUES (
      NEW.student_id, 'reward_received', 'Rewards Earned!',
      'You earned ' || NEW.xp_delta || ' XP and ' || NEW.coin_delta || ' coins!',
      NULL,
      jsonb_build_object('xp', NEW.xp_delta, 'coins', NEW.coin_delta, 'reason', NEW.reason)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Check streak warnings
CREATE OR REPLACE FUNCTION public.check_streak_warnings()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_last_activity DATE;
  v_today DATE := CURRENT_DATE;
BEGIN
  FOR v_profile IN
    SELECT sp.user_id, sp.current_streak, sp.streak_shield_available
    FROM student_profiles sp WHERE sp.current_streak >= 3
  LOOP
    SELECT DATE(MAX(created_at)) INTO v_last_activity
    FROM reward_ledger
    WHERE student_id = v_profile.user_id AND reason LIKE 'Assignment completed%';

    IF v_last_activity = v_today - INTERVAL '1 day' THEN
      IF NOT EXISTS (
        SELECT 1 FROM notifications
        WHERE user_id = v_profile.user_id AND type = 'streak_warning' AND DATE(created_at) = v_today
      ) THEN
        INSERT INTO notifications (user_id, type, title, message, icon, data)
        VALUES (
          v_profile.user_id, 'streak_warning', 'Streak at Risk!',
          'Complete an assignment today to keep your ' || v_profile.current_streak || '-day streak alive!',
          NULL,
          jsonb_build_object('current_streak', v_profile.current_streak, 'has_shield', v_profile.streak_shield_available)
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Update standard mastery
CREATE OR REPLACE FUNCTION public.update_standard_mastery()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_standard_id uuid;
  v_is_correct boolean;
  v_current_mastery student_standard_mastery%ROWTYPE;
  v_new_level text;
  v_accuracy numeric;
BEGIN
  IF NEW.status = 'verified' AND (OLD.status IS NULL OR OLD.status != 'verified') THEN
    SELECT standard_id INTO v_standard_id FROM assignments WHERE id = NEW.assignment_id;

    IF v_standard_id IS NOT NULL THEN
      v_is_correct := COALESCE(NEW.score, 0) >= 70;

      INSERT INTO student_standard_mastery (student_id, standard_id, attempts_count, correct_count, last_attempt_at)
      VALUES (NEW.student_id, v_standard_id, 1, CASE WHEN v_is_correct THEN 1 ELSE 0 END, NOW())
      ON CONFLICT (student_id, standard_id) DO UPDATE SET
        attempts_count = student_standard_mastery.attempts_count + 1,
        correct_count = student_standard_mastery.correct_count + CASE WHEN v_is_correct THEN 1 ELSE 0 END,
        last_attempt_at = NOW(),
        updated_at = NOW()
      RETURNING * INTO v_current_mastery;

      v_accuracy := (v_current_mastery.correct_count::numeric / v_current_mastery.attempts_count::numeric) * 100;

      IF v_current_mastery.attempts_count >= 3 AND v_accuracy >= 85 THEN
        v_new_level := 'mastered';
      ELSIF v_current_mastery.attempts_count >= 2 AND v_accuracy >= 70 THEN
        v_new_level := 'approaching';
      ELSIF v_current_mastery.attempts_count >= 1 THEN
        v_new_level := 'developing';
      ELSE
        v_new_level := 'not_started';
      END IF;

      UPDATE student_standard_mastery
      SET mastery_level = v_new_level,
          mastered_at = CASE WHEN v_new_level = 'mastered' AND mastered_at IS NULL THEN NOW() ELSE mastered_at END
      WHERE id = v_current_mastery.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Deduct student points
CREATE OR REPLACE FUNCTION public.deduct_student_points(
  p_student_id UUID,
  p_class_id UUID,
  p_points INTEGER,
  p_reason TEXT
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_deduction_id UUID;
  v_current_coins INTEGER;
BEGIN
  INSERT INTO point_deductions (student_id, teacher_id, class_id, points_deducted, reason)
  VALUES (p_student_id, auth.uid(), p_class_id, p_points, p_reason)
  RETURNING id INTO v_deduction_id;

  SELECT coins INTO v_current_coins FROM student_profiles WHERE user_id = p_student_id;

  UPDATE student_profiles
  SET coins = GREATEST(0, coins - p_points), updated_at = now()
  WHERE user_id = p_student_id;

  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    p_student_id, 'points_deducted', 'Points Deducted',
    format('%s points deducted: %s', p_points, p_reason),
    jsonb_build_object('points', p_points, 'reason', p_reason, 'class_id', p_class_id)
  );

  RETURN v_deduction_id;
END;
$$;

-- Check point pledge thresholds
CREATE OR REPLACE FUNCTION public.check_point_pledge_thresholds()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_pledge RECORD;
  v_student_name TEXT;
  v_progress_percent NUMERIC;
BEGIN
  IF NEW.coins > OLD.coins THEN
    SELECT full_name INTO v_student_name FROM profiles WHERE id = NEW.user_id;

    FOR v_pledge IN
      SELECT * FROM parent_point_pledges
      WHERE student_id = NEW.user_id AND is_active = true AND claimed = false
    LOOP
      v_progress_percent := (NEW.coins::NUMERIC / v_pledge.coin_threshold::NUMERIC) * 100;

      IF v_pledge.coin_threshold <= NEW.coins THEN
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
          v_pledge.parent_id, 'point_pledge_reached', 'Reward Milestone Reached!',
          v_student_name || ' reached ' || v_pledge.coin_threshold || ' coins! Time to deliver: ' || v_pledge.reward_description,
          jsonb_build_object('pledge_id', v_pledge.id, 'student_id', NEW.user_id, 'student_name', v_student_name,
            'threshold', v_pledge.coin_threshold, 'current_coins', NEW.coins, 'reward_description', v_pledge.reward_description)
        );

        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
          NEW.user_id, 'reward_unlocked', 'Reward Unlocked!',
          'You reached ' || v_pledge.coin_threshold || ' coins! Your parent promised: ' || v_pledge.reward_description,
          jsonb_build_object('pledge_id', v_pledge.id, 'threshold', v_pledge.coin_threshold, 'reward_description', v_pledge.reward_description)
        );
      ELSIF v_progress_percent >= 90 AND OLD.coins < (v_pledge.coin_threshold * 0.9) THEN
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
          v_pledge.parent_id, 'point_pledge_near', 'Almost There!',
          v_student_name || ' is at ' || ROUND(v_progress_percent) || '% toward their reward: ' || v_pledge.reward_description,
          jsonb_build_object('pledge_id', v_pledge.id, 'student_id', NEW.user_id, 'progress_percent', ROUND(v_progress_percent))
        );

        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
          NEW.user_id, 'reward_almost_unlocked', 'You''re So Close!',
          'You''re at ' || ROUND(v_progress_percent) || '% toward your reward! Just ' || (v_pledge.coin_threshold - NEW.coins) || ' more coins to go!',
          jsonb_build_object('pledge_id', v_pledge.id, 'coins_needed', v_pledge.coin_threshold - NEW.coins)
        );
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

-- Award bonus coins on pledge claim
CREATE OR REPLACE FUNCTION public.award_bonus_coins_on_claim()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.claimed = true AND OLD.claimed = false AND NEW.bonus_coins > 0 THEN
    UPDATE public.student_profiles
    SET coins = coins + NEW.bonus_coins, updated_at = now()
    WHERE user_id = NEW.student_id;

    INSERT INTO public.reward_ledger (student_id, coin_delta, xp_delta, reason)
    VALUES (NEW.student_id, NEW.bonus_coins, 0, 'Celebration bonus from parent for reaching ' || NEW.coin_threshold || ' coins!');

    INSERT INTO public.notifications (user_id, type, title, message, icon)
    VALUES (NEW.student_id, 'bonus_coins', 'Celebration Bonus!',
      'Your parent awarded you ' || NEW.bonus_coins || ' bonus coins for reaching your goal!', NULL);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Notify parent on badge pledge
CREATE OR REPLACE FUNCTION public.notify_parent_badge_pledge()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_pledge RECORD;
  v_badge badges%ROWTYPE;
  v_student_name TEXT;
BEGIN
  SELECT * INTO v_badge FROM badges WHERE id = NEW.badge_id;
  SELECT full_name INTO v_student_name FROM profiles WHERE id = NEW.student_id;

  FOR v_pledge IN
    SELECT * FROM parent_reward_pledges
    WHERE student_id = NEW.student_id AND badge_id = NEW.badge_id AND is_active = true AND claimed = false
  LOOP
    INSERT INTO notifications (user_id, type, title, message, icon, data)
    VALUES (
      v_pledge.parent_id, 'pledge_triggered', 'Reward Pledge Triggered!',
      v_student_name || ' earned the "' || v_badge.name || '" badge! Time to deliver: ' || v_pledge.reward_description,
      v_badge.icon_url,
      jsonb_build_object('pledge_id', v_pledge.id, 'badge_id', NEW.badge_id, 'badge_name', v_badge.name,
        'student_id', NEW.student_id, 'student_name', v_student_name, 'reward_description', v_pledge.reward_description)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

-- Notify students on new assignment
CREATE OR REPLACE FUNCTION public.notify_students_on_new_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_enrollment RECORD;
  v_class classes%ROWTYPE;
BEGIN
  SELECT * INTO v_class FROM classes WHERE id = NEW.class_id;

  FOR v_enrollment IN SELECT student_id FROM enrollments WHERE class_id = NEW.class_id LOOP
    INSERT INTO notifications (user_id, type, title, message, icon, data)
    VALUES (
      v_enrollment.student_id, 'new_assignment', 'New Assignment!',
      'Your teacher assigned "' || NEW.title || '" in ' || COALESCE(v_class.name, 'your class') || '. Due: ' || to_char(NEW.due_at, 'Mon DD at HH:MI AM'),
      NULL,
      jsonb_build_object('assignment_id', NEW.id, 'assignment_title', NEW.title, 'class_id', NEW.class_id,
        'class_name', v_class.name, 'due_at', NEW.due_at, 'xp_reward', NEW.xp_reward, 'coin_reward', NEW.coin_reward)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

-- Award lotto entry
CREATE OR REPLACE FUNCTION public.award_lotto_entry()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_active_draw lotto_draws%ROWTYPE;
BEGIN
  IF NEW.status = 'verified' AND (OLD.status IS NULL OR OLD.status != 'verified') THEN
    SELECT * INTO v_active_draw FROM lotto_draws
    WHERE is_active = true AND now() BETWEEN start_date AND end_date
    ORDER BY end_date ASC LIMIT 1;

    IF v_active_draw.id IS NOT NULL THEN
      INSERT INTO lotto_entries (student_id, draw_id, assignment_id, reason)
      VALUES (NEW.student_id, v_active_draw.id, NEW.assignment_id, 'assignment_completed')
      ON CONFLICT DO NOTHING;

      INSERT INTO notifications (user_id, type, title, message, icon, data)
      VALUES (
        NEW.student_id, 'lotto_entry', 'Raffle Entry Earned!',
        'You earned a raffle entry for "' || v_active_draw.title || '"!',
        NULL,
        jsonb_build_object('draw_id', v_active_draw.id, 'draw_title', v_active_draw.title)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Process pending enrollments
CREATE OR REPLACE FUNCTION public.check_pending_enrollments_on_student_profile()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_pending RECORD;
  v_user_email TEXT;
  v_class classes%ROWTYPE;
  v_teacher_name TEXT;
BEGIN
  SELECT email INTO v_user_email FROM auth.users WHERE id = NEW.user_id;
  IF v_user_email IS NULL THEN RETURN NEW; END IF;

  FOR v_pending IN
    SELECT * FROM pending_enrollments
    WHERE lower(email) = lower(v_user_email) AND processed = false
  LOOP
    SELECT * INTO v_class FROM classes WHERE id = v_pending.class_id;
    SELECT full_name INTO v_teacher_name FROM profiles WHERE id = v_class.teacher_id;

    INSERT INTO enrollments (student_id, class_id) VALUES (NEW.user_id, v_pending.class_id) ON CONFLICT DO NOTHING;
    UPDATE pending_enrollments SET processed = true, processed_at = now() WHERE id = v_pending.id;

    INSERT INTO notifications (user_id, type, title, message, icon, data)
    VALUES (
      NEW.user_id, 'auto_enrolled', 'Welcome to ' || COALESCE(v_class.name, 'Class') || '!',
      'You''ve been enrolled in ' || COALESCE(v_teacher_name, 'your teacher') || '''s class. Start completing assignments to earn rewards!',
      NULL,
      jsonb_build_object('class_id', v_pending.class_id, 'class_name', v_class.name, 'teacher_name', v_teacher_name)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

-- Process invite link
CREATE OR REPLACE FUNCTION public.process_invite_link(p_token TEXT, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_invite student_invite_links%ROWTYPE;
  v_class classes%ROWTYPE;
  v_teacher_name TEXT;
BEGIN
  SELECT * INTO v_invite FROM student_invite_links
  WHERE token = p_token AND used_at IS NULL AND expires_at > now();

  IF v_invite.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite link');
  END IF;

  UPDATE student_invite_links SET used_at = now(), used_by = p_user_id WHERE id = v_invite.id;

  IF v_invite.class_id IS NOT NULL THEN
    INSERT INTO enrollments (student_id, class_id) VALUES (p_user_id, v_invite.class_id) ON CONFLICT DO NOTHING;
    SELECT * INTO v_class FROM classes WHERE id = v_invite.class_id;
    SELECT full_name INTO v_teacher_name FROM profiles WHERE id = v_invite.teacher_id;

    INSERT INTO notifications (user_id, type, title, message, icon, data)
    VALUES (
      p_user_id, 'invite_accepted', 'Welcome to ' || COALESCE(v_class.name, 'Class') || '!',
      'You''ve joined ' || COALESCE(v_teacher_name, 'your teacher') || '''s class. Start earning rewards!',
      NULL,
      jsonb_build_object('class_id', v_invite.class_id, 'teacher_id', v_invite.teacher_id)
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'teacher_id', v_invite.teacher_id, 'class_id', v_invite.class_id, 'external_ref', v_invite.external_ref);
END;
$$;

-- Link external student on signup
CREATE OR REPLACE FUNCTION public.link_external_student_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
  IF user_email IS NOT NULL THEN
    UPDATE public.external_students
    SET linked_user_id = NEW.id, linked_at = NOW()
    WHERE LOWER(email) = LOWER(user_email) AND linked_user_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Link my external student (manual)
CREATE OR REPLACE FUNCTION public.link_my_external_student()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
  linked_count INTEGER;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  IF user_email IS NULL THEN RETURN FALSE; END IF;

  UPDATE public.external_students
  SET linked_user_id = auth.uid(), linked_at = NOW()
  WHERE LOWER(email) = LOWER(user_email) AND linked_user_id IS NULL;

  GET DIAGNOSTICS linked_count = ROW_COUNT;
  RETURN linked_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Auto-grant admin for specific emails
CREATE OR REPLACE FUNCTION public.auto_grant_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
  v_admin_emails TEXT[] := ARRAY['gfrancois2@schools.nyc.gov'];
BEGIN
  SELECT email INTO v_user_email FROM auth.users WHERE id = NEW.id;

  IF v_user_email IS NOT NULL AND lower(v_user_email) = ANY(SELECT lower(unnest(v_admin_emails))) THEN
    UPDATE profiles SET role = 'admin' WHERE id = NEW.id;
    INSERT INTO user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
    INSERT INTO notifications (user_id, type, title, message, icon)
    VALUES (NEW.id, 'admin_granted', 'Admin Access Granted', 'Welcome! You have been granted administrator privileges.', NULL);
  END IF;
  RETURN NEW;
END;
$$;

-- Secure reward awarding function (service role only)
CREATE OR REPLACE FUNCTION public.award_rewards_secure(
  p_student_id UUID,
  p_claim_type TEXT,
  p_reference_id TEXT,
  p_xp_amount INTEGER,
  p_coin_amount INTEGER,
  p_reason TEXT
) RETURNS JSONB AS $$
DECLARE
  v_claim_key TEXT;
  v_existing_claim UUID;
  v_current_xp INTEGER;
  v_current_coins INTEGER;
BEGIN
  v_claim_key := p_student_id::TEXT || ':' || p_claim_type || ':' || p_reference_id;

  SELECT id INTO v_existing_claim FROM public.reward_claims WHERE claim_key = v_claim_key;
  IF v_existing_claim IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Rewards already claimed for this activity', 'already_claimed', true);
  END IF;

  SELECT xp, coins INTO v_current_xp, v_current_coins FROM public.student_profiles WHERE user_id = p_student_id;
  IF v_current_xp IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Student profile not found');
  END IF;

  INSERT INTO public.reward_claims (student_id, claim_type, reference_id, claim_key, xp_awarded, coins_awarded)
  VALUES (p_student_id, p_claim_type, p_reference_id, v_claim_key, p_xp_amount, p_coin_amount);

  UPDATE public.student_profiles
  SET xp = v_current_xp + p_xp_amount, coins = v_current_coins + p_coin_amount, updated_at = now()
  WHERE user_id = p_student_id;

  INSERT INTO public.reward_ledger (student_id, xp_delta, coin_delta, reason)
  VALUES (p_student_id, p_xp_amount, p_coin_amount, p_reason);

  RETURN jsonb_build_object('success', true, 'xp_awarded', p_xp_amount, 'coins_awarded', p_coin_amount,
    'new_xp_total', v_current_xp + p_xp_amount, 'new_coins_total', v_current_coins + p_coin_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke direct execute from award_rewards_secure
REVOKE EXECUTE ON FUNCTION public.award_rewards_secure FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_rewards_secure FROM anon;
REVOKE EXECUTE ON FUNCTION public.award_rewards_secure FROM authenticated;

-- Create all triggers

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_profile_created_create_student_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_student_profile_on_signup();

CREATE TRIGGER on_attempt_verified_streak
  AFTER UPDATE ON attempts
  FOR EACH ROW EXECUTE FUNCTION public.update_student_streak();

CREATE TRIGGER on_streak_updated_badges
  AFTER UPDATE ON student_profiles
  FOR EACH ROW
  WHEN (NEW.current_streak IS DISTINCT FROM OLD.current_streak)
  EXECUTE FUNCTION public.award_streak_badges();

CREATE TRIGGER on_badge_earned_notify
  AFTER INSERT ON student_badges
  FOR EACH ROW EXECUTE FUNCTION public.notify_badge_earned();

CREATE TRIGGER on_reward_notify
  AFTER INSERT ON reward_ledger
  FOR EACH ROW EXECUTE FUNCTION public.notify_reward_received();

CREATE TRIGGER trigger_update_standard_mastery
  AFTER UPDATE ON public.attempts
  FOR EACH ROW EXECUTE FUNCTION public.update_standard_mastery();

CREATE TRIGGER check_point_pledges_on_coin_change
  AFTER UPDATE OF coins ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_point_pledge_thresholds();

CREATE TRIGGER award_bonus_on_pledge_claim
  BEFORE UPDATE ON public.parent_point_pledges
  FOR EACH ROW EXECUTE FUNCTION public.award_bonus_coins_on_claim();

CREATE TRIGGER notify_parent_on_badge_pledge
  AFTER INSERT ON public.student_badges
  FOR EACH ROW EXECUTE FUNCTION public.notify_parent_badge_pledge();

CREATE TRIGGER on_new_assignment_notify_students
  AFTER INSERT ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.notify_students_on_new_assignment();

CREATE TRIGGER on_attempt_verified_award_lotto
  AFTER UPDATE ON public.attempts
  FOR EACH ROW EXECUTE FUNCTION public.award_lotto_entry();

CREATE TRIGGER on_student_profile_created_check_enrollments
  AFTER INSERT ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_pending_enrollments_on_student_profile();

CREATE TRIGGER trigger_link_external_student_on_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.link_external_student_on_signup();

CREATE TRIGGER on_profile_created_auto_grant_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_grant_admin_on_signup();

-- Updated at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON public.student_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_equipped_items_updated_at BEFORE UPDATE ON public.equipped_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_parent_reward_pledges_updated_at BEFORE UPDATE ON public.parent_reward_pledges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_parent_point_pledges_updated_at BEFORE UPDATE ON public.parent_point_pledges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_external_students_updated_at BEFORE UPDATE ON public.external_students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_skill_games_updated_at BEFORE UPDATE ON public.skill_games FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_geometry_mastery_updated_at BEFORE UPDATE ON public.geometry_mastery FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
