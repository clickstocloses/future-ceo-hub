
-- Enable realtime for profiles
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Add UPDATE and DELETE policies on community_messages
CREATE POLICY "Users update own messages" ON public.community_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own messages" ON public.community_messages FOR DELETE USING (auth.uid() = user_id);
