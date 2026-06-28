
-- 1) user_badges: restrict SELECT to authenticated
DROP POLICY IF EXISTS "User badges viewable by everyone" ON public.user_badges;
CREATE POLICY "User badges viewable by authenticated"
  ON public.user_badges
  FOR SELECT
  TO authenticated
  USING (true);

-- 2) quiz_questions: hide correct_index from clients
DROP POLICY IF EXISTS "Quiz questions viewable by authenticated" ON public.quiz_questions;

-- SECURITY DEFINER helper: questions without correct_index
CREATE OR REPLACE FUNCTION public.get_quiz_questions(p_lesson_id uuid)
RETURNS TABLE (
  id uuid,
  lesson_id uuid,
  question_text text,
  options jsonb,
  explanation text,
  is_open_ended boolean,
  order_index integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.id, q.lesson_id, q.question_text, q.options,
         CASE WHEN q.is_open_ended THEN q.explanation ELSE NULL END AS explanation,
         q.is_open_ended, q.order_index
  FROM public.quiz_questions q
  WHERE q.lesson_id = p_lesson_id
  ORDER BY q.order_index;
$$;

-- SECURITY DEFINER helper: validate a multiple-choice answer
CREATE OR REPLACE FUNCTION public.check_quiz_answer(p_question_id uuid, p_answer_index integer)
RETURNS TABLE (
  correct boolean,
  correct_index integer,
  explanation text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (q.correct_index = p_answer_index) AS correct,
         q.correct_index,
         q.explanation
  FROM public.quiz_questions q
  WHERE q.id = p_question_id;
$$;

REVOKE ALL ON FUNCTION public.get_quiz_questions(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_quiz_questions(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.check_quiz_answer(uuid, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.check_quiz_answer(uuid, integer) TO authenticated, service_role;

-- 3) offline-submissions storage: enforce uploader owns folder path
DROP POLICY IF EXISTS "Authenticated users upload submissions" ON storage.objects;
CREATE POLICY "Users upload own offline submissions"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'offline-submissions'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- 4) Public buckets: drop broad SELECT policies that allow listing.
-- Files remain accessible via /object/public/<bucket>/<path> URLs.
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Lesson PDFs are publicly accessible" ON storage.objects;
