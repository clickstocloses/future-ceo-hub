import { supabase } from '@/integrations/supabase/client';

export async function checkAndAwardBadges(userId: string, lessonId: string, moduleId: string, firstAttemptPerfect: boolean) {
  const [badgesRes, earnedRes, completionsRes, moduleLessonsRes] = await Promise.all([
    supabase.from('badges').select('*'),
    supabase.from('user_badges').select('badge_id').eq('user_id', userId),
    supabase.from('lesson_completions').select('id, lesson_id, completed_at').eq('user_id', userId),
    supabase.from('lessons').select('id').eq('module_id', moduleId),
  ]);

  const badges = badgesRes.data || [];
  const earnedBadgeIds = new Set((earnedRes.data || []).map((b: any) => b.badge_id));
  const completions = completionsRes.data || [];
  const completedLessonIds = new Set(completions.map((c: any) => c.lesson_id));
  const moduleLessonIds = new Set((moduleLessonsRes.data || []).map((l: any) => l.id));
  const toAward: string[] = [];

  for (const badge of badges) {
    if (earnedBadgeIds.has(badge.id)) continue;

    // First Step — complete 1 lesson
    if (badge.slug === 'first-step') {
      if (completions.length >= 1) toAward.push(badge.id);
      continue;
    }

    // Perfect Score — first attempt perfect on any quiz
    if (badge.slug === 'perfect-score') {
      if (firstAttemptPerfect) toAward.push(badge.id);
      continue;
    }

    // Speed Learner — 3 completions in 24 hours
    if (badge.slug === 'speed-learner') {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const recentCount = completions.filter((c: any) => c.completed_at >= dayAgo).length;
      if (recentCount >= 3) toAward.push(badge.id);
      continue;
    }

    // On a Roll — 3-day streak (check profile)
    if (badge.slug === 'on-a-roll') {
      const { data: prof } = await supabase.from('profiles').select('streak').eq('id', userId).maybeSingle();
      if (prof && prof.streak >= 3) toAward.push(badge.id);
      continue;
    }

    // On Fire — 7-day streak
    if (badge.slug === 'on-fire') {
      const { data: prof } = await supabase.from('profiles').select('streak').eq('id', userId).maybeSingle();
      if (prof && prof.streak >= 7) toAward.push(badge.id);
      continue;
    }

    // Unstoppable — 30-day streak
    if (badge.slug === 'unstoppable') {
      const { data: prof } = await supabase.from('profiles').select('streak').eq('id', userId).maybeSingle();
      if (prof && prof.streak >= 30) toAward.push(badge.id);
      continue;
    }

    // Community Builder — send 10 community messages
    if (badge.slug === 'community-builder') {
      const { count } = await supabase
        .from('community_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      if ((count || 0) >= 10) toAward.push(badge.id);
      continue;
    }

    // Module Master badges — check if all lessons in that specific module are done
    if (badge.slug.startsWith('module-master-')) {
      // Get the module number from the slug (e.g., "module-master-1" → 1)
      const moduleNum = parseInt(badge.slug.split('-').pop() || '0');
      // Fetch the module by order_index
      const { data: mod } = await supabase
        .from('modules')
        .select('id')
        .eq('order_index', moduleNum)
        .maybeSingle();
      if (mod) {
        const { data: modLessons } = await supabase
          .from('lessons')
          .select('id')
          .eq('module_id', mod.id);
        const modLessonIds = (modLessons || []).map((l: any) => l.id);
        if (modLessonIds.length > 0 && modLessonIds.every(id => completedLessonIds.has(id))) {
          toAward.push(badge.id);
        }
      }
      continue;
    }

    // Future CEO — complete all lessons
    if (badge.slug === 'future-ceo') {
      const { count } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true });
      if (count && completions.length >= count) toAward.push(badge.id);
      continue;
    }
  }

  // Award badges
  if (toAward.length > 0) {
    await supabase.from('user_badges').insert(
      toAward.map(badgeId => ({ user_id: userId, badge_id: badgeId }))
    );
  }

  return toAward.length;
}
