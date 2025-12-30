import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, {
    Defs,
    LinearGradient,
    RadialGradient,
    Stop,
    Circle,
    Path,
    G,
    Ellipse,
} from 'react-native-svg';

export type PlayerTier =
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
    style?: ViewStyle;
}

// Professional tier color configurations with metallic effects
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
        primary: '#00E5FF', // Brighter Cyan
        secondary: '#006064', // Deep Cyan
        accent: '#E0F7FA', // Very light Cyan
        glow: 'rgba(0, 229, 255, 0.6)',
        shine: '#84FFFF',
    },
    DIAMOND: {
        primary: '#2979FF', // Blue A400
        secondary: '#1A237E', // Indigo 900
        accent: '#B3E5FC', // Light Blue 100
        glow: 'rgba(41, 121, 255, 0.7)',
        shine: '#FFFFFF',
    },
    GENKI: {
        primary: '#FF3D00', // Deep Orange A400
        secondary: '#DD2C00', // Deep Orange A700
        accent: '#FF9E80', // Deep Orange A100
        glow: 'rgba(255, 61, 0, 0.8)',
        shine: '#FF6E40',
    },
    UNRANKED: {
        primary: '#546E7A',
        secondary: '#37474F',
        accent: '#78909C',
        glow: 'transparent',
        shine: '#B0BEC5',
    },
};

// Generate unique ID for SVG gradients to avoid conflicts
const useUniqueId = (prefix: string) => {
    return useMemo(() => `${prefix}-${Math.random().toString(36).substr(2, 9)}`, [prefix]);
};

// Bronze tier - Shield emblem with studs
function BronzeEmblem({ size, colors }: { size: number; colors: typeof TIER_COLORS.BRONZE }) {
    const id = useUniqueId('bronze');
    const strokeWidth = size * 0.03;
    const center = size / 2;
    const radius = size / 2 - strokeWidth;

    return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
                <LinearGradient id={`${id}-border`} x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor={colors.secondary} />
                    <Stop offset="25%" stopColor={colors.primary} />
                    <Stop offset="45%" stopColor={colors.shine} />
                    <Stop offset="50%" stopColor={colors.accent} />
                    <Stop offset="55%" stopColor={colors.shine} />
                    <Stop offset="75%" stopColor={colors.primary} />
                    <Stop offset="100%" stopColor={colors.secondary} />
                </LinearGradient>
                <RadialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
                    <Stop offset="70%" stopColor="transparent" />
                    <Stop offset="100%" stopColor={colors.glow} />
                </RadialGradient>
            </Defs>

            <Circle cx={center} cy={center} r={radius + 3} fill={`url(#${id}-glow)`} />
            <Circle
                cx={center}
                cy={center}
                r={radius - strokeWidth / 2}
                stroke={`url(#${id}-border)`}
                strokeWidth={strokeWidth * 2}
                fill="none"
            />
            <Circle
                cx={center}
                cy={center}
                r={radius - strokeWidth * 2.5}
                stroke={colors.secondary}
                strokeWidth={strokeWidth * 0.5}
                fill="none"
                opacity={0.5}
            />

            <G transform={`translate(${center}, ${center})`}>
                {[0, 90, 180, 270].map((angle) => (
                    <Circle
                        key={angle}
                        cx={Math.cos((angle * Math.PI) / 180) * (radius - strokeWidth)}
                        cy={Math.sin((angle * Math.PI) / 180) * (radius - strokeWidth)}
                        r={strokeWidth * 0.6}
                        fill={colors.accent}
                    />
                ))}
            </G>
        </Svg>
    );
}

