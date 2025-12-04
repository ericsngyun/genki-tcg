// Reusable Ranked Avatar Component with premium tier-based metallic borders and effects
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
    hasGems?: boolean;
    textColor: string;
}> = {
    SPROUT: {
        colors: ['#33691E', '#7CB342', '#558B2F'],
        icon: '🌱',
        accent: '#AED581',
        glow: 'rgba(124, 179, 66, 0.3)',
        textColor: 'text-[#7CB342]',
    },
    BRONZE: {
        colors: ['#5D4037', '#CD7F32', '#8D6E63'],
        icon: '🛡️',
        accent: '#A1887F',
        glow: 'rgba(141, 110, 99, 0.3)',
        textColor: 'text-[#CD7F32]',
    },
    SILVER: {
        colors: ['#455A64', '#CFD8DC', '#90A4AE'],
        icon: '🛡️',
        accent: '#B0BEC5',
        glow: 'rgba(144, 164, 174, 0.4)',
        textColor: 'text-[#90A4AE]',
    },
    GOLD: {
        colors: ['#8D6E63', '#FFD700', '#FFECB3'],
        icon: '🛡️',
        accent: '#FFE082',
        glow: 'rgba(255, 215, 0, 0.5)',
        hasGems: true,
        textColor: 'text-[#FFD700]',
    },
    PLATINUM: {
        colors: ['#004D40', '#64FFDA', '#1DE9B6'],
        icon: '💎',
        accent: '#A7FFEB',
        glow: 'rgba(29, 233, 182, 0.6)',
        hasWings: true,
        hasGems: true,
        textColor: 'text-[#1DE9B6]',
    },
    DIAMOND: {
        colors: ['#1A237E', '#448AFF', '#82B1FF'],
        icon: '💎',
        accent: '#82B1FF',
        glow: 'rgba(68, 138, 255, 0.7)',
        hasWings: true,
        hasGems: true,
        textColor: 'text-[#448AFF]',
    },
    GENKI: {
        colors: ['#3E2723', '#FF3D00', '#FF9E80'],
        icon: '🔥',
        accent: '#FF9E80',
        glow: 'rgba(255, 61, 0, 0.8)',
        hasWings: true,
        hasGems: true,
        textColor: 'text-[#FF3D00]',
    },
    UNRANKED: {
        colors: ['#263238', '#546E7A', '#78909C'],
        icon: '',
        accent: '#90A4AE',
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
    const strokeWidth = pxSize * 0.06;
    const outerRingWidth = pxSize * 0.02;
    const radius = pxSize / 2;
    const center = pxSize / 2;
    const badgeSize = pxSize * 0.3;

    // Wing path scaling
    const wingWidth = pxSize * 0.5;
    const wingHeight = pxSize * 0.7;

    // Unique ID for gradient to avoid conflicts
    const gradientId = `borderGrad-${tier}-${size}-${user.name.replace(/\s/g, '')}`;
    const gemGradientId = `gemGrad-${tier}-${size}-${user.name.replace(/\s/g, '')}`;

    return (
        <div
            className={`relative inline-flex items-center justify-center ${className}`}
            style={{ width: pxSize, height: pxSize }}
        >
            {/* Glow Layer */}
            <div
                className="absolute inset-0 rounded-full blur-md opacity-60 pointer-events-none"
                style={{ backgroundColor: config.glow, transform: 'scale(1.25)' }}
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
                    <linearGradient id={gemGradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={config.accent} stopOpacity="0.9" />
                        <stop offset="100%" stopColor="white" stopOpacity="0.6" />
                    </linearGradient>
                </defs>

                {/* Wings */}
                {config.hasWings && (
                    <g>
                        {/* Left Wing */}
                        <path
                            d={`
                                M${center - radius + strokeWidth} ${center} 
                                C${center - radius - wingWidth * 0.2} ${center - wingHeight * 0.3}, ${center - radius - wingWidth * 0.5} ${center - wingHeight * 0.6}, ${center - radius - wingWidth} ${center - wingHeight}
                                L${center - radius - wingWidth * 0.8} ${center - wingHeight * 0.5}
                                L${center - radius - wingWidth * 0.6} ${center - wingHeight * 0.8}
                                L${center - radius - wingWidth * 0.4} ${center - wingHeight * 0.4}
                                Z
                            `}
                            fill={`url(#${gradientId})`}
                            opacity="0.9"
                        />
                        {/* Right Wing */}
                        <path
                            d={`
                                M${center + radius - strokeWidth} ${center} 
                                C${center + radius + wingWidth * 0.2} ${center - wingHeight * 0.3}, ${center + radius + wingWidth * 0.5} ${center - wingHeight * 0.6}, ${center + radius + wingWidth} ${center - wingHeight}
                                L${center + radius + wingWidth * 0.8} ${center - wingHeight * 0.5}
                                L${center + radius + wingWidth * 0.6} ${center - wingHeight * 0.8}
                                L${center + radius + wingWidth * 0.4} ${center - wingHeight * 0.4}
                                Z
                            `}
                            fill={`url(#${gradientId})`}
                            opacity="0.9"
                        />
                    </g>
                )}

                {/* Outer Ring */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius - outerRingWidth / 2}
                    stroke={`url(#${gradientId})`}
                    strokeWidth={outerRingWidth}
                    strokeOpacity="0.6"
                    fill="none"
                />

                {/* Main Ring */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius - outerRingWidth - strokeWidth / 2 - 2}
                    stroke={`url(#${gradientId})`}
                    strokeWidth={strokeWidth}
                    fill="none"
                />

                {/* Gem Accents */}
                {config.hasGems && (
                    <g>
                        <rect x={center - 3} y={0} width="6" height="6" fill={`url(#${gemGradientId})`} transform={`rotate(45 ${center} 3)`} />
                        <rect x={center - 3} y={pxSize - 6} width="6" height="6" fill={`url(#${gemGradientId})`} transform={`rotate(45 ${center} ${pxSize - 3})`} />
                        <rect x={0} y={center - 3} width="6" height="6" fill={`url(#${gemGradientId})`} transform={`rotate(45 3 ${center})`} />
                        <rect x={pxSize - 6} y={center - 3} width="6" height="6" fill={`url(#${gemGradientId})`} transform={`rotate(45 ${pxSize - 3} ${center})`} />
                    </g>
                )}
            </svg>

            {/* Avatar Image */}
            <div
                className="relative overflow-hidden rounded-full bg-background flex items-center justify-center"
                style={{
                    width: pxSize - (outerRingWidth + strokeWidth + 4) * 2,
                    height: pxSize - (outerRingWidth + strokeWidth + 4) * 2,
                    // Centered automatically
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
                                fallback.style.fontSize = `${pxSize * 0.35}px`;
                                fallback.innerText = initial;
                                parent.appendChild(fallback);
                            }
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                        <span
                            className={`font-bold ${config.textColor}`}
                            style={{ fontSize: pxSize * 0.35 }}
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
