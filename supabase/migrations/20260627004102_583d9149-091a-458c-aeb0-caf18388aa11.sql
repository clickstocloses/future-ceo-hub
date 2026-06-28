
-- Profiles: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Revoke public/anon access on profiles
REVOKE SELECT ON public.profiles FROM anon;

-- user_badges: remove self-insert
DROP POLICY IF EXISTS "Users insert own badges" ON public.user_badges;

-- user_xp_log: remove self-insert
DROP POLICY IF EXISTS "Users insert own xp log" ON public.user_xp_log;

-- Storage: offline-submissions - remove public read, restrict to owning user
DROP POLICY IF EXISTS "Offline submissions publicly accessible" ON storage.objects;

CREATE POLICY "Users read own offline submissions"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'offline-submissions'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );
