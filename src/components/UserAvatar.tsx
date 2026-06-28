import { useState } from 'react';
import { RankFrame } from '@/components/RankFrame';

const AVATAR_COLORS = [
  '#3b82f6', '#8b5cf6', '#f97316', '#ef4444',
  '#14b8a6', '#f59e0b', '#10b981', '#ec4899',
];

function hashUsername(username: string): number {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

interface UserAvatarProps {
  xp: number;
  avatarUrl?: string | null;
  username: string;
  size?: number;
  showRankFrame?: boolean;
}

export function UserAvatar({
  xp,
  avatarUrl,
  username,
  size = 40,
  showRankFrame = true,
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const bgColor = AVATAR_COLORS[hashUsername(username) % AVATAR_COLORS.length];
  const initial = username ? username[0].toUpperCase() : '?';
  const fontSize = Math.max(size * 0.35, 10);

  const showImage = avatarUrl && !imgError;

  const avatarContent = showImage ? (
    <img
      src={avatarUrl}
      alt={username}
      loading="lazy"
      onError={() => setImgError(true)}
      className="w-full h-full object-cover"
    />
  ) : (
    <div
      className="w-full h-full flex items-center justify-center font-heading font-bold text-white"
      style={{ backgroundColor: bgColor, fontSize }}
    >
      {initial}
    </div>
  );

  if (!showRankFrame) {
    return (
      <div
        className="rounded-full overflow-hidden flex-shrink-0"
        style={{ width: size, height: size }}
      >
        {avatarContent}
      </div>
    );
  }

  return (
    <RankFrame xp={xp} size={size}>
      {avatarContent}
    </RankFrame>
  );
}
