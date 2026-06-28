import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRequireAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/stores/userStore';
import { LevelBadge } from '@/components/LevelBadge';
import { UserAvatar } from '@/components/UserAvatar';
import { XPProgressBadge } from '@/components/XPProgressBadge';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

type TimeFilter = 'all' | 'week' | 'month';

export default function LeaderboardPage() {
  useRequireAuth();
  const { user } = useUserStore();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<TimeFilter>('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const perPage = 25;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profilesRes, completionsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('xp', { ascending: false }),
        supabase.from('lesson_completions').select('user_id'),
      ]);

      setProfiles(profilesRes.data || []);

      const counts: Record<string, number> = {};
      (completionsRes.data || []).forEach((c: any) => {
        counts[c.user_id] = (counts[c.user_id] || 0) + 1;
      });
      setLessonCounts(counts);
    } catch (error) {
      console.error('Leaderboard failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  useEffect(() => {
    const profilesChannel = supabase
      .channel('leaderboard-profiles')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
      }, () => fetchData())
      .subscribe();

    const completionsChannel = supabase
      .channel('leaderboard-completions')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'lesson_completions',
      }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(completionsChannel);
    };
  }, []);

  const paginated = profiles.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(profiles.length / perPage);

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/10 border-yellow-500/30';
    if (rank === 2) return 'bg-gray-300/10 border-gray-400/30';
    if (rank === 3) return 'bg-orange-500/10 border-orange-600/30';
    return '';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">{profiles.length} students enrolled</p>
        </div>
        <div className="flex items-center gap-3">
          <XPProgressBadge compact />
          <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(['all', 'week', 'month'] as TimeFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(0); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {f === 'all' ? 'All Time' : f === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 text-xs text-muted-foreground font-medium">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Student</div>
            <div className="col-span-2">Level</div>
            <div className="col-span-1 text-right">XP</div>
            <div className="col-span-2 text-right">Lessons</div>
            <div className="col-span-2 text-right">Streak</div>
          </div>

          <div className="space-y-1">
            {paginated.map((p, i) => {
              const rank = page * perPage + i + 1;
              const isMe = p.id === user?.id;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`grid grid-cols-12 gap-2 items-center px-4 py-3 rounded-lg border transition-colors ${
                    isMe ? 'bg-primary/10 border-primary/30' : getRankStyle(rank) || 'border-transparent hover:bg-muted/30'
                  }`}
                >
                  <div className="col-span-1 text-data text-sm text-muted-foreground">#{rank}</div>
                  <div className="col-span-4 sm:col-span-4 flex items-center gap-3">
                    <UserAvatar
                      xp={p.xp}
                      avatarUrl={p.avatar_url}
                      username={p.username}
                      size={32}
                    />
                    <span className="text-sm font-medium text-foreground truncate">{p.username}</span>
                  </div>
                  <div className="col-span-2 hidden sm:block">
                    <LevelBadge xp={p.xp} size="sm" />
                  </div>
                  <div className="col-span-1 text-right text-data text-sm text-primary">{p.xp.toLocaleString()}</div>
                  <div className="col-span-2 text-right text-data text-sm text-muted-foreground hidden sm:block">
                    {lessonCounts[p.id] || 0}
                  </div>
                  <div className="col-span-2 text-right text-data text-sm text-muted-foreground hidden sm:flex items-center justify-end gap-1">
                    <Flame className="w-3 h-3 text-level-brand" />{p.streak}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm rounded-lg bg-muted text-foreground disabled:opacity-30"
              >
                Prev
              </button>
              <span className="px-3 py-1.5 text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm rounded-lg bg-muted text-foreground disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
