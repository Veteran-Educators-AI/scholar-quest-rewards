-- RLS Policies

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Teachers can view student profiles" ON public.profiles FOR SELECT
  USING (public.teacher_can_view_student(auth.uid(), id));

-- User roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Student profiles
CREATE POLICY "Students can view own student profile" ON public.student_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Students can insert own student profile" ON public.student_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Students can update non-reward profile fields" ON public.student_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND xp = (SELECT xp FROM public.student_profiles WHERE user_id = auth.uid())
    AND coins = (SELECT coins FROM public.student_profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Teachers can view student profiles in their classes" ON public.student_profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.classes c ON c.id = e.class_id
    WHERE e.student_id = student_profiles.user_id AND c.teacher_id = auth.uid()
  ));
CREATE POLICY "Parents can view linked student profiles" ON public.student_profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM parent_students ps
    WHERE ps.student_id = student_profiles.user_id AND ps.parent_id = auth.uid() AND ps.verified = true
  ));

-- Classes
CREATE POLICY "Teachers can manage their classes" ON public.classes FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Students can view enrolled classes" ON public.classes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.enrollments WHERE class_id = classes.id AND student_id = auth.uid()));

-- Enrollments
CREATE POLICY "Teachers can manage enrollments" ON public.enrollments FOR ALL
  USING (public.is_teacher_of_class(auth.uid(), class_id))
  WITH CHECK (public.is_teacher_of_class(auth.uid(), class_id));
CREATE POLICY "Students can view own enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = student_id);

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Pending enrollments
CREATE POLICY "Teachers can manage pending enrollments" ON public.pending_enrollments FOR ALL
  USING (EXISTS (SELECT 1 FROM classes WHERE classes.id = pending_enrollments.class_id AND classes.teacher_id = auth.uid()));

-- Student invite links
CREATE POLICY "Teachers can view own invite links" ON public.student_invite_links FOR SELECT USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can create invite links" ON public.student_invite_links FOR INSERT WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "Teachers can delete own invite links" ON public.student_invite_links FOR DELETE USING (teacher_id = auth.uid());
CREATE POLICY "Anyone can read valid invite tokens" ON public.student_invite_links FOR SELECT USING (used_at IS NULL AND expires_at > now());

-- Student status logs
CREATE POLICY "Teachers can insert student status" ON public.student_status_logs FOR INSERT TO authenticated
  WITH CHECK (teacher_id = auth.uid() AND EXISTS (SELECT 1 FROM public.classes WHERE id = class_id AND teacher_id = auth.uid()));
CREATE POLICY "Teachers can view their class status logs" ON public.student_status_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.classes WHERE id = class_id AND teacher_id = auth.uid()));
CREATE POLICY "Teachers can update their status logs" ON public.student_status_logs FOR UPDATE TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can delete their status logs" ON public.student_status_logs FOR DELETE TO authenticated USING (teacher_id = auth.uid());

-- NYS Standards
CREATE POLICY "Anyone can view standards" ON public.nys_standards FOR SELECT USING (true);

-- Assignments
CREATE POLICY "Teachers can manage assignments" ON public.assignments FOR ALL
  USING (EXISTS (SELECT 1 FROM public.classes WHERE id = assignments.class_id AND teacher_id = auth.uid()));
CREATE POLICY "Students can view assignments for enrolled classes" ON public.assignments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.class_id = assignments.class_id AND e.student_id = auth.uid()));

-- Questions
CREATE POLICY "Teachers can manage questions" ON public.questions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.classes c ON c.id = a.class_id
    WHERE a.id = questions.assignment_id AND c.teacher_id = auth.uid()
  ));
CREATE POLICY "Students can view questions for their assignments" ON public.questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.enrollments e ON e.class_id = a.class_id
    WHERE a.id = questions.assignment_id AND e.student_id = auth.uid()
  ));

-- Attempts
CREATE POLICY "Students can manage own attempts" ON public.attempts FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view and update attempts" ON public.attempts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.classes c ON c.id = a.class_id
    WHERE a.id = attempts.assignment_id AND c.teacher_id = auth.uid()
  ));

-- Submission assets
CREATE POLICY "Students can manage own submission assets" ON public.submission_assets FOR ALL
  USING (EXISTS (SELECT 1 FROM public.attempts WHERE id = submission_assets.attempt_id AND student_id = auth.uid()));
CREATE POLICY "Teachers can view submission assets" ON public.submission_assets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.attempts att
    JOIN public.assignments a ON a.id = att.assignment_id
    JOIN public.classes c ON c.id = a.class_id
    WHERE att.id = submission_assets.attempt_id AND c.teacher_id = auth.uid()
  ));

