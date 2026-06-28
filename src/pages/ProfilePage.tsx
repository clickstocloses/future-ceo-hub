import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRequireAuth } from '@/hooks/useAuth';
import { useUserStore, getLevelTitle, getNextLevelXP, getCurrentLevelMinXP } from '@/stores/userStore';
import { LevelBadge } from '@/components/LevelBadge';
import { AvatarUpload } from '@/components/AvatarUpload';
import { motion } from 'framer-motion';
import {
  Zap, BookOpen, Award, Flame, Trophy, Calendar,
} from 'lucide-react';

export default function ProfilePage() {
  const { user: authUser, loading: authLoading } = useRequireAuth();
  const { user, profile, profileError, fetchProfile } = useUserStore();
  const [completedCount, setCompletedCount] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [rank, setRank] = useState(0);
  const [recentBadges, setRecentBadges] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (user && !profile) {
      fetchProfile(user.id);
    }
  }, [user, profile, fetchProfile]);

  useEffect(() => {
    if (authLoading) return;
    if (!user && !authUser) {
      setDataLoaded(true);
      return;
    }
    const activeUser = user || authUser;
    if (!activeUser) return;
    const load = async () => {
      try {
        const [completedRes, badgesRes, allProfilesRes, ubRes] = await Promise.all([
          supabase.from('lesson_completions').select('*', { count: 'exact', head: true }).eq('user_id', activeUser.id),
          supabase.from('user_badges').select('*', { count: 'exact', head: true }).eq('user_id', activeUser.id),
          supabase.from('profiles').select('id, xp').order('xp', { ascending: false }),
          supabase.from('user_badges').select('*, badges(*)').eq('user_id', activeUser.id).order('earned_at', { ascending: false }).limit(6),
        ]);

        setCompletedCount(completedRes.count || 0);
        setBadgeCount(badgesRes.count || 0);
        if (allProfilesRes.data) {
          setRank(allProfilesRes.data.findIndex(p => p.id === activeUser.id) + 1);
        }
        setRecentBadges(ubRes.data || []);
      } catch (error) {
        console.error('Profile data failed to load:', error);
      } finally {
        setDataLoaded(true);
      }
    };
    load();

    // Realtime: refetch when lesson completions change
    const channel = supabase
      .channel('profile-completions')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'lesson_completions',
        filter: `user_id=eq.${activeUser.id}`,
      }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, authUser, authLoading]);

  if (!dataLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="card-surface max-w-md p-6 text-center">
          <h1 className="font-heading text-xl font-bold text-foreground">Profile could not load</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {profileError || 'Refresh the page or sign out and back in to restore your account.'}
          </p>
        </div>
      </div>
    );
  }

  const xp = profile.xp;
  const nextLevelXP = getNextLevelXP(xp);
  const currentMin = getCurrentLevelMinXP(xp);
  const progressPercent = ((xp - currentMin) / (nextLevelXP - currentMin)) * 100;

  const stats = [
    { icon: Zap, label: 'Total XP', value: xp.toLocaleString() },
    { icon: BookOpen, label: 'Lessons', value: completedCount },
    { icon: Award, label: 'Badges', value: badgeCount },
    { icon: Flame, label: 'Streak', value: `${profile.streak} days` },
    { icon: Trophy, label: 'Rank', value: rank > 0 ? `#${rank}` : '—' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-surface p-6 sm:p-8 text-center mb-6"
      >
        <div className="mb-4">
          <AvatarUpload />
        </div>
        <h1 className="text-2xl font-heading font-bold text-foreground">{profile.full_name}</h1>
        <p className="text-muted-foreground text-sm mb-2">@{profile.username}</p>
        <LevelBadge xp={xp} size="lg" showXP />
        <p className="text-xs text-muted-foreground mt-3">
          <Calendar className="w-3 h-3 inline mr-1" />
          Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>

        <div className="mt-4 max-w-xs mx-auto">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{getLevelTitle(xp)}</span>
            <span>{xp} / {nextLevelXP} XP</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card-surface p-4 text-center"
          >
            <s.icon className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-heading font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {recentBadges.length > 0 && (
        <div className="card-surface p-5">
          <h2 className="font-heading font-bold text-foreground mb-3">Badge Showcase</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {recentBadges.map((ub: any) => (
              <div key={ub.id} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground truncate">{ub.badges?.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
