import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

const AUTH_TIMEOUT_MS = 8000;

async function withTimeout<T>(promise: PromiseLike<T>, label: string, ms = AUTH_TIMEOUT_MS): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
  });

  try {
    return await Promise.race([Promise.resolve(promise), timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export type LevelTitle = 'Budget Rookie' | 'Profit Player' | 'Cash Flow Creator' | 'Deal Maker' | 'Brand Builder' | 'Market Dominator' | 'Tycoon' | 'Empire Owner';

export function getLevelTitle(xp: number): LevelTitle {
  if (xp >= 7000) return 'Empire Owner';
  if (xp >= 4000) return 'Tycoon';
  if (xp >= 2000) return 'Market Dominator';
  if (xp >= 1000) return 'Brand Builder';
  if (xp >= 600) return 'Deal Maker';
  if (xp >= 300) return 'Cash Flow Creator';
  if (xp >= 100) return 'Profit Player';
  return 'Budget Rookie';
}

export function getLevelColor(title: LevelTitle): string {
  switch (title) {
    case 'Budget Rookie': return 'text-level-rookie';
    case 'Profit Player': return 'text-level-profit';
    case 'Cash Flow Creator': return 'text-level-cashflow';
    case 'Deal Maker': return 'text-level-deal';
    case 'Brand Builder': return 'text-level-brand';
    case 'Market Dominator': return 'text-level-market';
    case 'Tycoon': return 'text-level-tycoon';
    case 'Empire Owner': return 'text-foreground';
  }
}

export function getLevelBgColor(title: LevelTitle): string {
  switch (title) {
    case 'Budget Rookie': return 'bg-muted-foreground/20';
    case 'Profit Player': return 'bg-primary/20';
    case 'Cash Flow Creator': return 'bg-emerald-500/20';
    case 'Deal Maker': return 'bg-purple-500/20';
    case 'Brand Builder': return 'bg-orange-500/20';
    case 'Market Dominator': return 'bg-red-500/20';
    case 'Tycoon': return 'bg-yellow-500/20';
    case 'Empire Owner': return 'bg-gradient-to-r from-primary/20 to-emerald-500/20';
  }
}

export function getNextLevelXP(xp: number): number {
  if (xp >= 7000) return 10000;
  if (xp >= 4000) return 7000;
  if (xp >= 2000) return 4000;
  if (xp >= 1000) return 2000;
  if (xp >= 600) return 1000;
  if (xp >= 300) return 600;
  if (xp >= 100) return 300;
  return 100;
}

export function getCurrentLevelMinXP(xp: number): number {
  if (xp >= 7000) return 7000;
  if (xp >= 4000) return 4000;
  if (xp >= 2000) return 2000;
  if (xp >= 1000) return 1000;
  if (xp >= 600) return 600;
  if (xp >= 300) return 300;
  if (xp >= 100) return 100;
  return 0;
}

interface Profile {
  id: string;
  username: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
  xp: number;
  streak: number;
  longest_streak: number;
  last_login: string | null;
  created_at: string;
}

interface UserStore {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileError: string | null;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  fetchProfile: (userId: string) => Promise<void>;
  addXPForLesson: (lessonId: string) => Promise<void>;
  addXPForQuiz: (quizId: string, scorePercent: number) => Promise<void>;
  addXPForCEOHelper: () => Promise<void>;
  addXPForCommunityMessage: (messageId: string) => Promise<void>;
  initialize: () => Promise<() => void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  profileError: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile, profileError: null }),
  setLoading: (loading) => set({ loading }),

  fetchProfile: async (userId: string) => {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),
        'Profile fetch'
      );

      if (error) throw error;

      if (data) {
        set({ profile: data as Profile, profileError: null });
        return;
      }

      set({ profile: null, profileError: 'We could not find your account profile. Please sign out and sign back in.' });
    } catch (error) {
      console.error('Profile fetch failed:', error);
      set({ profile: null, profileError: 'We could not load your account profile. Please refresh or sign out and back in.' });
    }
  },

  addXPForLesson: async (lessonId: string) => {
    const { user } = get();
    if (!user) return;

    const { data, error } = await supabase.rpc('award_xp_for_lesson', {
      p_lesson_id: lessonId,
    });

    if (error) {
      console.error('Failed to award XP for lesson:', error);
      return;
    }

    await get().fetchProfile(user.id);
  },

  addXPForQuiz: async (quizId: string, scorePercent: number) => {
    const { user } = get();
    if (!user) return;

    const { data, error } = await supabase.rpc('award_xp_for_quiz', {
      p_quiz_id: quizId,
      p_score_percent: Math.round(scorePercent),
    });

    if (error) {
      console.error('Failed to award XP for quiz:', error);
      return;
    }

    await get().fetchProfile(user.id);
  },

  addXPForCEOHelper: async () => {
    const { user } = get();
    if (!user) return;

    const { data, error } = await supabase.rpc('award_xp_for_ceo_helper');

    if (error) {
      console.error('Failed to award XP for CEO helper:', error);
      return;
    }

    await get().fetchProfile(user.id);
  },

  addXPForCommunityMessage: async (messageId: string) => {
    const { user } = get();
    if (!user) return;

    const { data, error } = await supabase.rpc('award_xp_for_community_message', {
      p_message_id: messageId,
    });

    if (error) {
      console.error('Failed to award XP for community message:', error);
      return;
    }

    await get().fetchProfile(user.id);
  },

  initialize: async () => {
    set({ loading: true });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          set({ user: session.user, profileError: null, loading: true });
          setTimeout(() => {
            get().fetchProfile(session.user.id)
              .catch((error) => {
                console.error('Deferred profile fetch failed:', error);
              })
              .finally(() => set({ loading: false }));
          }, 0);
        } else {
          set({ user: null, profile: null, profileError: null, loading: false });
        }
      }
    );

    try {
      const { data: { session } } = await withTimeout(supabase.auth.getSession(), 'Session restore');
      if (session?.user) {
        set({ user: session.user, profileError: null });
        await get().fetchProfile(session.user.id);
      } else {
        set({ user: null, profile: null, profileError: null });
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      set({ user: null, profile: null, profileError: 'We could not restore your session. Please sign in again.' });
    }
    set({ loading: false });

    return () => subscription.unsubscribe();
  },
}));
