// Reusable Tier Emblem Component for admin-web
// Professional SVG emblems with tier-specific designs

import React from 'react';

export type PlayerTier =
    | 'SPROUT'
    | 'BRONZE'
    | 'SILVER'
    | 'GOLD'
    | 'PLATINUM'
    | 'DIAMOND'
    | 'GENKI'
    | 'UNRANKED';

interface TierEmblemProps {
    tier: PlayerTier;
    size: number;
    className?: string;
}

// Professional tier color configurations with metallic effects
export const TIER_COLORS: Record<PlayerTier, {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
    shine: string;
}> = {
    SPROUT: {
        primary: '#4CAF50',
        secondary: '#2E7D32',
        accent: '#81C784',
        glow: 'rgba(76, 175, 80, 0.4)',
        shine: '#C8E6C9',
    },
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
        primary: '#1DE9B6',
        secondary: '#00695C',
        accent: '#A7FFEB',
        glow: 'rgba(29, 233, 182, 0.6)',
        shine: '#E0F2F1',
    },
    DIAMOND: {
        primary: '#448AFF',
        secondary: '#1A237E',
        accent: '#82B1FF',
        glow: 'rgba(68, 138, 255, 0.6)',
        shine: '#E3F2FD',
    },
    GENKI: {
        primary: '#FF3D00',
        secondary: '#BF360C',
        accent: '#FF9E80',
        glow: 'rgba(255, 61, 0, 0.7)',
        shine: '#FFCCBC',
    },
    UNRANKED: {
        primary: '#546E7A',
        secondary: '#37474F',
        accent: '#78909C',
        glow: 'transparent',
        shine: '#B0BEC5',
    },
};

function SproutEmblem({ size, colors }: { size: number; colors: typeof TIER_COLORS.SPROUT }) {
    const strokeWidth = size * 0.04;
    const center = size / 2;
    const radius = size / 2 - strokeWidth;
    const id = `sprout-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
            <defs>
                <linearGradient id={`${id}-border`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={colors.secondary} />
                    <stop offset="50%" stopColor={colors.primary} />
                    <stop offset="100%" stopColor={colors.secondary} />
                </linearGradient>
                <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0%" stopColor={colors.glow} />
                    <stop offset="100%" stopColor="transparent" />
                </radialGradient>
            </defs>

            <circle cx={center} cy={center} r={radius + 2} fill={`url(#${id}-glow)`} />
            <circle
                cx={center}
                cy={center}
                r={radius - strokeWidth / 2}
                stroke={`url(#${id}-border)`}
                strokeWidth={strokeWidth * 1.5}
                fill="none"
            />

            <g transform={`translate(${center}, ${center})`}>
                <path
                    d={`M${-radius * 0.85} ${radius * 0.1} Q${-radius * 0.6} ${-radius * 0.3} ${-radius * 0.4} ${-radius * 0.1}`}
                    stroke={colors.accent}
                    strokeWidth={strokeWidth * 0.8}
                    fill="none"
                    strokeLinecap="round"
                />
                <path
                    d={`M${radius * 0.85} ${radius * 0.1} Q${radius * 0.6} ${-radius * 0.3} ${radius * 0.4} ${-radius * 0.1}`}
                    stroke={colors.accent}
                    strokeWidth={strokeWidth * 0.8}
                    fill="none"
                    strokeLinecap="round"
                />
            </g>
        </svg>
    );
}

