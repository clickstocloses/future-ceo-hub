
CREATE TABLE IF NOT EXISTS public.ceo_helper_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(user_id, date)
);

ALTER TABLE public.ceo_helper_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own usage" ON public.ceo_helper_usage
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users select own usage" ON public.ceo_helper_usage
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own usage" ON public.ceo_helper_usage
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