-- Student standard mastery
CREATE POLICY "Students can view own mastery" ON public.student_standard_mastery FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view student mastery" ON public.student_standard_mastery FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM enrollments e JOIN classes c ON c.id = e.class_id
    WHERE e.student_id = student_standard_mastery.student_id AND c.teacher_id = auth.uid()
  ));
CREATE POLICY "Parents can view linked student mastery" ON public.student_standard_mastery FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM parent_students ps
    WHERE ps.student_id = student_standard_mastery.student_id AND ps.parent_id = auth.uid() AND ps.verified = true
  ));

-- Practice sets
CREATE POLICY "Students can view own practice sets" ON public.practice_sets FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can update own practice sets" ON public.practice_sets FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view student practice sets" ON public.practice_sets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM enrollments e JOIN classes c ON c.id = e.class_id
    WHERE e.student_id = practice_sets.student_id AND c.teacher_id = auth.uid()
  ));
CREATE POLICY "Parents can view linked student practice sets" ON public.practice_sets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM parent_students ps WHERE ps.student_id = practice_sets.student_id AND ps.parent_id = auth.uid() AND ps.verified = true
  ));

-- Practice questions
CREATE POLICY "Students can view questions for their practice sets" ON public.practice_questions FOR SELECT
  USING (EXISTS (SELECT 1 FROM practice_sets ps WHERE ps.id = practice_questions.practice_set_id AND ps.student_id = auth.uid()));
CREATE POLICY "Teachers can view practice questions" ON public.practice_questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM practice_sets ps
    JOIN enrollments e ON e.student_id = ps.student_id
    JOIN classes c ON c.id = e.class_id
    WHERE ps.id = practice_questions.practice_set_id AND c.teacher_id = auth.uid()
  ));

-- Geometry mastery
CREATE POLICY "Students can view their own geometry mastery" ON public.geometry_mastery FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Service role can manage geometry mastery" ON public.geometry_mastery FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Badges
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (TRUE);

-- Student badges
CREATE POLICY "Students can view own badges" ON public.student_badges FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view student badges" ON public.student_badges FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.enrollments e JOIN public.classes c ON c.id = e.class_id
    WHERE e.student_id = student_badges.student_id AND c.teacher_id = auth.uid()
  ));
CREATE POLICY "Parents can view linked student badges" ON public.student_badges FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM parent_students ps WHERE ps.student_id = student_badges.student_id AND ps.parent_id = auth.uid() AND ps.verified = true
  ));

-- Collectibles
CREATE POLICY "Anyone can view collectibles" ON public.collectibles FOR SELECT USING (TRUE);

-- Student collectibles
CREATE POLICY "Students can view own collectibles" ON public.student_collectibles FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view student collectibles" ON public.student_collectibles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.enrollments e JOIN public.classes c ON c.id = e.class_id
    WHERE e.student_id = student_collectibles.student_id AND c.teacher_id = auth.uid()
  ));
CREATE POLICY "Parents can view linked student collectibles" ON public.student_collectibles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM parent_students ps WHERE ps.student_id = student_collectibles.student_id AND ps.parent_id = auth.uid() AND ps.verified = true
  ));

-- Equipped items
CREATE POLICY "Students can view own equipped items" ON public.equipped_items FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can manage own equipped items" ON public.equipped_items FOR ALL USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

-- Reward ledger
CREATE POLICY "Students can view own rewards" ON public.reward_ledger FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Parents can view linked student rewards" ON public.reward_ledger FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM parent_students ps WHERE ps.student_id = reward_ledger.student_id AND ps.parent_id = auth.uid() AND ps.verified = true
  ));

-- Reward claims
CREATE POLICY "Students can view their own reward claims" ON public.reward_claims FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Service role can insert reward claims" ON public.reward_claims FOR INSERT WITH CHECK (false);

-- Challenges
CREATE POLICY "Anyone can view active challenges" ON public.challenges FOR SELECT USING (is_active = true);
CREATE POLICY "Teachers can manage challenges" ON public.challenges FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')));

-- Challenge participants
CREATE POLICY "Students can join challenges" ON public.challenge_participants FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can view own participation" ON public.challenge_participants FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can update own participation" ON public.challenge_participants FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view all participation" ON public.challenge_participants FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')));

-- Lotto draws
CREATE POLICY "Anyone can view active draws" ON public.lotto_draws FOR SELECT USING (is_active = true OR winner_id IS NOT NULL);
CREATE POLICY "Teachers and admins can manage draws" ON public.lotto_draws FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')));

