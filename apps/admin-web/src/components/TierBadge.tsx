import { type PlayerTier } from './PlayerAvatar';

interface TierBadgeProps {
  tier: PlayerTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  provisional?: boolean;
}

const TIER_STYLES: Record<PlayerTier, { bg: string; text: string; border: string; glow: string; icon: string }> = {
  GENKI: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]',
    icon: '👑',
  },
  DIAMOND: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    glow: 'shadow-[0_0_12px_rgba(6,182,212,0.3)]',
    icon: '💎',
  },
  PLATINUM: {
    bg: 'bg-teal-500/10',
    text: 'text-teal-400',
    border: 'border-teal-500/30',
    glow: 'shadow-[0_0_10px_rgba(20,184,166,0.3)]',
    icon: '⭐',
  },
  GOLD: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    glow: 'shadow-[0_0_10px_rgba(245,158,11,0.3)]',
    icon: '🏆',
  },
  SILVER: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    glow: 'shadow-[0_0_8px_rgba(148,163,184,0.3)]',
    icon: '🥈',
  },
  BRONZE: {
    bg: 'bg-orange-900/10',
    text: 'text-orange-700',
    border: 'border-orange-900/30',
    glow: 'shadow-[0_0_8px_rgba(146,64,14,0.3)]',
    icon: '🥉',
  },
  SPROUT: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/30',
    glow: 'shadow-[0_0_8px_rgba(34,197,94,0.3)]',
    icon: '🌱',
  },
  UNRANKED: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    border: 'border-gray-500/30',
    glow: 'shadow-[0_0_8px_rgba(107,114,128,0.3)]',
    icon: '—',
  },
};

const SIZE_STYLES = {
  sm: {
    badge: 'px-2 py-0.5 text-xs',
    icon: 'text-xs',
    label: 'text-xs',
  },
  md: {
    badge: 'px-3 py-1 text-sm',
    icon: 'text-sm',
    label: 'text-sm',
  },
  lg: {
    badge: 'px-4 py-2 text-base',
    icon: 'text-lg',
    label: 'text-base',
  },
};

export function TierBadge({ tier, size = 'md', showLabel = true, provisional = false }: TierBadgeProps) {
  const style = TIER_STYLES[tier];
  const sizeStyle = SIZE_STYLES[size];

  return (
    <div className="inline-flex items-center gap-1.5">
      <div
        className={`
          inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wider
          ${style.bg} ${style.text} ${style.border} ${style.glow}
          ${sizeStyle.badge}
        `}
      >
        <span className={sizeStyle.icon}>{style.icon}</span>
        {showLabel && <span>{tier}</span>}
      </div>
      {provisional && (
        <span
          className={`
            px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
            bg-orange-500/10 text-orange-400 border border-orange-500/30
          `}
          title="Provisional rating - fewer than 15 matches or high uncertainty"
        >
          P
        </span>
      )}
    </div>
  );
}
