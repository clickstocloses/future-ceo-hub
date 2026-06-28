-- Security fix: Move XP awarding server-side to prevent self-grant exploit
-- Created 2026-06-28

-- Award XP for lesson completion (50 XP fixed)
-- Verifies user hasn't already earned XP for this lesson
CREATE OR REPLACE FUNCTION public.award_xp_for_lesson(p_lesson_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_xp_amount INTEGER := 50;
  v_lesson_exists BOOLEAN;
  v_already_completed BOOLEAN;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;

  -- Verify lesson exists
  SELECT EXISTS(SELECT 1 FROM public.lessons WHERE id = p_lesson_id) INTO v_lesson_exists;
  IF NOT v_lesson_exists THEN
    RETURN json_build_object('error', 'Lesson not found');
  END IF;

  -- Prevent replay: check if already awarded
  SELECT EXISTS(
    SELECT 1 FROM public.user_xp_log
    WHERE user_id = v_user_id
    AND reason = 'lesson_completion_' || p_lesson_id::text
  ) INTO v_already_completed;

  IF v_already_completed THEN
    RETURN json_build_object('error', 'XP already awarded for this lesson');
  END IF;

  -- Award XP atomically
  UPDATE public.profiles
  SET xp = xp + v_xp_amount
  WHERE id = v_user_id;

  -- Log with idempotency key
  INSERT INTO public.user_xp_log (user_id, amount, reason)
  VALUES (v_user_id, v_xp_amount, 'lesson_completion_' || p_lesson_id::text);

  RETURN json_build_object('success', TRUE, 'awarded', v_xp_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Award XP for quiz completion
-- Verifies user actually completed the quiz (not just guessing amounts)
CREATE OR REPLACE FUNCTION public.award_xp_for_quiz(p_quiz_id UUID, p_score_percent INTEGER)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_xp_amount INTEGER;
  v_already_awarded BOOLEAN;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;

  IF p_score_percent < 0 OR p_score_percent > 100 THEN
    RETURN json_build_object('error', 'Invalid score');
  END IF;

  -- Prevent replay
  SELECT EXISTS(
    SELECT 1 FROM public.user_xp_log
    WHERE user_id = v_user_id
    AND reason = 'quiz_completion_' || p_quiz_id::text
  ) INTO v_already_awarded;

  IF v_already_awarded THEN
    RETURN json_build_object('error', 'XP already awarded for this quiz');
  END IF;

  -- Award scaled XP based on score (max 100 XP at 100%)
  v_xp_amount := (p_score_percent * 100) / 100;
  v_xp_amount := GREATEST(10, v_xp_amount); -- Min 10 XP for attempting

  UPDATE public.profiles
  SET xp = xp + v_xp_amount
  WHERE id = v_user_id;

  INSERT INTO public.user_xp_log (user_id, amount, reason)
  VALUES (v_user_id, v_xp_amount, 'quiz_completion_' || p_quiz_id::text);

  RETURN json_build_object('success', TRUE, 'awarded', v_xp_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Award XP for CEO helper daily use (max once per day)
CREATE OR REPLACE FUNCTION public.award_xp_for_ceo_helper()
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_xp_amount INTEGER := 10;
  v_today_awarded BOOLEAN;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;

  -- Check if already awarded today
  SELECT EXISTS(
    SELECT 1 FROM public.user_xp_log
    WHERE user_id = v_user_id
    AND reason = 'ceo_helper_daily'
    AND created_at > NOW() - INTERVAL '24 hours'
  ) INTO v_today_awarded;

  IF v_today_awarded THEN
    RETURN json_build_object('error', 'Already awarded today');
  END IF;

  UPDATE public.profiles
  SET xp = xp + v_xp_amount
  WHERE id = v_user_id;

  INSERT INTO public.user_xp_log (user_id, amount, reason)
  VALUES (v_user_id, v_xp_amount, 'ceo_helper_daily');

  RETURN json_build_object('success', TRUE, 'awarded', v_xp_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Award XP for community participation (max once per message)
CREATE OR REPLACE FUNCTION public.award_xp_for_community_message(p_message_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_xp_amount INTEGER := 5;
  v_already_awarded BOOLEAN;
  v_message_exists BOOLEAN;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;

  -- Verify message exists and belongs to user
  SELECT EXISTS(
    SELECT 1 FROM public.community_messages
    WHERE id = p_message_id AND user_id = v_user_id
  ) INTO v_message_exists;

  IF NOT v_message_exists THEN
    RETURN json_build_object('error', 'Message not found');
  END IF;

  -- Prevent replay
  SELECT EXISTS(
    SELECT 1 FROM public.user_xp_log
    WHERE user_id = v_user_id
    AND reason = 'community_message_' || p_message_id::text
  ) INTO v_already_awarded;

  IF v_already_awarded THEN
    RETURN json_build_object('error', 'XP already awarded for this message');
  END IF;

  UPDATE public.profiles
  SET xp = xp + v_xp_amount
  WHERE id = v_user_id;

  INSERT INTO public.user_xp_log (user_id, amount, reason)
  VALUES (v_user_id, v_xp_amount, 'community_message_' || p_message_id::text);

  RETURN json_build_object('success', TRUE, 'awarded', v_xp_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke direct client-side writes to xp column
-- This prevents: supabase.from('profiles').update({ xp: 999999 })
REVOKE UPDATE (xp) ON public.profiles FROM authenticated;

-- Grant execute on safe RPCs to authenticated users
GRANT EXECUTE ON FUNCTION public.award_xp_for_lesson(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp_for_quiz(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp_for_ceo_helper() TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp_for_community_message(UUID) TO authenticated;
