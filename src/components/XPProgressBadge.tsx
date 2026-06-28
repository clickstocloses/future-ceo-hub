import { useUserStore, getLevelTitle, getNextLevelXP, getCurrentLevelMinXP } from '@/stores/userStore';
import { Zap } from 'lucide-react';

interface XPProgressBadgeProps {
  compact?: boolean;
}

export function XPProgressBadge({ compact = false }: XPProgressBadgeProps) {
  const { profile } = useUserStore();
  if (!profile) return null;

  const xp = profile.xp;
  const currentTitle = getLevelTitle(xp);
  const nextXP = getNextLevelXP(xp);
  const currentMin = getCurrentLevelMinXP(xp);
  const remaining = nextXP - xp;
  const progress = ((xp - currentMin) / (nextXP - currentMin)) * 100;
  const isMax = currentTitle === 'Empire Owner' && xp >= 7000;

  // Next title lookup
  const nextTitle = isMax ? null : getLevelTitle(nextXP);

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20" aria-label={`${xp} XP earned. ${isMax ? 'Max Rank' : `${remaining} XP to ${nextTitle}`}`}>
        <Zap className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-medium text-foreground">
          {isMax ? 'Max Rank!' : `${remaining} XP to ${nextTitle}`}
        </span>
      </div>
    );
  }

  return (
    <div className="px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/10" aria-label={`${xp} XP earned. ${isMax ? 'Max Rank' : `${remaining} XP to ${nextTitle}`}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground">
            {isMax ? 'Max Rank Achieved!' : `${remaining} XP to go`}
          </span>
        </div>
      </div>
      {!isMax && (
        <>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label={`${Math.round(progress)}% progress to next rank`}>
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {currentTitle} → {nextTitle}
          </p>
        </>
      )}
    </div>
  );
}
