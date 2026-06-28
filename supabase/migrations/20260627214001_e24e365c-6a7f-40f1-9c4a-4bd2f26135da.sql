INSERT INTO public.user_accessibility_preferences (user_id, visually_impaired, auditory_impaired, has_set_preferences, updated_at)
SELECT u.id, false, false, true, now()
FROM auth.users u
LEFT JOIN public.user_accessibility_preferences p ON p.user_id = u.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO UPDATE SET has_set_preferences = true;