-- Lotto entries
CREATE POLICY "Students can view their own entries" ON public.lotto_entries FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can insert their own entries" ON public.lotto_entries FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Teachers can view all entries" ON public.lotto_entries FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')));

-- Skill games
CREATE POLICY "Students can view own games" ON public.skill_games FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can update own games" ON public.skill_games FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view student games" ON public.skill_games FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM enrollments e JOIN classes c ON c.id = e.class_id
    WHERE e.student_id = skill_games.student_id AND c.teacher_id = auth.uid()
  ));
CREATE POLICY "Parents can view linked student games" ON public.skill_games FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM parent_students ps WHERE ps.student_id = skill_games.student_id AND ps.parent_id = auth.uid() AND ps.verified = true
  ));

-- Game sessions
CREATE POLICY "Students can view own sessions" ON public.game_sessions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can insert own sessions" ON public.game_sessions FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update own sessions" ON public.game_sessions FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view student game sessions" ON public.game_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM skill_games sg
    JOIN enrollments e ON e.student_id = sg.student_id
    JOIN classes c ON c.id = e.class_id
    WHERE sg.id = game_sessions.game_id AND c.teacher_id = auth.uid()
  ));

-- Parent students
CREATE POLICY "Parents can view own links" ON public.parent_students FOR SELECT USING (auth.uid() = parent_id);
CREATE POLICY "Parents can insert own links" ON public.parent_students FOR INSERT WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Teachers can verify links" ON public.parent_students FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM enrollments e JOIN classes c ON c.id = e.class_id
    WHERE e.student_id = parent_students.student_id AND c.teacher_id = auth.uid()
  ));

-- Parent reward pledges
CREATE POLICY "Parents can view their own pledges" ON public.parent_reward_pledges FOR SELECT USING (auth.uid() = parent_id);
CREATE POLICY "Parents can create pledges for their students" ON public.parent_reward_pledges FOR INSERT
  WITH CHECK (
    auth.uid() = parent_id
    AND EXISTS (SELECT 1 FROM public.parent_students WHERE parent_id = auth.uid() AND student_id = parent_reward_pledges.student_id AND verified = true)
  );
CREATE POLICY "Parents can update their own pledges" ON public.parent_reward_pledges FOR UPDATE USING (auth.uid() = parent_id);
CREATE POLICY "Parents can delete their own pledges" ON public.parent_reward_pledges FOR DELETE USING (auth.uid() = parent_id);
CREATE POLICY "Students can view pledges for them" ON public.parent_reward_pledges FOR SELECT USING (auth.uid() = student_id);

-- Parent point pledges
CREATE POLICY "Parents can create point pledges for their students" ON public.parent_point_pledges FOR INSERT
  WITH CHECK (
    auth.uid() = parent_id
    AND EXISTS (SELECT 1 FROM parent_students WHERE parent_id = auth.uid() AND student_id = parent_point_pledges.student_id AND verified = true)
  );
CREATE POLICY "Parents can view their own point pledges" ON public.parent_point_pledges FOR SELECT USING (auth.uid() = parent_id);
CREATE POLICY "Parents can update their own point pledges" ON public.parent_point_pledges FOR UPDATE USING (auth.uid() = parent_id);
CREATE POLICY "Parents can delete their own point pledges" ON public.parent_point_pledges FOR DELETE USING (auth.uid() = parent_id);
CREATE POLICY "Students can view point pledges for them" ON public.parent_point_pledges FOR SELECT USING (auth.uid() = student_id);

-- Point deductions
CREATE POLICY "Teachers can create deductions for their students" ON public.point_deductions FOR INSERT
  WITH CHECK (
    auth.uid() = teacher_id
    AND EXISTS (
      SELECT 1 FROM classes c JOIN enrollments e ON e.class_id = c.id
      WHERE c.id = point_deductions.class_id AND c.teacher_id = auth.uid() AND e.student_id = point_deductions.student_id
    )
  );
CREATE POLICY "Teachers can view deductions they created" ON public.point_deductions FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Students can view own deductions" ON public.point_deductions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Parents can view linked student deductions" ON public.point_deductions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM parent_students ps WHERE ps.student_id = point_deductions.student_id AND ps.parent_id = auth.uid() AND ps.verified = true
  ));

-- External students
CREATE POLICY "Admins can view all external students" ON external_students FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'teacher')
  );
CREATE POLICY "Admins can insert external students" ON external_students FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'teacher')));
CREATE POLICY "Admins can update external students" ON external_students FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'teacher')));

-- API tokens
CREATE POLICY "Users can manage own API tokens" ON public.api_tokens FOR ALL USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- Integration tokens
CREATE POLICY "Users can manage own integration tokens" ON public.integration_tokens FOR ALL USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
