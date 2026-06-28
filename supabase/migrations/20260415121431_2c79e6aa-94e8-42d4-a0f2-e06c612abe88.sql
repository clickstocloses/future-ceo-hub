
-- Add new columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_theme TEXT DEFAULT 'dark';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_accent TEXT DEFAULT '#3B82F6';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_font_size TEXT DEFAULT 'medium';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pinned_badges JSONB DEFAULT '[]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_visible BOOLEAN DEFAULT true;

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  new_lesson BOOLEAN DEFAULT true,
  weekly_summary BOOLEAN DEFAULT true,
  streak_reminder BOOLEAN DEFAULT true,
  badge_earned BOOLEAN DEFAULT true,
  rank_change BOOLEAN DEFAULT true,
  community_reply BOOLEAN DEFAULT true,
  new_session BOOLEAN DEFAULT true,
  announcements BOOLEAN DEFAULT true,
  email_frequency TEXT DEFAULT 'daily',
  inapp_bell BOOLEAN DEFAULT true,
  inapp_celebration BOOLEAN DEFAULT true,
  inapp_xp_popup BOOLEAN DEFAULT true,
  inapp_streak BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own notification prefs"
  ON public.notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own notification prefs"
  ON public.notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own notification prefs"
  ON public.notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
