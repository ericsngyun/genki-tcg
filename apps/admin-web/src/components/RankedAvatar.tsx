// Reusable Ranked Avatar Component with professional tier-based emblems
import React from 'react';
import { TierEmblem, TIER_COLORS } from './TierEmblem';

interface RankedAvatarProps {
    user: {
        name: string;
        avatarUrl?: string | null;
    };
    tier?: PlayerTier;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    showTierBadge?: boolean;
    className?: string;
}

export type PlayerTier =
    | 'SPROUT'
    | 'BRONZE'
    | 'SILVER'
    | 'GOLD'
    | 'PLATINUM'
    | 'DIAMOND'
    | 'GENKI'
    | 'UNRANKED';

// Tier icons for badges
const TIER_ICONS: Record<PlayerTier, string> = {
    SPROUT: '🌱',
    BRONZE: '🛡️',
    SILVER: '🛡️',
    GOLD: '👑',
    PLATINUM: '💎',
    DIAMOND: '💎',
    GENKI: '🔥',
    UNRANKED: '',
};

const SIZE_MAP = {
    sm: 40,
    md: 48,
    lg: 64,
    xl: 80,
    '2xl': 96,
};

export function RankedAvatar({
    user,
    tier = 'UNRANKED',
    size = 'md',
    showTierBadge = true,
    className = '',
}: RankedAvatarProps) {
    const initial = user.name?.charAt(0).toUpperCase() || '?';
    const colors = TIER_COLORS[tier];
    const pxSize = SIZE_MAP[size];
    const icon = TIER_ICONS[tier];

    // Dimensions
    const borderWidth = pxSize * 0.08;
    const badgeSize = pxSize * 0.32;

    return (
        <div
            className={`relative inline-flex items-center justify-center ${className}`}
            style={{ width: pxSize, height: pxSize }}
        >
            {/* Tier Emblem (replaces old wings) */}
            <TierEmblem tier={tier} size={pxSize} />

            {/* Avatar Image */}
            <div
                className="relative overflow-hidden rounded-full bg-background flex items-center justify-center z-10"
                style={{
                    width: pxSize - borderWidth * 2,
                    height: pxSize - borderWidth * 2,
                }}
            >
                {user.avatarUrl ? (
                    <img
                        src={user.avatarUrl}
                        alt={`${user.name}'s avatar`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                                const fallback = document.createElement('div');
                                fallback.className = `w-full h-full flex items-center justify-center font-bold`;
                                fallback.style.fontSize = `${pxSize * 0.35}px`;
                                fallback.style.color = colors.accent;
                                fallback.innerText = initial;
                                parent.appendChild(fallback);
                            }
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                        <span
                            className="font-bold"
                            style={{ fontSize: pxSize * 0.35, color: colors.accent }}
                        >
                            {initial}
                        </span>
                    </div>
                )}
            </div>

            {/* Tier Badge */}
            {showTierBadge && tier !== 'UNRANKED' && icon && (
                <div
                    className="absolute rounded-full flex items-center justify-center border-2 border-background shadow-lg z-20 transition-transform hover:scale-110"
                    style={{
                        width: badgeSize,
                        height: badgeSize,
                        backgroundColor: colors.primary,
                        bottom: -2,
                        right: -2,
                    }}
                    title={tier}
                >
                    <span style={{ fontSize: badgeSize * 0.55, lineHeight: 1 }}>
                        {icon}
                    </span>
                </div>
            )}
        </div>
    );
}

// Helper to map rating to tier
export function mapRatingToTier(rating: number): PlayerTier {
    if (rating >= 2100) return 'GENKI';
    if (rating >= 1900) return 'DIAMOND';
    if (rating >= 1750) return 'PLATINUM';
    if (rating >= 1600) return 'GOLD';
    if (rating >= 1450) return 'SILVER';
    if (rating >= 1300) return 'BRONZE';
    if (rating > 0) return 'SPROUT';
    return 'UNRANKED';
}