// Silver tier - Angular shield with star
function SilverEmblem({ size, colors }: { size: number; colors: typeof TIER_COLORS.SILVER }) {
    const id = useUniqueId('silver');
    const strokeWidth = size * 0.03;
    const center = size / 2;
    const radius = size / 2 - strokeWidth;

    return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
                <LinearGradient id={`${id}-border`} x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor={colors.secondary} />
                    <Stop offset="25%" stopColor={colors.primary} />
                    <Stop offset="45%" stopColor={colors.shine} />
                    <Stop offset="50%" stopColor={colors.accent} />
                    <Stop offset="55%" stopColor={colors.shine} />
                    <Stop offset="75%" stopColor={colors.primary} />
                    <Stop offset="100%" stopColor={colors.secondary} />
                </LinearGradient>
                <RadialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
                    <Stop offset="70%" stopColor="transparent" />
                    <Stop offset="100%" stopColor={colors.glow} />
                </RadialGradient>
            </Defs>

            <Circle cx={center} cy={center} r={radius + 4} fill={`url(#${id}-glow)`} />
            <Circle
                cx={center}
                cy={center}
                r={radius - strokeWidth / 2}
                stroke={`url(#${id}-border)`}
                strokeWidth={strokeWidth * 2}
                fill="none"
            />

            <G transform={`translate(${center}, ${strokeWidth * 2})`}>
                <Path
                    d="M0,-4 L1.5,2 L5,2 L2,5 L3.5,10 L0,7 L-3.5,10 L-2,5 L-5,2 L-1.5,2 Z"
                    fill={colors.shine}
                    transform={`scale(${size * 0.012})`}
                />
            </G>
        </Svg>
    );
}

// Gold tier - Ornate crest with crown
function GoldEmblem({ size, colors }: { size: number; colors: typeof TIER_COLORS.GOLD }) {
    const id = useUniqueId('gold');
    const strokeWidth = size * 0.032;
    const center = size / 2;
    const radius = size / 2 - strokeWidth;

    return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
                <LinearGradient id={`${id}-border`} x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor={colors.secondary} />
                    <Stop offset="25%" stopColor={colors.primary} />
                    <Stop offset="45%" stopColor={colors.shine} />
                    <Stop offset="50%" stopColor={colors.accent} />
                    <Stop offset="55%" stopColor={colors.shine} />
                    <Stop offset="75%" stopColor={colors.primary} />
                    <Stop offset="100%" stopColor={colors.secondary} />
                </LinearGradient>
                <RadialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
                    <Stop offset="60%" stopColor="transparent" />
                    <Stop offset="100%" stopColor={colors.glow} />
                </RadialGradient>
                <LinearGradient id={`${id}-crown`} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={colors.shine} />
                    <Stop offset="100%" stopColor={colors.primary} />
                </LinearGradient>
            </Defs>

            <Circle cx={center} cy={center} r={radius + 5} fill={`url(#${id}-glow)`} />
            <Circle
                cx={center}
                cy={center}
                r={radius + strokeWidth * 0.5}
                stroke={colors.secondary}
                strokeWidth={strokeWidth * 0.3}
                fill="none"
                strokeDasharray={`${size * 0.05} ${size * 0.02}`}
            />
            <Circle
                cx={center}
                cy={center}
                r={radius - strokeWidth / 2}
                stroke={`url(#${id}-border)`}
                strokeWidth={strokeWidth * 2.5}
                fill="none"
            />

            <G transform={`translate(${center}, ${strokeWidth * 0.5})`}>
                <Path
                    d={`M-8,-2 L-6,4 L-3,0 L0,5 L3,0 L6,4 L8,-2 L6,8 L-6,8 Z`}
                    fill={`url(#${id}-crown)`}
                    transform={`scale(${size * 0.015})`}
                />
            </G>

            <G transform={`translate(${center}, ${center})`}>
                <Path
                    d={`M${-radius * 0.9} 0 Q${-radius * 1.1} ${-radius * 0.3} ${-radius * 0.7} ${-radius * 0.5}`}
                    stroke={colors.primary}
                    strokeWidth={strokeWidth * 0.6}
                    fill="none"
                    strokeLinecap="round"
                />
                <Path
                    d={`M${radius * 0.9} 0 Q${radius * 1.1} ${-radius * 0.3} ${radius * 0.7} ${-radius * 0.5}`}
                    stroke={colors.primary}
                    strokeWidth={strokeWidth * 0.6}
                    fill="none"
                    strokeLinecap="round"
                />
            </G>
        </Svg>
    );
}

