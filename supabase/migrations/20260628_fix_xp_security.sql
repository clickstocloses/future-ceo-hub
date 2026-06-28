-- Security fix: Move XP awarding server-side to prevent self-grant exploit
-- Created 2026-06-28

-- Create safe server-side XP award function
CREATE OR REPLACE FUNCTION public.award_xp(p_amount INTEGER, p_reason TEXT)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_old_xp INTEGER;
  v_new_xp INTEGER;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;

  -- Get current XP
  SELECT xp INTO v_old_xp FROM public.profiles WHERE id = v_user_id;

  IF v_old_xp IS NULL THEN
    RETURN json_build_object('error', 'Profile not found');
  END IF;

  -- Award XP atomically
  v_new_xp := v_old_xp + p_amount;
  UPDATE public.profiles SET xp = v_new_xp WHERE id = v_user_id;

  -- Log the transaction
  INSERT INTO public.user_xp_log (user_id, amount, reason)
  VALUES (v_user_id, p_amount, p_reason);

  RETURN json_build_object(
    'success', TRUE,
    'old_xp', v_old_xp,
    'new_xp', v_new_xp,
    'awarded', p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke direct client-side writes to xp column
-- This prevents: supabase.from('profiles').update({ xp: 999999 })
REVOKE UPDATE (xp) ON public.profiles FROM authenticated;

-- Grant execute on the safe RPC to authenticated users
GRANT EXECUTE ON FUNCTION public.award_xp(INTEGER, TEXT) TO authenticated;
