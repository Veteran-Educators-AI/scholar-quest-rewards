-- Indexes for Performance

-- Notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;

-- NYS Standards
CREATE INDEX idx_nys_standards_subject ON public.nys_standards(subject);
CREATE INDEX idx_nys_standards_grade_band ON public.nys_standards(grade_band);

-- Assignments
CREATE INDEX idx_assignments_standard_id ON public.assignments(standard_id);

-- Student standard mastery
CREATE INDEX idx_student_standard_mastery_student ON public.student_standard_mastery(student_id);
CREATE INDEX idx_student_standard_mastery_standard ON public.student_standard_mastery(standard_id);

-- API tokens
CREATE INDEX idx_api_tokens_hash ON public.api_tokens(token_hash);

-- Student status logs
CREATE INDEX idx_student_status_logs_class ON public.student_status_logs(class_id, recorded_at DESC);
CREATE INDEX idx_student_status_logs_student ON public.student_status_logs(student_id, recorded_at DESC);

-- Pending enrollments
CREATE INDEX idx_pending_enrollments_email ON public.pending_enrollments(email) WHERE processed = false;

-- Student invite links
CREATE INDEX idx_student_invite_links_token ON public.student_invite_links(token);

-- External students
CREATE INDEX idx_external_students_external_id ON public.external_students(external_id);
CREATE INDEX idx_external_students_email ON public.external_students(email);
CREATE INDEX idx_external_students_linked_user_id ON public.external_students(linked_user_id);

-- Practice sets
CREATE INDEX idx_practice_sets_student_id ON public.practice_sets(student_id);
CREATE INDEX idx_practice_sets_status ON public.practice_sets(status);
CREATE INDEX idx_practice_questions_set_id ON public.practice_questions(practice_set_id);

-- Skill games
CREATE INDEX idx_skill_games_student_id ON public.skill_games(student_id);
CREATE INDEX idx_skill_games_skill_tag ON public.skill_games(skill_tag);
CREATE INDEX idx_skill_games_status ON public.skill_games(status);
CREATE INDEX idx_game_sessions_game_id ON public.game_sessions(game_id);
CREATE INDEX idx_game_sessions_student_id ON public.game_sessions(student_id);

-- Reward claims
CREATE INDEX idx_reward_claims_claim_key ON public.reward_claims(claim_key);
CREATE INDEX idx_reward_claims_student_id ON public.reward_claims(student_id);

-- Geometry mastery
CREATE INDEX idx_geometry_mastery_student ON public.geometry_mastery(student_id);
