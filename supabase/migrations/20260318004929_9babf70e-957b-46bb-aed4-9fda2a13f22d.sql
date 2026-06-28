
-- Add is_open_ended column to quiz_questions
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS is_open_ended boolean NOT NULL DEFAULT false;

-- Enable realtime for lesson_completions
ALTER PUBLICATION supabase_realtime ADD TABLE public.lesson_completions;
