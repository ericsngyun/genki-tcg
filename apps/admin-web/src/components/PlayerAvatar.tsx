/**
 * PlayerAvatar - Displays user avatar with fallback to initials and optional tier border
 */

import { TierEmblem, type PlayerTier } from './TierEmblem';

interface PlayerAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  tier?: PlayerTier;
  className?: string;
}

export function PlayerAvatar({ name, avatarUrl, size = 'md', tier, className = '' }: PlayerAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-20 h-20 text-2xl',
    '2xl': 'w-24 h-24 text-3xl',
  };

  // Tier border sizes - slightly larger than avatar to show border outside
  const tierBorderSizes = {
    sm: 40,    // 32px avatar + 8px border space = 40px
    md: 50,    // 40px avatar + 10px border space = 50px
    lg: 60,    // 48px avatar + 12px border space = 60px
    xl: 96,    // 80px avatar + 16px border space = 96px
    '2xl': 112, // 96px avatar + 16px border space = 112px
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

  // With tier, wrap in relative container with tier border overlay
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: tierBorderSizes[size], height: tierBorderSizes[size] }}>
      {avatarContent}
      <TierEmblem tier={tier} size={tierBorderSizes[size]} />
    </div>
  );
}
