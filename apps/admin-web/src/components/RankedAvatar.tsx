// Reusable Ranked Avatar Component with tier-based metallic borders and effects
import React from 'react';

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

// Configuration for tier visuals
const TIER_CONFIG: Record<PlayerTier, {
    colors: string[];
    icon: string;
    accent: string;
    glow: string;
    hasWings?: boolean;
    hasTopDetail?: boolean;
    textColor: string;
}> = {
    SPROUT: {
        colors: ['#4A7023', '#86BC25', '#4A7023'],
        icon: '🌱',
        accent: '#86BC25',
        glow: 'rgba(134, 188, 37, 0.4)',
        textColor: 'text-[#86BC25]',
    },
    BRONZE: {
        colors: ['#804A00', '#CD7F32', '#804A00'],
        icon: '🛡️',
        accent: '#CD7F32',
        glow: 'rgba(205, 127, 50, 0.4)',
        textColor: 'text-[#CD7F32]',
    },
    SILVER: {
        colors: ['#707070', '#E0E0E0', '#707070'],
        icon: '🛡️',
        accent: '#C0C0C0',
        glow: 'rgba(192, 192, 192, 0.4)',
        textColor: 'text-[#C0C0C0]',
    },
    GOLD: {
        colors: ['#B8860B', '#FFD700', '#B8860B'],
        icon: '🛡️',
        accent: '#FFD700',
        glow: 'rgba(255, 215, 0, 0.5)',
        hasTopDetail: true,
        textColor: 'text-[#FFD700]',
    },
    PLATINUM: {
        colors: ['#2E8B57', '#7FFFD4', '#2E8B57'],
        icon: '💎',
        accent: '#4FD1C5',
        glow: 'rgba(79, 209, 197, 0.6)',
        hasWings: true,
        textColor: 'text-[#4FD1C5]',
    },
    DIAMOND: {
        colors: ['#1E3A8A', '#60A5FA', '#1E3A8A'],
        icon: '💎',
        accent: '#3B82F6',
        glow: 'rgba(59, 130, 246, 0.7)',
        hasWings: true,
        hasTopDetail: true,
        textColor: 'text-[#3B82F6]',
    },
    GENKI: {
        colors: ['#7F1D1D', '#EF4444', '#7F1D1D'],
        icon: '🔥',
        accent: '#EF4444',
        glow: 'rgba(239, 68, 68, 0.8)',
        hasWings: true,
        hasTopDetail: true,
        textColor: 'text-[#EF4444]',
    },
    UNRANKED: {
        colors: ['#374151', '#6B7280', '#374151'],
        icon: '',
        accent: '#6B7280',
        glow: 'transparent',
        textColor: 'text-gray-500',
    },
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
    const config = TIER_CONFIG[tier];
    const pxSize = SIZE_MAP[size];

    // Dimensions
    const strokeWidth = Math.max(2, pxSize * 0.06);
    const radius = pxSize / 2;
    const center = pxSize / 2;
    const badgeSize = pxSize * 0.3;

    // Wing path scaling
    const wingWidth = pxSize * 0.4;
    const wingHeight = pxSize * 0.6;

    // Unique ID for gradient to avoid conflicts
    const gradientId = `borderGrad-${tier}-${size}-${user.name.replace(/\s/g, '')}`;

    return (
        <div
            className={`relative inline-flex items-center justify-center ${className}`}
            style={{ width: pxSize, height: pxSize }}
        >
            {/* Glow Layer */}
            <div
                className="absolute inset-0 rounded-full blur-md opacity-60 pointer-events-none"
                style={{ backgroundColor: config.glow, transform: 'scale(1.15)' }}
            />

            {/* SVG Border Layer */}
            <svg
                width={pxSize}
                height={pxSize}
                viewBox={`0 0 ${pxSize} ${pxSize}`}
                className="absolute inset-0 z-10 pointer-events-none overflow-visible"
            >
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={config.colors[0]} />
                        <stop offset="50%" stopColor={config.colors[1]} />
                        <stop offset="100%" stopColor={config.colors[2]} />
                    </linearGradient>
                </defs>

                {/* Wings */}
                {config.hasWings && (
                    <g>
                        <path
                            d={`M${center - radius} ${center} Q${center - radius - wingWidth / 2} ${center - wingHeight / 2} ${center - radius} ${center - wingHeight} L${center - radius + 5} ${center - wingHeight + 10} Z`}
                            fill={`url(#${gradientId})`}
                            opacity="0.9"
                        />
                        <path
                            d={`M${center + radius} ${center} Q${center + radius + wingWidth / 2} ${center - wingHeight / 2} ${center + radius} ${center - wingHeight} L${center + radius - 5} ${center - wingHeight + 10} Z`}
                            fill={`url(#${gradientId})`}
                            opacity="0.9"
                        />
                    </g>
                )}

                {/* Main Ring */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius - strokeWidth / 2}
                    stroke={`url(#${gradientId})`}
                    strokeWidth={strokeWidth}
                    fill="none"
                />

                {/* Top Detail */}
                {config.hasTopDetail && (
                    <path
                        d={`M${center} ${0} L${center - 10} ${15} L${center} ${25} L${center + 10} ${15} Z`}
                        fill={config.accent}
                        stroke="white"
                        strokeWidth="1"
                    />
                )}
            </svg>

            {/* Avatar Image */}
            <div
                className="relative overflow-hidden rounded-full bg-background flex items-center justify-center"
                style={{
                    width: pxSize - strokeWidth * 2,
                    height: pxSize - strokeWidth * 2,
                    margin: strokeWidth
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
                                fallback.className = `w-full h-full flex items-center justify-center font-bold ${config.textColor}`;
                                fallback.style.fontSize = `${pxSize * 0.4}px`;
                                fallback.innerText = initial;
                                parent.appendChild(fallback);
                            }
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                        <span
                            className={`font-bold ${config.textColor}`}
                            style={{ fontSize: pxSize * 0.4 }}
                        >
                            {initial}
                        </span>
                    </div>
                )}
            </div>

            {/* Tier Badge */}
            {showTierBadge && tier !== 'UNRANKED' && config.icon && (
                <div
                    className="absolute bottom-0 right-0 rounded-full flex items-center justify-center border-2 border-background shadow-lg z-20"
                    style={{
                        width: badgeSize,
                        height: badgeSize,
                        backgroundColor: config.colors[1],
                        transform: 'translate(10%, 10%)'
                    }}
                    title={tier}
                >
                    <span style={{ fontSize: badgeSize * 0.6, lineHeight: 1 }}>
                        {config.icon}
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
    return 'UNRANKED';
}
