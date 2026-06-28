CREATE TABLE public.user_accessibility_preferences (
  user_id UUID NOT NULL PRIMARY KEY,
  visually_impaired BOOLEAN NOT NULL DEFAULT false,
  hearing_impaired BOOLEAN NOT NULL DEFAULT false,
  prompt_shown BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_accessibility_preferences TO authenticated;
GRANT ALL ON public.user_accessibility_preferences TO service_role;

ALTER TABLE public.user_accessibility_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own accessibility prefs"
ON public.user_accessibility_preferences FOR SELECT
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own accessibility prefs"
ON public.user_accessibility_preferences FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own accessibility prefs"
ON public.user_accessibility_preferences FOR UPDATE
TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_user_accessibility_preferences_updated_at
BEFORE UPDATE ON public.user_accessibility_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();