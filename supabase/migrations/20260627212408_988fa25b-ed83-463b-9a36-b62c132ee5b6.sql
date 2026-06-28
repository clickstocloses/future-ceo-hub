-- Restore Data API grants required for RLS policies to work.
-- These grants do not bypass row-level security; they only allow the API role to reach tables
-- where the existing policies decide which rows are visible or writable.

-- Public/reference content with existing public-view policies.
GRANT SELECT ON public.badges TO anon, authenticated;
GRANT SELECT ON public.lessons TO anon, authenticated;
GRANT SELECT ON public.modules TO anon, authenticated;
GRANT SELECT ON public.watch_prompts TO anon, authenticated;

-- Authenticated app data. RLS policies continue to restrict rows and writes.
GRANT SELECT, INSERT, UPDATE ON public.ceo_helper_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.lesson_completions TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.message_reactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT SELECT, INSERT ON public.offline_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.schedule_sessions TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.session_registrations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_accessibility_preferences TO authenticated;
GRANT SELECT ON public.user_badges TO authenticated;
GRANT SELECT ON public.user_xp_log TO authenticated;

-- Backend/admin role for maintenance, functions, and protected server-side workflows.
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