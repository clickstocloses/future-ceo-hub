REVOKE EXECUTE ON FUNCTION public.get_quiz_questions(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_quiz_questions(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.check_quiz_answer(uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_quiz_answer(uuid, integer) FROM authenticated;

REVOKE ALL ON public.quiz_questions FROM anon;
REVOKE ALL ON public.quiz_questions FROM authenticated;
GRANT ALL ON public.quiz_questions TO service_role;