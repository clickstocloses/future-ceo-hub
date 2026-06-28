import React from 'react';

export interface RankInfo {
  tier: number;
  name: string;
  badgeColor: string;
  nameColor: string;
}

export function getRankFromXP(xp: number): RankInfo {
  if (xp >= 7000) return { tier: 8, name: 'Empire Owner', badgeColor: 'rainbow', nameColor: 'rainbow' };
  if (xp >= 4000) return { tier: 7, name: 'Tycoon', badgeColor: '#F59E0B', nameColor: '#F59E0B' };
  if (xp >= 2000) return { tier: 6, name: 'Market Dominator', badgeColor: '#EF4444', nameColor: '#EF4444' };
  if (xp >= 1000) return { tier: 5, name: 'Brand Builder', badgeColor: '#F97316', nameColor: '#F97316' };
  if (xp >= 600) return { tier: 4, name: 'Deal Maker', badgeColor: '#8B5CF6', nameColor: '#8B5CF6' };
  if (xp >= 300) return { tier: 3, name: 'Cash Flow Creator', badgeColor: '#14B8A6', nameColor: '#14B8A6' };
  if (xp >= 100) return { tier: 2, name: 'Profit Player', badgeColor: '#3B82F6', nameColor: '#3B82F6' };
  return { tier: 1, name: 'Budget Rookie', badgeColor: '#6B7280', nameColor: '#cd7f32' };
}

export function getRankBadge(xp: number): { name: string; badgeColor: string } {
  const r = getRankFromXP(xp);
  return { name: r.name, badgeColor: r.badgeColor };
}

interface RankFrameProps {
  xp: number;
  size?: number;
  children: React.ReactNode;
}

export function RankFrame({ xp, size = 80, children }: RankFrameProps) {
  const rank = getRankFromXP(xp);
  const c = size / 2;
  const scale = size / 80; // base design is 80px

  return (
    <div className="rank-frame-wrapper" style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {/* Avatar content */}
      <div style={{
        position: 'absolute',
        top: '15%', left: '15%',
        width: '70%', height: '70%',
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {children}
      </div>

      {/* SVG overlay */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        <defs>
          <linearGradient id={`gold-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#92400e" />
            <stop offset="33%" stopColor="#f59e0b" />
            <stop offset="66%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
        </defs>

        {rank.tier === 1 && <Rank1Frame c={c} scale={scale} />}
        {rank.tier === 2 && <Rank2Frame c={c} scale={scale} />}
        {rank.tier === 3 && <Rank3Frame c={c} scale={scale} />}
        {rank.tier === 4 && <Rank4Frame c={c} scale={scale} />}
        {rank.tier === 5 && <Rank5Frame c={c} scale={scale} size={size} />}
        {rank.tier === 6 && <Rank6Frame c={c} scale={scale} size={size} />}
        {rank.tier === 7 && <Rank7Frame c={c} scale={scale} size={size} />}
        {rank.tier === 8 && <Rank8Frame c={c} scale={scale} size={size} />}
      </svg>
    </div>
  );
}

function Rank1Frame({ c, scale }: { c: number; scale: number }) {
  const r1 = c * 0.88;
  const r2 = c * 0.78;
  return (
    <g>
      <circle cx={c} cy={c} r={r1} fill="none" stroke="#6B7280" strokeWidth={2 * scale} />
      <circle cx={c} cy={c} r={r2} fill="none" stroke="#cd7f32" strokeWidth={4 * scale} />
      {/* Star top */}
      <polygon points={starPoints(c, c * 0.08, 5 * scale, 2.5 * scale)} fill="#6B7280" transform={`translate(0, -${r1})`} style={{ transform: `translate(${c}px, ${c - r1}px)` }} />
      {/* Using simple ornaments */}
      <circle cx={c} cy={c - r1} r={3 * scale} fill="#6B7280" />
      <circle cx={c} cy={c + r1} r={3 * scale} fill="#6B7280" />
      <rect x={c - r1 - 1 * scale} y={c - 1.5 * scale} width={6 * scale} height={3 * scale} rx={1} fill="#6B7280" />
      <rect x={c + r1 - 5 * scale} y={c - 1.5 * scale} width={6 * scale} height={3 * scale} rx={1} fill="#6B7280" />
    </g>
  );
}

function Rank2Frame({ c, scale }: { c: number; scale: number }) {
  const r = c * 0.82;
  const rOuter = c * 0.92;
  return (
    <g>
      <circle cx={c} cy={c} r={r} fill="none" stroke="#3B82F6" strokeWidth={4 * scale} />
      <circle cx={c} cy={c} r={rOuter} fill="none" stroke="#3B82F6" strokeWidth={1 * scale} strokeDasharray={`${4 * scale} ${6 * scale}`} opacity={0.5} />
      {/* Cardinal rectangles */}
      {[0, 90, 180, 270].map(angle => (
        <rect
          key={angle}
          x={-3 * scale}
          y={-rOuter - 2 * scale}
          width={6 * scale}
          height={5 * scale}
          rx={1}
          fill="#3B82F6"
          transform={`rotate(${angle}, 0, 0) translate(${c}, ${c})`}
          style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${c}px ${c}px` }}
        />
      ))}
      <rect x={c - 3 * scale} y={c - rOuter - 2 * scale} width={6 * scale} height={5 * scale} rx={1} fill="#3B82F6" />
      <rect x={c - 3 * scale} y={c + rOuter - 3 * scale} width={6 * scale} height={5 * scale} rx={1} fill="#3B82F6" />
      <rect x={c - rOuter - 2 * scale} y={c - 3 * scale} width={5 * scale} height={6 * scale} rx={1} fill="#3B82F6" />
      <rect x={c + rOuter - 3 * scale} y={c - 3 * scale} width={5 * scale} height={6 * scale} rx={1} fill="#3B82F6" />
    </g>
  );
}

