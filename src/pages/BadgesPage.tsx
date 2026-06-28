import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRequireAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/stores/userStore';
import { motion } from 'framer-motion';
import {
  Award, Lock, Footprints, Brain, Flame, Zap, Rocket, Target,
  Timer, Users, Crown, BookOpen,
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  FootprintsIcon: Footprints,
  BrainIcon: Brain,
  FlameIcon: Flame,
  ZapIcon: Zap,
  RocketIcon: Rocket,
  TargetIcon: Target,
  TimerIcon: Timer,
  UsersIcon: Users,
  CrownIcon: Crown,
  AwardIcon: Award,
};

export default function BadgesPage() {
  const { user: authUser, loading: authLoading } = useRequireAuth();
  const { user } = useUserStore();
  const [badges, setBadges] = useState<any[]>([]);
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user && !authUser) {
      setLoading(false);
      return;
    }
    const activeUser = user || authUser;
    if (!activeUser) return;
    const fetch = async () => {
      try {
        const [allBadgesRes, userBadgesRes] = await Promise.all([
          supabase.from('badges').select('*'),
          supabase.from('user_badges').select('badge_id').eq('user_id', activeUser.id),
        ]);
        setBadges(allBadgesRes.data || []);
        setEarnedIds(new Set((userBadgesRes.data || []).map(b => b.badge_id)));
      } catch (error) {
        console.error('Badges failed to load:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user, authUser, authLoading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-2">Badges & Achievements</h1>
      <p className="text-muted-foreground mb-8">
        {earnedIds.size} of {badges.length} badges earned
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {badges.map((badge, i) => {
          const earned = earnedIds.has(badge.id);
          const IconComp = ICON_MAP[badge.icon_name] || Award;

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className={`card-surface p-5 text-center ${!earned ? 'opacity-40' : ''}`}
            >
              <div className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center ${earned ? 'bg-primary/20' : 'bg-muted'}`}>
                {earned ? (
                  <IconComp className="w-6 h-6 text-primary" />
                ) : (
                  <Lock className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <h3 className="font-heading font-bold text-foreground text-sm mb-1">{badge.name}</h3>
              <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>
              <p className="text-xs text-muted-foreground/70">{badge.criteria}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