// Platinum tier - "Celestial Geometry"
function PlatinumEmblem({ size, colors }: { size: number; colors: typeof TIER_COLORS.PLATINUM }) {
    const id = useUniqueId('platinum');
    const strokeWidth = size * 0.03;
    const center = size / 2;
    const radius = size / 2 - strokeWidth * 2;

    return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
                <LinearGradient id={`${id}-border`} x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor={colors.secondary} />
                    <Stop offset="20%" stopColor={colors.primary} />
                    <Stop offset="40%" stopColor={colors.shine} />
                    <Stop offset="60%" stopColor={colors.accent} />
                    <Stop offset="80%" stopColor={colors.primary} />
                    <Stop offset="100%" stopColor={colors.secondary} />
                </LinearGradient>
                <RadialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.6">
                    <Stop offset="50%" stopColor="transparent" />
                    <Stop offset="100%" stopColor={colors.glow} />
                </RadialGradient>
            </Defs>

            {/* Outer Glow */}
            <Circle cx={center} cy={center} r={radius + 10} fill={`url(#${id}-glow)`} />

            {/* Interlocking Rings - Outer */}
            <Circle
                cx={center}
                cy={center}
                r={radius + strokeWidth}
                stroke={colors.primary}
                strokeWidth={strokeWidth * 0.5}
                fill="none"
                opacity={0.7}
                strokeDasharray={`${size * 0.1} ${size * 0.05}`}
            />

            {/* Interlocking Rings - Inner */}
            <Circle
                cx={center}
                cy={center}
                r={radius - strokeWidth}
                stroke={colors.accent}
                strokeWidth={strokeWidth * 0.5}
                fill="none"
                opacity={0.7}
                strokeDasharray={`${size * 0.05} ${size * 0.1}`}
                rotation={45}
                origin={`${center}, ${center}`}
            />

            {/* Main Structural Ring */}
            <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={`url(#${id}-border)`}
                strokeWidth={strokeWidth * 1.5}
                fill="none"
            />

            {/* Floating Geometric Accents - Cardinal */}
            <G transform={`translate(${center}, ${center})`}>
                {[0, 90, 180, 270].map((angle) => (
                    <G key={angle} transform={`rotate(${angle})`}>
                        <Path
                            d={`M0 ${-radius - strokeWidth * 3} L${strokeWidth * 1.5} ${-radius - strokeWidth} L0 ${-radius + strokeWidth} L${-strokeWidth * 1.5} ${-radius - strokeWidth} Z`}
                            fill={colors.shine}
                        />
                        <Circle
                            cx={0}
                            cy={-radius - strokeWidth * 3.5}
                            r={strokeWidth * 0.5}
                            fill={colors.accent}
                        />
                    </G>
                ))}
            </G>

            {/* Floating Geometric Accents - Diagonal */}
            <G transform={`translate(${center}, ${center})`}>
                {[45, 135, 225, 315].map((angle) => (
                    <G key={angle} transform={`rotate(${angle})`}>
                        <Path
                            d={`M0 ${-radius - strokeWidth * 1.5} L${strokeWidth} ${-radius} L0 ${-radius + strokeWidth * 1.5} L${-strokeWidth} ${-radius} Z`}
                            fill={colors.primary}
                            opacity={0.8}
                        />
                    </G>
                ))}
            </G>
        </Svg>
    );
}