function BronzeEmblem({ size, colors }: { size: number; colors: typeof TIER_COLORS.BRONZE }) {
    const strokeWidth = size * 0.045;
    const center = size / 2;
    const radius = size / 2 - strokeWidth;
    const id = `bronze-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
            <defs>
                <linearGradient id={`${id}-border`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={colors.secondary} />
                    <stop offset="25%" stopColor={colors.primary} />
                    <stop offset="45%" stopColor={colors.shine} />
                    <stop offset="50%" stopColor={colors.accent} />
                    <stop offset="55%" stopColor={colors.shine} />
                    <stop offset="75%" stopColor={colors.primary} />
                    <stop offset="100%" stopColor={colors.secondary} />
                </linearGradient>
                <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
                    <stop offset="70%" stopColor="transparent" />
                    <stop offset="100%" stopColor={colors.glow} />
                </radialGradient>
            </defs>

            <circle cx={center} cy={center} r={radius + 3} fill={`url(#${id}-glow)`} />
            <circle
                cx={center}
                cy={center}
                r={radius - strokeWidth / 2}
                stroke={`url(#${id}-border)`}
                strokeWidth={strokeWidth * 2}
                fill="none"
            />
            <circle
                cx={center}
                cy={center}
                r={radius - strokeWidth * 2.5}
                stroke={colors.secondary}
                strokeWidth={strokeWidth * 0.5}
                fill="none"
                opacity={0.5}
            />

            <g transform={`translate(${center}, ${center})`}>
                {[0, 90, 180, 270].map((angle) => (
                    <circle
                        key={angle}
                        cx={Math.cos((angle * Math.PI) / 180) * (radius - strokeWidth)}
                        cy={Math.sin((angle * Math.PI) / 180) * (radius - strokeWidth)}
                        r={strokeWidth * 0.6}
                        fill={colors.accent}
                    />
                ))}
            </g>
        </svg>
    );
}

function SilverEmblem({ size, colors }: { size: number; colors: typeof TIER_COLORS.SILVER }) {
    const strokeWidth = size * 0.045;
    const center = size / 2;
    const radius = size / 2 - strokeWidth;
    const id = `silver-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
            <defs>
                <linearGradient id={`${id}-border`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={colors.secondary} />
                    <stop offset="25%" stopColor={colors.primary} />
                    <stop offset="45%" stopColor={colors.shine} />
                    <stop offset="50%" stopColor={colors.accent} />
                    <stop offset="55%" stopColor={colors.shine} />
                    <stop offset="75%" stopColor={colors.primary} />
                    <stop offset="100%" stopColor={colors.secondary} />
                </linearGradient>
                <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
                    <stop offset="70%" stopColor="transparent" />
                    <stop offset="100%" stopColor={colors.glow} />
                </radialGradient>
            </defs>

            <circle cx={center} cy={center} r={radius + 4} fill={`url(#${id}-glow)`} />
            <circle
                cx={center}
                cy={center}
                r={radius - strokeWidth / 2}
                stroke={`url(#${id}-border)`}
                strokeWidth={strokeWidth * 2}
                fill="none"
            />

            <g transform={`translate(${center}, ${strokeWidth * 2})`}>
                <path
                    d="M0,-4 L1.5,2 L5,2 L2,5 L3.5,10 L0,7 L-3.5,10 L-2,5 L-5,2 L-1.5,2 Z"
                    fill={colors.shine}
                    transform={`scale(${size * 0.012})`}
                />
            </g>
        </svg>
    );
}

function GoldEmblem({ size, colors }: { size: number; colors: typeof TIER_COLORS.GOLD }) {
    const strokeWidth = size * 0.05;
    const center = size / 2;
    const radius = size / 2 - strokeWidth;
    const id = `gold-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
            <defs>
                <linearGradient id={`${id}-border`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={colors.secondary} />
                    <stop offset="25%" stopColor={colors.primary} />
                    <stop offset="45%" stopColor={colors.shine} />
                    <stop offset="50%" stopColor={colors.accent} />
                    <stop offset="55%" stopColor={colors.shine} />
                    <stop offset="75%" stopColor={colors.primary} />
                    <stop offset="100%" stopColor={colors.secondary} />
                </linearGradient>
                <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
                    <stop offset="60%" stopColor="transparent" />
                    <stop offset="100%" stopColor={colors.glow} />
                </radialGradient>
                <linearGradient id={`${id}-crown`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.shine} />
                    <stop offset="100%" stopColor={colors.primary} />
                </linearGradient>
            </defs>

            <circle cx={center} cy={center} r={radius + 5} fill={`url(#${id}-glow)`} />
            <circle
                cx={center}
                cy={center}
                r={radius + strokeWidth * 0.5}
                stroke={colors.secondary}
                strokeWidth={strokeWidth * 0.3}
                fill="none"
                strokeDasharray={`${size * 0.05} ${size * 0.02}`}
            />
            <circle
                cx={center}
                cy={center}
                r={radius - strokeWidth / 2}
                stroke={`url(#${id}-border)`}
                strokeWidth={strokeWidth * 2.5}
                fill="none"
            />

            <g transform={`translate(${center}, ${strokeWidth * 0.5})`}>
                <path
                    d={`M-8,-2 L-6,4 L-3,0 L0,5 L3,0 L6,4 L8,-2 L6,8 L-6,8 Z`}
                    fill={`url(#${id}-crown)`}
                    transform={`scale(${size * 0.015})`}
                />
            </g>

            <g transform={`translate(${center}, ${center})`}>
                <path
                    d={`M${-radius * 0.9} 0 Q${-radius * 1.1} ${-radius * 0.3} ${-radius * 0.7} ${-radius * 0.5}`}
                    stroke={colors.primary}
                    strokeWidth={strokeWidth * 0.6}
                    fill="none"
                    strokeLinecap="round"
                />
                <path
                    d={`M${radius * 0.9} 0 Q${radius * 1.1} ${-radius * 0.3} ${radius * 0.7} ${-radius * 0.5}`}
                    stroke={colors.primary}
                    strokeWidth={strokeWidth * 0.6}
                    fill="none"
                    strokeLinecap="round"
                />
            </g>
        </svg>
    );
}

