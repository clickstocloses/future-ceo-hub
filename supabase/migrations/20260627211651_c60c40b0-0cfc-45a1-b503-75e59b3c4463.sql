
-- 1. Prevent role escalation on profiles
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- 2. quiz_questions: explicit defense — ensure no direct SELECT policy exists; revoke table privileges from anon/authenticated so only the SECURITY DEFINER RPCs can read.
REVOKE ALL ON public.quiz_questions FROM anon, authenticated;
GRANT ALL ON public.quiz_questions TO service_role;

-- 3. Restrict SECURITY DEFINER quiz RPCs to authenticated only (revoke from anon/public)
REVOKE ALL ON FUNCTION public.get_quiz_questions(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.check_quiz_answer(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_quiz_questions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_quiz_answer(uuid, integer) TO authenticated;

-- 4. lesson-pdfs: bucket is now private. Add SELECT policy for authenticated users.
DROP POLICY IF EXISTS "Authenticated users can read lesson pdfs" ON storage.objects;
CREATE POLICY "Authenticated users can read lesson pdfs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'lesson-pdfs');