// Diamond tier - "Shattered Crystal"
function DiamondEmblem({ size, colors }: { size: number; colors: typeof TIER_COLORS.DIAMOND }) {
    const id = useUniqueId('diamond');
    const strokeWidth = size * 0.04;
    const center = size / 2;
    const radius = size / 2 - strokeWidth * 3;

    return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
                <LinearGradient id={`${id}-shard-light`} x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor={colors.shine} />
                    <Stop offset="100%" stopColor={colors.accent} />
                </LinearGradient>
                <LinearGradient id={`${id}-shard-dark`} x1="1" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={colors.primary} />
                    <Stop offset="100%" stopColor={colors.secondary} />
                </LinearGradient>
                <RadialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.7">
                    <Stop offset="40%" stopColor="transparent" />
                    <Stop offset="100%" stopColor={colors.glow} />
                </RadialGradient>
            </Defs>

            {/* Intense Glow */}
            <Circle cx={center} cy={center} r={radius + 15} fill={`url(#${id}-glow)`} />

            {/* Background Shards (Darker) */}
            <G transform={`translate(${center}, ${center})`}>
                {[15, 75, 135, 195, 255, 315].map((angle) => (
                    <G key={angle} transform={`rotate(${angle})`}>
                        <Path
                            d={`M0 ${-radius - strokeWidth * 2} L${strokeWidth * 2} ${-radius + strokeWidth} L0 ${-radius + strokeWidth * 3} L${-strokeWidth * 2} ${-radius + strokeWidth} Z`}
                            fill={`url(#${id}-shard-dark)`}
                            opacity={0.8}
                        />
                    </G>
                ))}
            </G>

            {/* Foreground Shards (Lighter, Spiky) */}
            <G transform={`translate(${center}, ${center})`}>
                {[0, 60, 120, 180, 240, 300].map((angle) => (
                    <G key={angle} transform={`rotate(${angle})`}>
                        <Path
                            d={`M0 ${-radius - strokeWidth * 4} L${strokeWidth * 1.5} ${-radius - strokeWidth} L0 ${-radius + strokeWidth * 2} L${-strokeWidth * 1.5} ${-radius - strokeWidth} Z`}
                            fill={`url(#${id}-shard-light)`}
                        />
                        {/* Inner Facet Line */}
                        <Path
                            d={`M0 ${-radius - strokeWidth * 4} L0 ${-radius + strokeWidth * 2}`}
                            stroke={colors.shine}
                            strokeWidth={1}
                            opacity={0.5}
                        />
                    </G>
                ))}
            </G>

            {/* Floating Particles */}
            <G transform={`translate(${center}, ${center})`}>
                {[30, 90, 150, 210, 270, 330].map((angle) => (
                    <G key={angle} transform={`rotate(${angle})`}>
                        <Circle
                            cx={0}
                            cy={-radius - strokeWidth * 5}
                            r={strokeWidth * 0.4}
                            fill={colors.shine}
                            opacity={0.9}
                        />
                    </G>
                ))}
            </G>
        </Svg>
    );
}

