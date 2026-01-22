-- Enums and Types

CREATE TYPE public.user_role AS ENUM ('student', 'teacher', 'parent', 'admin');
CREATE TYPE public.assignment_status AS ENUM ('pending', 'active', 'completed', 'archived');
CREATE TYPE public.attempt_mode AS ENUM ('paper', 'in_app');
CREATE TYPE public.attempt_status AS ENUM ('not_started', 'in_progress', 'submitted', 'verified', 'rejected');
CREATE TYPE public.collectible_rarity AS ENUM ('common', 'rare', 'epic', 'legendary');
CREATE TYPE public.question_type AS ENUM ('multiple_choice', 'short_answer', 'numeric', 'drag_order', 'matching');
CREATE TYPE public.student_status_type AS ENUM ('on_task', 'off_task', 'needs_support', 'excellent', 'absent', 'late');
