import { RankFrame, getRankFromXP, type RankInfo } from '@/components/RankFrame';
import { useUserStore } from '@/stores/userStore';
import { Lock, Zap, Crown } from 'lucide-react';

const RANK_TIERS: { tier: number; name: string; minXP: number; maxXP: number | null; color: string }[] = [
  { tier: 1, name: 'Budget Rookie', minXP: 0, maxXP: 99, color: '#6B7280' },
  { tier: 2, name: 'Profit Player', minXP: 100, maxXP: 299, color: '#3B82F6' },
  { tier: 3, name: 'Cash Flow Creator', minXP: 300, maxXP: 599, color: '#14B8A6' },
  { tier: 4, name: 'Deal Maker', minXP: 600, maxXP: 999, color: '#8B5CF6' },
  { tier: 5, name: 'Brand Builder', minXP: 1000, maxXP: 1999, color: '#F97316' },
  { tier: 6, name: 'Market Dominator', minXP: 2000, maxXP: 3999, color: '#EF4444' },
  { tier: 7, name: 'Tycoon', minXP: 4000, maxXP: 6999, color: '#F59E0B' },
  { tier: 8, name: 'Empire Owner', minXP: 7000, maxXP: null, color: '#ff6b6b' },
];

const MAX_XP = 7000;

export default function RanksPage() {
  const { profile } = useUserStore();
  const userXP = profile?.xp ?? 0;
  const currentRank = getRankFromXP(userXP);
  const overallProgress = Math.min((userXP / MAX_XP) * 100, 100);

  const nextRankTier = RANK_TIERS.find(r => r.minXP > userXP);
  const xpToNext = nextRankTier ? nextRankTier.minXP - userXP : 0;
  const isMaxRank = !nextRankTier;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Hero: Current Rank */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <RankFrame xp={userXP} size={100}>
            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-lg font-heading font-bold text-primary">
              {profile?.full_name?.split(' ').map(n => n[0]).join('') ?? '?'}
            </div>
          </RankFrame>
          <div className="flex-1 text-center sm:text-left space-y-1">
            <p className="text-muted-foreground text-sm font-medium">Your Current Rank</p>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">{currentRank.name}</h1>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Zap className="w-4 h-4 text-warning" />
              <span className="text-foreground font-semibold">{userXP.toLocaleString()} XP</span>
              {!isMaxRank && (
                <span className="text-muted-foreground text-sm">
                  · {xpToNext.toLocaleString()} XP to {nextRankTier!.name}
                </span>
              )}
              {isMaxRank && (
                <span className="text-muted-foreground text-sm">· Max Rank Achieved!</span>
              )}
            </div>
          </div>
        </div>

        {/* Overall progress to Empire Owner */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress to Empire Owner</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${overallProgress}%`,
                background: isMaxRank
                  ? 'linear-gradient(90deg, #ff6b6b, #ffa94d, #ffe066, #69db7c, #4dabf7, #da77f2, #ff6b6b)'
                  : `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))`,
                backgroundSize: isMaxRank ? '200% 100%' : undefined,
                animation: isMaxRank ? 'rainbowBg 3s linear infinite' : undefined,
              }}
            />
          </div>
        </div>
      </div>

      {/* Rank Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {RANK_TIERS.map((rank) => {
          const isUnlocked = userXP >= rank.minXP;
          const isCurrent = currentRank.tier === rank.tier;
          const tierProgress = getTierProgress(userXP, rank);

          return (
            <div
              key={rank.tier}
              className={`relative rounded-xl border p-5 flex flex-col items-center gap-3 transition-all duration-300 ${
                isCurrent
                  ? 'border-primary bg-card shadow-[0_0_20px_hsl(var(--primary)/0.25)]'
                  : isUnlocked
                    ? 'border-border bg-card'
                    : 'border-border bg-card/40 opacity-50'
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Current
                </div>
              )}

              <div className="relative">
                <RankFrame xp={rank.minXP} size={72}>
                  <div
                    className="w-full h-full flex items-center justify-center font-heading font-bold text-sm"
                    style={{ color: rank.color }}
                  >
                    {rank.tier}
                  </div>
                </RankFrame>
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="text-center space-y-0.5">
                <p className="font-heading font-bold text-sm text-foreground">{rank.name}</p>
                <p className="text-xs text-muted-foreground">
                  {rank.maxXP ? `${rank.minXP.toLocaleString()} – ${rank.maxXP.toLocaleString()} XP` : `${rank.minXP.toLocaleString()}+ XP`}
                </p>
              </div>

              {/* Tier progress bar */}
              <div className="w-full space-y-1">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${tierProgress}%`,
                      backgroundColor: rank.color,
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  {isUnlocked
                    ? tierProgress >= 100
                      ? 'Completed'
                      : `${Math.round(tierProgress)}% through`
                    : `${(rank.minXP - userXP).toLocaleString()} XP away`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getTierProgress(userXP: number, rank: typeof RANK_TIERS[number]): number {
  if (userXP < rank.minXP) return 0;
  if (!rank.maxXP) return 100; // Empire Owner — if you're here, you've made it
  const range = rank.maxXP - rank.minXP + 1;
  const progress = Math.min(userXP - rank.minXP, range) / range * 100;
  return Math.min(progress, 100);
}