// GENKI tier - "Eternal Flame"
function GenkiEmblem({ size, colors }: { size: number; colors: typeof TIER_COLORS.GENKI }) {
    const id = useUniqueId('genki');
    const strokeWidth = size * 0.04;
    const center = size / 2;
    const radius = size / 2 - strokeWidth * 3;

    return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
                <RadialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.7">
                    <Stop offset="30%" stopColor="transparent" />
                    <Stop offset="100%" stopColor={colors.glow} />
                </RadialGradient>
                <LinearGradient id={`${id}-flame-core`} x1="0.5" y1="1" x2="0.5" y2="0">
                    <Stop offset="0%" stopColor={colors.shine} />
                    <Stop offset="50%" stopColor="#FFFF00" />
                    <Stop offset="100%" stopColor="#FFFFFF" />
                </LinearGradient>
                <LinearGradient id={`${id}-flame-mid`} x1="0.5" y1="1" x2="0.5" y2="0">
                    <Stop offset="0%" stopColor={colors.primary} />
                    <Stop offset="60%" stopColor={colors.accent} />
                    <Stop offset="100%" stopColor={colors.shine} />
                </LinearGradient>
                <LinearGradient id={`${id}-flame-outer`} x1="0.5" y1="1" x2="0.5" y2="0">
                    <Stop offset="0%" stopColor={colors.secondary} />
                    <Stop offset="50%" stopColor={colors.primary} />
                    <Stop offset="100%" stopColor={colors.accent} />
                </LinearGradient>
            </Defs>

            {/* Massive Glow */}
            <Circle cx={center} cy={center} r={radius + 20} fill={`url(#${id}-glow)`} />

            {/* Outer Flame Ring (Darker, wider) */}
            <G transform={`translate(${center}, ${center})`}>
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
                    <G key={angle} transform={`rotate(${angle})`}>
                        <Path
                            d={`M0 ${-radius - strokeWidth * 4} Q${strokeWidth * 2} ${-radius - strokeWidth * 2} 0 ${-radius} Q${-strokeWidth * 2} ${-radius - strokeWidth * 2} 0 ${-radius - strokeWidth * 4}`}
                            fill={`url(#${id}-flame-outer)`}
                            opacity={0.8}
                        />
                    </G>
                ))}
            </G>

            {/* Middle Flame Ring (Brighter, offset) */}
            <G transform={`translate(${center}, ${center})`}>
                {[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((angle) => (
                    <G key={angle} transform={`rotate(${angle})`}>
                        <Path
                            d={`M0 ${-radius - strokeWidth * 3.5} Q${strokeWidth * 1.5} ${-radius - strokeWidth} 0 ${-radius} Q${-strokeWidth * 1.5} ${-radius - strokeWidth} 0 ${-radius - strokeWidth * 3.5}`}
                            fill={`url(#${id}-flame-mid)`}
                        />
                    </G>
                ))}
            </G>

            {/* Core Flame Ring (Hot, sharp) */}
            <G transform={`translate(${center}, ${center})`}>
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
                    <G key={angle} transform={`rotate(${angle})`}>
                        <Path
                            d={`M0 ${-radius - strokeWidth * 2.5} Q${strokeWidth} ${-radius - strokeWidth * 0.5} 0 ${-radius + strokeWidth} Q${-strokeWidth} ${-radius - strokeWidth * 0.5} 0 ${-radius - strokeWidth * 2.5}`}
                            fill={`url(#${id}-flame-core)`}
                        />
                    </G>
                ))}
            </G>

            {/* Rising Embers */}
            <G transform={`translate(${center}, ${center})`}>
                {[10, 50, 90, 130, 170, 210, 250, 290, 330].map((angle) => (
                    <G key={angle} transform={`rotate(${angle})`}>
                        <Circle
                            cx={0}
                            cy={-radius - strokeWidth * 5}
                            r={strokeWidth * 0.3}
                            fill={colors.shine}
                            opacity={0.6}
                        />
                        <Circle
                            cx={strokeWidth}
                            cy={-radius - strokeWidth * 4}
                            r={strokeWidth * 0.2}
                            fill={colors.accent}
                            opacity={0.4}
                        />
                    </G>
                ))}
            </G>
        </Svg>
    );
}

// Simple unranked ring
function UnrankedEmblem({ size, colors }: { size: number; colors: typeof TIER_COLORS.UNRANKED }) {
    const id = useUniqueId('unranked');
    const strokeWidth = size * 0.025;
    const center = size / 2;
    const radius = size / 2 - strokeWidth;

    return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
                <LinearGradient id={`${id}-border`} x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor={colors.secondary} />
                    <Stop offset="50%" stopColor={colors.primary} />
                    <Stop offset="100%" stopColor={colors.secondary} />
                </LinearGradient>
            </Defs>

            <Circle
                cx={center}
                cy={center}
                r={radius - strokeWidth / 2}
                stroke={`url(#${id}-border)`}
                strokeWidth={strokeWidth * 1.5}
                fill="none"
            />
        </Svg>
    );
}

export function TierEmblem({ tier, size, style }: TierEmblemProps) {
    const colors = TIER_COLORS[tier];

    const renderEmblem = () => {
        switch (tier) {
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
        <View style={[styles.container, { width: size, height: size }, style]}>
            {renderEmblem()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