function Rank3Frame({ c, scale }: { c: number; scale: number }) {
  const r = c * 0.82;
  const rOuter = c * 0.95;
  const chevronSize = 6 * scale;
  return (
    <g>
      <circle cx={c} cy={c} r={r} fill="none" stroke="#14B8A6" strokeWidth={4 * scale} />
      <circle cx={c} cy={c} r={rOuter} fill="none" stroke="#14B8A6" strokeWidth={1 * scale} opacity={0.2} />
      <circle cx={c} cy={c} r={r * 0.92} fill="none" stroke="#14B8A6" strokeWidth={0.5 * scale} strokeDasharray={`${3 * scale} ${4 * scale}`} opacity={0.3} />
      {/* Chevrons at cardinal points */}
      <polygon points={`${c},${c - rOuter - chevronSize} ${c - chevronSize / 2},${c - rOuter} ${c + chevronSize / 2},${c - rOuter}`} fill="#14B8A6" />
      <polygon points={`${c},${c + rOuter + chevronSize} ${c - chevronSize / 2},${c + rOuter} ${c + chevronSize / 2},${c + rOuter}`} fill="#14B8A6" />
      <polygon points={`${c - rOuter - chevronSize},${c} ${c - rOuter},${c - chevronSize / 2} ${c - rOuter},${c + chevronSize / 2}`} fill="#14B8A6" />
      <polygon points={`${c + rOuter + chevronSize},${c} ${c + rOuter},${c - chevronSize / 2} ${c + rOuter},${c + chevronSize / 2}`} fill="#14B8A6" />
    </g>
  );
}