function PlatinumEmblem({ size, colors }: { size: number; colors: typeof TIER_COLORS.PLATINUM }) {
    const strokeWidth = size * 0.05;
    const center = size / 2;
    const radius = size / 2 - strokeWidth;
    const id = `platinum-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
            <defs>
                <linearGradient id={`${id}-border`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={colors.secondary} />
                    <stop offset="25%" stopColor={colors.primary} />
                    <stop offset="45%" stopColor={colors.shine} />
                    <stop offset="50%" stopColor={colors.accent} />
                    <stop offset="55%" stopColor={colors.shine} />
                    <stop offset="75%" stopColor={colors.primary} />
                    <stop offset="100%" stopColor={colors.secondary} />
                </linearGradient>
                <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.6">
                    <stop offset="50%" stopColor="transparent" />
                    <stop offset="100%" stopColor={colors.glow} />
                </radialGradient>
            </defs>

            <circle cx={center} cy={center} r={radius + 6} fill={`url(#${id}-glow)`} />
            <circle
                cx={center}
                cy={center}
                r={radius + strokeWidth * 0.3}
                stroke={colors.accent}
                strokeWidth={strokeWidth * 0.2}
                fill="none"
                opacity={0.5}
            />
            <circle
                cx={center}
                cy={center}
                r={radius - strokeWidth / 2}
                stroke={`url(#${id}-border)`}
                strokeWidth={strokeWidth * 2.5}
                fill="none"
            />

            <g transform={`translate(${center}, ${center})`}>
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                    <g key={angle} transform={`rotate(${angle})`}>
                        <ellipse
                            cx={0}
                            cy={-radius + strokeWidth * 0.5}
                            rx={strokeWidth * 0.4}
                            ry={strokeWidth * 0.6}
                            fill={colors.accent}
                            opacity={0.8}
                        />
                    </g>
                ))}
            </g>

            <g transform={`translate(${center}, ${center})`}>
                <path
                    d={`M0 ${-radius * 1.05} L${strokeWidth * 0.5} ${-radius * 0.85} L0 ${-radius * 0.95} L${-strokeWidth * 0.5} ${-radius * 0.85} Z`}
                    fill={colors.shine}
                />
                <path
                    d={`M0 ${radius * 1.05} L${strokeWidth * 0.5} ${radius * 0.85} L0 ${radius * 0.95} L${-strokeWidth * 0.5} ${radius * 0.85} Z`}
                    fill={colors.shine}
                />
            </g>
        </svg>
    );
}

