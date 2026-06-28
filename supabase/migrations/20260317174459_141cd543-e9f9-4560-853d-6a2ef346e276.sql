
-- Create offline_submissions table
CREATE TABLE public.offline_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id),
  image_url TEXT,
  score INTEGER,
  total INTEGER,
  passed BOOLEAN,
  ai_response JSONB,
  confidence_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.offline_submissions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own submissions
CREATE POLICY "Users insert own submissions"
ON public.offline_submissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can select their own submissions
CREATE POLICY "Users select own submissions"
ON public.offline_submissions FOR SELECT
USING (auth.uid() = user_id);

-- Create storage bucket for offline submissions
INSERT INTO storage.buckets (id, name, public) VALUES ('offline-submissions', 'offline-submissions', true);

CREATE POLICY "Offline submissions publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'offline-submissions');

CREATE POLICY "Authenticated users upload submissions"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'offline-submissions' AND auth.role() = 'authenticated');

-- Add unique constraint on lesson_completions for ON CONFLICT support
ALTER TABLE public.lesson_completions ADD CONSTRAINT lesson_completions_user_lesson_unique UNIQUE (user_id, lesson_id);