function Rank4Frame({ c, scale }: { c: number; scale: number }) {
  const r = c * 0.82;
  const rOuter = c * 0.93;
  const spearLen = 10 * scale;
  return (
    <g>
      <circle cx={c} cy={c} r={r} fill="none" stroke="#8B5CF6" strokeWidth={4.5 * scale} />
      <circle cx={c} cy={c} r={rOuter} fill="none" stroke="#8B5CF6" strokeWidth={0.5 * scale} strokeDasharray={`${3 * scale} ${5 * scale}`} opacity={0.3} />
      {/* Diamond spears at cardinal points */}
      {[[c, c - rOuter], [c, c + rOuter], [c - rOuter, c], [c + rOuter, c]].map(([x, y], i) => (
        <g key={i}>
          <polygon
            points={
              i < 2
                ? `${x},${y + (i === 0 ? -spearLen : spearLen)} ${x - 3 * scale},${y} ${x + 3 * scale},${y}`
                : `${x + (i === 2 ? -spearLen : spearLen)},${y} ${x},${y - 3 * scale} ${x},${y + 3 * scale}`
            }
            fill="#8B5CF6"
          />
          <circle cx={i < 2 ? x : x + (i === 2 ? -spearLen : spearLen)} cy={i < 2 ? y + (i === 0 ? -spearLen : spearLen) : y} r={2 * scale} fill="#8B5CF6" opacity={0.6} />
        </g>
      ))}
    </g>
  );
}

function Rank5Frame({ c, scale, size }: { c: number; scale: number; size: number }) {
  const r = c * 0.82;
  const rOuter = c * 0.95;
  return (
    <g>
      <circle cx={c} cy={c} r={r} fill="none" stroke="#F97316" strokeWidth={5 * scale} />
      <circle cx={c} cy={c} r={rOuter} fill="none" stroke="#F97316" strokeWidth={1.5 * scale} opacity={0.4} className="rank-pulse" />
      {/* Starburst crown at top */}
      <polygon points={starburstPoints(c, c * 0.06, 8 * scale, 4 * scale, 16)} fill="#F97316" style={{ transform: `translate(0px, -${r + 2 * scale}px)`, transformOrigin: `${c}px ${c}px` }} />
      <circle cx={c} cy={c - r - 2 * scale} r={5 * scale} fill="#F97316" />
      {/* Bottom accents */}
      <circle cx={c - 8 * scale} cy={c + rOuter} r={2.5 * scale} fill="#F97316" opacity={0.6} />
      <circle cx={c + 8 * scale} cy={c + rOuter} r={2.5 * scale} fill="#F97316" opacity={0.6} />
      <line x1={c - 8 * scale} y1={c + rOuter} x2={c} y2={c + r} stroke="#F97316" strokeWidth={1 * scale} opacity={0.3} />
      <line x1={c + 8 * scale} y1={c + rOuter} x2={c} y2={c + r} stroke="#F97316" strokeWidth={1 * scale} opacity={0.3} />
    </g>
  );
}

function Rank6Frame({ c, scale, size }: { c: number; scale: number; size: number }) {
  const r = c * 0.82;
  const rOuter = c * 0.95;
  return (
    <g>
      <circle cx={c} cy={c} r={r} fill="none" stroke="#EF4444" strokeWidth={5 * scale} />
      <circle cx={c} cy={c} r={rOuter} fill="none" stroke="#EF4444" strokeWidth={1.5 * scale} opacity={0.5} className="rank-fast-pulse" />
      {/* 12-point starburst crown at top */}
      <polygon points={starburstPoints(c, c * 0.04, 10 * scale, 5 * scale, 12)} fill="#EF4444" style={{ transform: `translate(0px, -${r + 3 * scale}px)`, transformOrigin: `${c}px ${c}px` }} />
      <circle cx={c} cy={c - r - 3 * scale} r={3 * scale} fill="#EF4444" opacity={0.8} />
      {/* Double bars at bottom */}
      <rect x={c - 10 * scale} y={c + r + 2 * scale} width={20 * scale} height={3 * scale} rx={1.5 * scale} fill="#EF4444" />
      <rect x={c - 7 * scale} y={c + r + 6 * scale} width={14 * scale} height={2 * scale} rx={1 * scale} fill="#EF4444" opacity={0.6} />
    </g>
  );
}