function DiamondEmblem({ size, colors }: { size: number; colors: typeof TIER_COLORS.DIAMOND }) {
    const strokeWidth = size * 0.055;
    const center = size / 2;
    const radius = size / 2 - strokeWidth;
    const id = `diamond-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
            <defs>
                <linearGradient id={`${id}-border`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={colors.secondary} />
                    <stop offset="25%" stopColor={colors.primary} />
                    <stop offset="45%" stopColor={colors.shine} />
                    <stop offset="50%" stopColor={colors.accent} />
                    <stop offset="55%" stopColor={colors.shine} />
                    <stop offset="75%" stopColor={colors.primary} />
                    <stop offset="100%" stopColor={colors.secondary} />
                </linearGradient>
                <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.6">
                    <stop offset="40%" stopColor="transparent" />
                    <stop offset="100%" stopColor={colors.glow} />
                </radialGradient>
                <linearGradient id={`${id}-facet`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={colors.shine} />
                    <stop offset="50%" stopColor={colors.accent} />
                    <stop offset="100%" stopColor={colors.primary} />
                </linearGradient>
            </defs>

            <circle cx={center} cy={center} r={radius + 8} fill={`url(#${id}-glow)`} />
            <circle
                cx={center}
                cy={center}
                r={radius + strokeWidth * 0.5}
                stroke={colors.accent}
                strokeWidth={strokeWidth * 0.15}
                fill="none"
                strokeDasharray={`${size * 0.02} ${size * 0.04}`}
            />
            <circle
                cx={center}
                cy={center}
                r={radius - strokeWidth / 2}
                stroke={`url(#${id}-border)`}
                strokeWidth={strokeWidth * 2.8}
                fill="none"
            />

            <g transform={`translate(${center}, ${center})`}>
                {[0, 90, 180, 270].map((angle) => (
                    <g key={angle} transform={`rotate(${angle})`}>
                        <path
                            d={`M0 ${-radius * 1.08} L${strokeWidth * 0.6} ${-radius * 0.9} L0 ${-radius * 0.72} L${-strokeWidth * 0.6} ${-radius * 0.9} Z`}
                            fill={`url(#${id}-facet)`}
                        />
                    </g>
                ))}
            </g>

            <g transform={`translate(${center}, ${center})`}>
                {[45, 135, 225, 315].map((angle) => (
                    <g key={angle} transform={`rotate(${angle})`}>
                        <path
                            d={`M0 ${-radius * 1.02} L${strokeWidth * 0.35} ${-radius * 0.92} L0 ${-radius * 0.82} L${-strokeWidth * 0.35} ${-radius * 0.92} Z`}
                            fill={colors.accent}
                            opacity={0.8}
                        />
                    </g>
                ))}
            </g>
        </svg>
    );
}

function GenkiEmblem({ size, colors }: { size: number; colors: typeof TIER_COLORS.GENKI }) {
    const strokeWidth = size * 0.06;
    const center = size / 2;
    const radius = size / 2 - strokeWidth;
    const id = `genki-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="animate-pulse-slow" style={{ overflow: 'visible' }}>
            <defs>
                <linearGradient id={`${id}-border`} x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0%" stopColor={colors.secondary} />
                    <stop offset="25%" stopColor={colors.primary} />
                    <stop offset="45%" stopColor={colors.shine} />
                    <stop offset="50%" stopColor={colors.accent} />
                    <stop offset="55%" stopColor={colors.shine} />
                    <stop offset="75%" stopColor={colors.primary} />
                    <stop offset="100%" stopColor={colors.secondary} />
                </linearGradient>
                <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.7">
                    <stop offset="30%" stopColor="transparent" />
                    <stop offset="100%" stopColor={colors.glow} />
                </radialGradient>
                <linearGradient id={`${id}-flame`} x1="0.5" y1="1" x2="0.5" y2="0">
                    <stop offset="0%" stopColor={colors.secondary} />
                    <stop offset="50%" stopColor={colors.primary} />
                    <stop offset="100%" stopColor={colors.accent} />
                </linearGradient>
                <linearGradient id={`${id}-wing`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={colors.primary} />
                    <stop offset="50%" stopColor={colors.accent} />
                    <stop offset="100%" stopColor={colors.primary} />
                </linearGradient>
            </defs>

            <circle cx={center} cy={center} r={radius + 10} fill={`url(#${id}-glow)`} />
            <circle
                cx={center}
                cy={center}
                r={radius + strokeWidth * 0.6}
                stroke={colors.primary}
                strokeWidth={strokeWidth * 0.2}
                fill="none"
                opacity={0.6}
            />
            <circle
                cx={center}
                cy={center}
                r={radius - strokeWidth / 2}
                stroke={`url(#${id}-border)`}
                strokeWidth={strokeWidth * 3}
                fill="none"
            />

            {/* Phoenix wings - Left */}
            <g transform={`translate(${center}, ${center})`}>
                <path
                    d={`
            M${-radius * 0.75} ${radius * 0.1}
            Q${-radius * 1.2} ${-radius * 0.2} ${-radius * 1.1} ${-radius * 0.5}
            Q${-radius * 0.9} ${-radius * 0.3} ${-radius * 0.85} ${radius * 0.05}
            Z
          `}
                    fill={`url(#${id}-wing)`}
                    opacity={0.9}
                />
                <path
                    d={`
            M${-radius * 0.8} ${radius * 0.15}
            Q${-radius * 1.15} ${radius * 0.1} ${-radius * 1.0} ${-radius * 0.15}
            Q${-radius * 0.85} ${-radius * 0.05} ${-radius * 0.78} ${radius * 0.1}
            Z
          `}
                    fill={colors.accent}
                    opacity={0.7}
                />
            </g>

            {/* Phoenix wings - Right */}
            <g transform={`translate(${center}, ${center})`}>
                <path
                    d={`
            M${radius * 0.75} ${radius * 0.1}
            Q${radius * 1.2} ${-radius * 0.2} ${radius * 1.1} ${-radius * 0.5}
            Q${radius * 0.9} ${-radius * 0.3} ${radius * 0.85} ${radius * 0.05}
            Z
          `}
                    fill={`url(#${id}-wing)`}
                    opacity={0.9}
                />
                <path
                    d={`
            M${radius * 0.8} ${radius * 0.15}
            Q${radius * 1.15} ${radius * 0.1} ${radius * 1.0} ${-radius * 0.15}
            Q${radius * 0.85} ${-radius * 0.05} ${radius * 0.78} ${radius * 0.1}
            Z
          `}
                    fill={colors.accent}
                    opacity={0.7}
                />
            </g>

            {/* Top flame crown */}
            <g transform={`translate(${center}, ${strokeWidth * 0.3})`}>
                <path
                    d={`M0 0 Q-3 -8 0 -12 Q3 -8 0 0`}
                    fill={`url(#${id}-flame)`}
                    transform={`scale(${size * 0.012})`}
                />
                <path
                    d={`M-6 2 Q-8 -4 -5 -8 Q-3 -4 -5 2`}
                    fill={colors.primary}
                    transform={`scale(${size * 0.01})`}
                    opacity={0.8}
                />
                <path
                    d={`M6 2 Q8 -4 5 -8 Q3 -4 5 2`}
                    fill={colors.primary}
                    transform={`scale(${size * 0.01})`}
                    opacity={0.8}
                />
            </g>
        </svg>
    );
}

