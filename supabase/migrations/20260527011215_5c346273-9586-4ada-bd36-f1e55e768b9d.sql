ALTER TABLE public.user_accessibility_preferences
  RENAME COLUMN hearing_impaired TO auditory_impaired;

ALTER TABLE public.user_accessibility_preferences
  RENAME COLUMN prompt_shown TO has_set_preferences;

ALTER TABLE public.user_accessibility_preferences
  ADD CONSTRAINT user_accessibility_preferences_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;