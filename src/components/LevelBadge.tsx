import { getLevelTitle, getLevelColor, getLevelBgColor, type LevelTitle } from '@/stores/userStore';
import { cn } from '@/lib/utils';

interface LevelBadgeProps {
  xp: number;
  size?: 'sm' | 'md' | 'lg';
  showXP?: boolean;
}

export function LevelBadge({ xp, size = 'md', showXP = false }: LevelBadgeProps) {
  const title = getLevelTitle(xp);
  const colorClass = getLevelColor(title);
  const bgClass = getLevelBgColor(title);
  const isEmpire = title === 'Empire Owner';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  if (isEmpire) {
    return (
      <span className="empire-border inline-block">
        <span className={cn(
          'relative z-10 rounded-full bg-background font-heading font-semibold inline-flex items-center gap-1',
          sizeClasses[size]
        )}>
          <span className="gradient-text">{title}</span>
          {showXP && <span className="text-muted-foreground ml-1">{xp.toLocaleString()} XP</span>}
        </span>
      </span>
    );
  }

  return (
    <span className={cn(
      'rounded-full font-heading font-semibold inline-flex items-center gap-1',
      sizeClasses[size],
      bgClass,
      colorClass
    )}>
      {title}
      {showXP && <span className="text-muted-foreground ml-1">{xp.toLocaleString()} XP</span>}
    </span>
  );
}