function UnrankedEmblem({ size, colors }: { size: number; colors: typeof TIER_COLORS.UNRANKED }) {
    const strokeWidth = size * 0.04;
    const center = size / 2;
    const radius = size / 2 - strokeWidth;
    const id = `unranked-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
            <defs>
                <linearGradient id={`${id}-border`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={colors.secondary} />
                    <stop offset="25%" stopColor={colors.primary} />
                    <stop offset="45%" stopColor={colors.shine} />
                    <stop offset="50%" stopColor={colors.accent} />
                    <stop offset="55%" stopColor={colors.shine} />
                    <stop offset="75%" stopColor={colors.primary} />
                    <stop offset="100%" stopColor={colors.secondary} />
                </linearGradient>
            </defs>

            <circle
                cx={center}
                cy={center}
                r={radius - strokeWidth / 2}
                stroke={`url(#${id}-border)`}
                strokeWidth={strokeWidth * 1.5}
                fill="none"
            />
        </svg>
    );
}

export function TierEmblem({ tier, size, className = '' }: TierEmblemProps) {
    const colors = TIER_COLORS[tier];

    const renderEmblem = () => {
        switch (tier) {
            case 'SPROUT':
                return <SproutEmblem size={size} colors={colors} />;
            case 'BRONZE':
                return <BronzeEmblem size={size} colors={colors} />;
            case 'SILVER':
                return <SilverEmblem size={size} colors={colors} />;
            case 'GOLD':
                return <GoldEmblem size={size} colors={colors} />;
            case 'PLATINUM':
                return <PlatinumEmblem size={size} colors={colors} />;
            case 'DIAMOND':
                return <DiamondEmblem size={size} colors={colors} />;
            case 'GENKI':
                return <GenkiEmblem size={size} colors={colors} />;
            default:
                return <UnrankedEmblem size={size} colors={TIER_COLORS.UNRANKED} />;
        }
    };

    return (
        <div
            className={`absolute inset-0 flex items-center justify-center pointer-events-none ${className}`}
            style={{ width: size, height: size }}
        >
            {renderEmblem()}
        </div>
    );
}
