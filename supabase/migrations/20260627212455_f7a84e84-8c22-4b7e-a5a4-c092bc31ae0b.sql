-- Keep direct quiz table access locked while avoiding a no-policy table state.
DROP POLICY IF EXISTS "No direct quiz question access" ON public.quiz_questions;
CREATE POLICY "No direct quiz question access"
ON public.quiz_questions
FOR SELECT
TO authenticated
USING (false);

REVOKE ALL ON public.quiz_questions FROM anon;
REVOKE ALL ON public.quiz_questions FROM authenticated;
GRANT ALL ON public.quiz_questions TO service_role;

-- Restore the protected RPC flow: students can call the functions, but not read the table directly.
CREATE OR REPLACE FUNCTION public.get_quiz_questions(p_lesson_id uuid)
 RETURNS TABLE(id uuid, lesson_id uuid, question_text text, options jsonb, explanation text, is_open_ended boolean, order_index integer)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT q.id, q.lesson_id, q.question_text, q.options,
         CASE WHEN q.is_open_ended THEN q.explanation ELSE NULL END AS explanation,
         q.is_open_ended, q.order_index
  FROM public.quiz_questions q
  WHERE q.lesson_id = p_lesson_id
  ORDER BY q.order_index;
$function$;

CREATE OR REPLACE FUNCTION public.check_quiz_answer(p_question_id uuid, p_answer_index integer)
 RETURNS TABLE(correct boolean, correct_index integer, explanation text)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT (q.correct_index = p_answer_index) AS correct,
         q.correct_index,
         q.explanation
  FROM public.quiz_questions q
  WHERE q.id = p_question_id;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_quiz_questions(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_quiz_answer(uuid, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_quiz_questions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_quiz_answer(uuid, integer) TO authenticated;