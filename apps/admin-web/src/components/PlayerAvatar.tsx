/**
 * PlayerAvatar - Displays user avatar with fallback to initials and optional tier border
 * Uses PNG image borders (same assets as mobile app)
 */

export type PlayerTier =
  | 'BRONZE'
  | 'SILVER'
  | 'GOLD'
  | 'PLATINUM'
  | 'DIAMOND'
  | 'GENKI'
  | 'UNRANKED'
  | 'SPROUT';

// Border images mapping - same as mobile
const BORDER_IMAGES: Record<PlayerTier, string> = {
  GENKI: '/ranked-borders/genki.png',
  DIAMOND: '/ranked-borders/diamond.png',
  PLATINUM: '/ranked-borders/platinum.png',
  GOLD: '/ranked-borders/gold.png',
  SILVER: '/ranked-borders/silver.png',
  BRONZE: '/ranked-borders/bronze.png',
  SPROUT: '/ranked-borders/sprout.png',
  UNRANKED: '/ranked-borders/bronze.png', // Use bronze for unranked
};

// Tier color configurations (for glow effects, etc.)
export const TIER_COLORS: Record<PlayerTier, {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
  shine: string;
}> = {
  BRONZE: {
    primary: '#CD7F32',
    secondary: '#8B4513',
    accent: '#DEB887',
    glow: 'rgba(205, 127, 50, 0.4)',
    shine: '#FFDAB9',
  },
  SILVER: {
    primary: '#C0C0C0',
    secondary: '#708090',
    accent: '#E8E8E8',
    glow: 'rgba(192, 192, 192, 0.5)',
    shine: '#FFFFFF',
  },
  GOLD: {
    primary: '#FFD700',
    secondary: '#B8860B',
    accent: '#FFF8DC',
    glow: 'rgba(255, 215, 0, 0.5)',
    shine: '#FFFACD',
  },
  PLATINUM: {
    primary: '#00E5FF',
    secondary: '#006064',
    accent: '#E0F7FA',
    glow: 'rgba(0, 229, 255, 0.6)',
    shine: '#84FFFF',
  },
  DIAMOND: {
    primary: '#2979FF',
    secondary: '#1A237E',
    accent: '#B3E5FC',
    glow: 'rgba(41, 121, 255, 0.7)',
    shine: '#FFFFFF',
  },
  GENKI: {
    primary: '#FF3D00',
    secondary: '#DD2C00',
    accent: '#FF9E80',
    glow: 'rgba(255, 61, 0, 0.8)',
    shine: '#FF6E40',
  },
  SPROUT: {
    primary: '#4CAF50',
    secondary: '#2E7D32',
    accent: '#A5D6A7',
    glow: 'rgba(76, 175, 80, 0.4)',
    shine: '#81C784',
  },
  UNRANKED: {
    primary: '#546E7A',
    secondary: '#37474F',
    accent: '#78909C',
    glow: 'transparent',
    shine: '#B0BEC5',
  },
};

interface PlayerAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  tier?: PlayerTier;
  className?: string;
}

export function PlayerAvatar({ name, avatarUrl, size = 'md', tier, className = '' }: PlayerAvatarProps) {
  // Avatar pixel sizes
  const avatarSizes = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 80,
    '2xl': 96,
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-20 h-20 text-2xl',
    '2xl': 'w-24 h-24 text-3xl',
  };

  // Get initials from name
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Generate consistent color from name
  const getColorFromName = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'bg-red-500',
      'bg-orange-500',
      'bg-amber-500',
      'bg-yellow-500',
      'bg-lime-500',
      'bg-green-500',
      'bg-emerald-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-sky-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-violet-500',
      'bg-purple-500',
      'bg-fuchsia-500',
      'bg-pink-500',
      'bg-rose-500',
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  // Wrapper with tier border support
  const avatarContent = avatarUrl ? (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden ring-2 ring-border flex-shrink-0`}>
      <img
        src={avatarUrl}
        alt={name}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback to initials if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          if (target.nextSibling) {
            (target.nextSibling as HTMLElement).style.display = 'flex';
          }
        }}
      />
      <div
        className={`w-full h-full ${getColorFromName(name)} text-white font-bold flex items-center justify-center hidden`}
      >
        {getInitials(name)}
      </div>
    </div>
  ) : (
    <div
      className={`${sizeClasses[size]} rounded-full ${getColorFromName(name)} text-white font-bold flex items-center justify-center ring-2 ring-border flex-shrink-0`}
    >
      {getInitials(name)}
    </div>
  );

  // If no tier, return just the avatar
  if (!tier) {
    return <div className={className}>{avatarContent}</div>;
  }

  // With tier, wrap in relative container with image border overlay
  // Border is displayed at 160% of avatar size (same as mobile)
  const avatarPx = avatarSizes[size];
  const borderSize = avatarPx * 1.6;
  const containerSize = borderSize;

  // Offset to center the border over the avatar
  const borderOffsetLeft = 0;
  const borderOffsetTop = avatarPx * 0.02;

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: containerSize, height: containerSize }}
    >
      {avatarContent}
      <img
        src={BORDER_IMAGES[tier]}
        alt=""
        style={{
          position: 'absolute',
          width: borderSize,
          height: borderSize,
          top: 0,
          left: 0,
          marginLeft: borderOffsetLeft,
          marginTop: borderOffsetTop,
          pointerEvents: 'none',
          objectFit: 'contain',
        }}
      />
    </div>
  );
}
