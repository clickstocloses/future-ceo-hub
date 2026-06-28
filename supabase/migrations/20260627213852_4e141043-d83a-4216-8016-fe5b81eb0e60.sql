-- Restore table privileges required by PostgREST without bypassing RLS.
-- These grants allow the API role to reach tables; row-level policies still decide which rows are visible/editable.

GRANT SELECT ON public.modules TO anon, authenticated;
GRANT SELECT ON public.lessons TO anon, authenticated;
GRANT SELECT ON public.badges TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_accessibility_preferences TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.lesson_completions TO authenticated;
GRANT SELECT ON public.schedule_sessions TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.session_registrations TO authenticated;
GRANT SELECT ON public.user_badges TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_messages TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.message_reactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.offline_submissions TO authenticated;
GRANT SELECT ON public.watch_prompts TO authenticated;

-- Keep sensitive award/accounting tables server-controlled for writes.
GRANT SELECT ON public.user_xp_log TO authenticated;

GRANT ALL ON public.badges TO service_role;
GRANT ALL ON public.ceo_helper_usage TO service_role;
GRANT ALL ON public.community_messages TO service_role;
GRANT ALL ON public.lesson_completions TO service_role;
GRANT ALL ON public.lessons TO service_role;
GRANT ALL ON public.message_reactions TO service_role;
GRANT ALL ON public.modules TO service_role;
GRANT ALL ON public.notification_preferences TO service_role;
GRANT ALL ON public.offline_submissions TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.quiz_questions TO service_role;
GRANT ALL ON public.schedule_sessions TO service_role;
GRANT ALL ON public.session_registrations TO service_role;
GRANT ALL ON public.user_accessibility_preferences TO service_role;
GRANT ALL ON public.user_badges TO service_role;
GRANT ALL ON public.user_xp_log TO service_role;
GRANT ALL ON public.watch_prompts TO service_role;