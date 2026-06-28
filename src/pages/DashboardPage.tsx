import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore, getLevelTitle, getNextLevelXP, getCurrentLevelMinXP } from '@/stores/userStore';
import { useRequireAuth } from '@/hooks/useAuth';
import { LevelBadge } from '@/components/LevelBadge';
import { UserAvatar } from '@/components/UserAvatar';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Zap,
  Flame,
  Trophy,
  ArrowRight,
  Calendar,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const { profile, profileError, fetchProfile } = useUserStore();
  const [completedCount, setCompletedCount] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [recentBadges, setRecentBadges] = useState<any[]>([]);
  const [nextLesson, setNextLesson] = useState<any>(null);
  const [rank, setRank] = useState(0);

  useEffect(() => {
    if (user && !profile) {
      fetchProfile(user.id);
    }
  }, [user, profile, fetchProfile]);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        const [completedRes, totalRes, lbRes, allProfilesRes, sessRes, badgesRes, completionsRes, lessonsRes] = await Promise.all([
          supabase.from('lesson_completions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('lessons').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('id, username, full_name, xp, streak, avatar_url').order('xp', { ascending: false }).limit(5),
          supabase.from('profiles').select('id, xp').order('xp', { ascending: false }),
          supabase.from('schedule_sessions').select('*').gte('starts_at', new Date().toISOString()).order('starts_at').limit(3),
          supabase.from('user_badges').select('*, badges(*)').eq('user_id', user.id).order('earned_at', { ascending: false }).limit(5),
          supabase.from('lesson_completions').select('lesson_id').eq('user_id', user.id),
          supabase.from('lessons').select('*, modules(title, order_index)').order('order_index'),
        ]);

        setCompletedCount(completedRes.count || 0);
        setTotalLessons(totalRes.count || 0);
        setLeaderboard(lbRes.data || []);
        setSessions(sessRes.data || []);
        setRecentBadges(badgesRes.data || []);

        if (allProfilesRes.data) {
          const myRank = allProfilesRes.data.findIndex(p => p.id === user.id) + 1;
          setRank(myRank || 0);
        }

        const completedIds = (completionsRes.data || []).map(c => c.lesson_id);
        const lessons = lessonsRes.data || [];
        const sorted = lessons.sort((a: any, b: any) => {
          const modDiff = (a.modules?.order_index || 0) - (b.modules?.order_index || 0);
          if (modDiff !== 0) return modDiff;
          return a.order_index - b.order_index;
        });
        const next = sorted.find((l: any) => !completedIds.includes(l.id));
        setNextLesson(next);
      } catch (error) {
        console.error('Dashboard data failed to load:', error);
      }
    };

    fetchDashboardData();
  }, [user, profile?.xp]);

  if (authLoading) {
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
          <h1 className="font-heading text-xl font-bold text-foreground">Account profile could not load</h1>
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
  const completionPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const stats = [
    { icon: BookOpen, label: 'Lessons Completed', value: completedCount, color: 'text-primary' },
    { icon: Zap, label: 'Total XP', value: xp.toLocaleString(), color: 'text-level-tycoon' },
    { icon: Flame, label: 'Current Streak', value: `${profile.streak} days`, color: 'text-level-brand' },
    { icon: Trophy, label: 'Leaderboard Rank', value: rank > 0 ? `#${rank}` : '—', color: 'text-level-cashflow' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-1">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
            Welcome back, {profile.full_name.split(' ')[0]}
          </h1>
          <LevelBadge xp={xp} size="md" showXP />
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{getLevelTitle(xp)}</span>
            <span>{xp} / {nextLevelXP} XP</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden max-w-md">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.2, 0, 0, 1] }}
            className="card-surface p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-xl font-heading font-bold text-foreground">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-surface p-5">
            <h2 className="font-heading font-bold text-foreground mb-3">Overall Progress</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
              <span className="text-data text-sm text-foreground">{completionPercent}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {completedCount} of {totalLessons} lessons completed
            </p>
          </div>

          {nextLesson && (
            <div className="card-surface-hover p-5">
              <h2 className="font-heading font-bold text-foreground mb-3">Continue Learning</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{(nextLesson as any).modules?.title}</p>
                  <p className="font-medium text-foreground">{nextLesson.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">+{nextLesson.xp_reward} XP • {nextLesson.duration_minutes} min</p>
                </div>
                <Link
                  to={`/courses/${nextLesson.module_id}/lessons/${nextLesson.id}`}
                  className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Resume <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {recentBadges.length > 0 && (
            <div className="card-surface p-5">
              <h2 className="font-heading font-bold text-foreground mb-3">Recent Badges</h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {recentBadges.map((ub: any) => (
                  <div key={ub.id} className="flex-shrink-0 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                      <span className="text-lg">🏆</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{ub.badges?.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-bold text-foreground">Leaderboard</h2>
              <Link to="/leaderboard" className="text-xs text-primary hover:underline">View All</Link>
            </div>
            <div className="space-y-2">
              {leaderboard.map((p: any, i: number) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 p-2 rounded-lg ${p.id === user?.id ? 'bg-primary/10' : 'bg-muted/30'}`}
                >
                  <span className="text-data text-xs text-muted-foreground w-5">#{i + 1}</span>
                  <UserAvatar
                    xp={p.xp}
                    avatarUrl={p.avatar_url}
                    username={p.username}
                    size={28}
                  />
                  <span className="flex-1 text-sm text-foreground truncate">{p.username}</span>
                  <span className="text-data text-xs text-primary">{p.xp.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-bold text-foreground">Upcoming</h2>
              <Link to="/schedule" className="text-xs text-primary hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {sessions.length === 0 && (
                <p className="text-sm text-muted-foreground">No upcoming sessions</p>
              )}
              {sessions.map((s: any) => (
                <div key={s.id} className="p-3 rounded-lg bg-muted/30">
                  <p className="text-sm font-medium text-foreground">{s.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(s.starts_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-xs text-primary">{s.session_type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