function Rank7Frame({ c, scale, size }: { c: number; scale: number; size: number }) {
  const r = c * 0.82;
  const rOuter = c * 0.93;
  const gradId = `gold-grad-${size}`;
  return (
    <g>
      <circle cx={c} cy={c} r={r} fill="none" stroke={`url(#${gradId})`} strokeWidth={5 * scale} />
      <circle cx={c} cy={c} r={rOuter} fill="none" stroke="#f59e0b" strokeWidth={1 * scale} strokeDasharray={`${4 * scale} ${4 * scale}`} opacity={0.6} className="rank-spin-slow" style={{ transformOrigin: `${c}px ${c}px` }} />
      {/* Crown at top */}
      <polygon
        points={`${c - 8 * scale},${c - r + 2 * scale} ${c - 5 * scale},${c - r - 8 * scale} ${c - 2 * scale},${c - r - 2 * scale} ${c},${c - r - 10 * scale} ${c + 2 * scale},${c - r - 2 * scale} ${c + 5 * scale},${c - r - 8 * scale} ${c + 8 * scale},${c - r + 2 * scale}`}
        fill="#f59e0b"
      />
      <circle cx={c - 5 * scale} cy={c - r - 7 * scale} r={1.5 * scale} fill="#fbbf24" />
      <circle cx={c} cy={c - r - 9 * scale} r={1.5 * scale} fill="#fbbf24" />
      <circle cx={c + 5 * scale} cy={c - r - 7 * scale} r={1.5 * scale} fill="#fbbf24" />
      {/* Chalice at bottom */}
      <path
        d={`M${c - 6 * scale},${c + r - 2 * scale} Q${c},${c + r + 10 * scale} ${c + 6 * scale},${c + r - 2 * scale}`}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={2 * scale}
      />
    </g>
  );
}

function Rank8Frame({ c, scale, size }: { c: number; scale: number; size: number }) {
  const r1 = c * 0.95;
  const r2 = c * 0.85;
  const r3 = c * 0.73;
  return (
    <g>
      {/* Outer ring - spins clockwise */}
      <circle cx={c} cy={c} r={r1} fill="none" strokeWidth={3 * scale} className="rank-rainbow-stroke rank-spin-3s" style={{ transformOrigin: `${c}px ${c}px` }} />
      {/* Middle dashed ring - counter-clockwise */}
      <circle cx={c} cy={c} r={r2} fill="none" strokeWidth={1.5 * scale} strokeDasharray={`${4 * scale} ${4 * scale}`} className="rank-rainbow-stroke rank-spin-reverse-5s" style={{ transformOrigin: `${c}px ${c}px` }} />
      {/* Inner ring - static */}
      <circle cx={c} cy={c} r={r3} fill="none" strokeWidth={4 * scale} className="rank-rainbow-stroke" />
      {/* Star top - spins */}
      <polygon points={starburstPoints(c, c - r1, 6 * scale, 3 * scale, 8)} fill="none" className="rank-rainbow-stroke rank-spin-4s" style={{ transformOrigin: `${c}px ${c - r1}px`, strokeWidth: 1.5 * scale }} />
      {/* Star bottom - counter spin */}
      <polygon points={starburstPoints(c, c + r1, 6 * scale, 3 * scale, 8)} fill="none" className="rank-rainbow-stroke rank-spin-reverse-4s" style={{ transformOrigin: `${c}px ${c + r1}px`, strokeWidth: 1.5 * scale }} />
      {/* Orbiting particles */}
      {['#ff6b6b', '#4dabf7', '#ffe066', '#69db7c'].map((color, i) => (
        <circle
          key={i}
          cx={c}
          cy={c}
          r={3 * scale}
          fill={color}
          className="rank-orbit-particle"
          style={{
            transformOrigin: `${c}px ${c}px`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
    </g>
  );
}

// Helpers

function starPoints(cx: number, cy: number, outerR: number, innerR: number, points: number = 5): string {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

function starburstPoints(cx: number, cy: number, outerR: number, innerR: number, points: number): string {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}
