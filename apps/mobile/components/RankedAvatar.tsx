import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Circle, Path, G, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';

export type PlayerTier =
  | 'BRONZE'
  | 'SILVER'
  | 'GOLD'
  | 'PLATINUM'
  | 'DIAMOND'
  | 'GENKI'
  | 'UNRANKED';

interface RankedAvatarProps {
  avatarUrl?: string | null;
  name: string;
  tier?: PlayerTier;
  size?: number;
  showTierBadge?: boolean;
  style?: ViewStyle;
}

// Configuration for tier visuals
const TIER_CONFIG: Record<PlayerTier, {
  colors: string[];
  icon: string;
  accent: string;
  glow: string;
  hasWings?: boolean;
  hasGems?: boolean; // New: Gem accents at cardinal points
}> = {
  BRONZE: {
    colors: ['#5D4037', '#CD7F32', '#8D6E63'], // Darker bronze to lighter
    icon: 'shield',
    accent: '#A1887F',
    glow: 'rgba(141, 110, 99, 0.2)',
  },
  SILVER: {
    colors: ['#455A64', '#CFD8DC', '#90A4AE'], // Blue-grey silver
    icon: 'shield',
    accent: '#B0BEC5',
    glow: 'rgba(144, 164, 174, 0.3)',
  },
  GOLD: {
    colors: ['#8D6E63', '#FFD700', '#FFECB3'], // Deep gold to pale gold
    icon: 'shield',
    accent: '#FFE082',
    glow: 'rgba(255, 215, 0, 0.4)',
    hasGems: true,
  },
  PLATINUM: {
    colors: ['#004D40', '#64FFDA', '#1DE9B6'], // Deep teal to bright teal
    icon: 'diamond',
    accent: '#A7FFEB',
    glow: 'rgba(29, 233, 182, 0.5)',
    hasWings: true,
    hasGems: true,
  },
  DIAMOND: {
    colors: ['#1A237E', '#448AFF', '#82B1FF'], // Deep blue to light blue
    icon: 'diamond',
    accent: '#82B1FF',
    glow: 'rgba(68, 138, 255, 0.6)',
    hasWings: true,
    hasGems: true,
  },
  GENKI: {
    colors: ['#3E2723', '#FF3D00', '#FF9E80'], // Deep red/brown to bright orange/red
    icon: 'flame',
    accent: '#FF9E80',
    glow: 'rgba(255, 61, 0, 0.7)',
    hasWings: true,
    hasGems: true,
  },
  UNRANKED: {
    colors: ['#263238', '#546E7A', '#78909C'],
    icon: '',
    accent: '#90A4AE',
    glow: 'transparent',
  },
};

export function RankedAvatar({
  avatarUrl,
  name,
  tier = 'UNRANKED',
  size = 80,
  showTierBadge = true,
  style,
}: RankedAvatarProps) {
  const initial = name?.charAt(0).toUpperCase() || '?';
  const config = TIER_CONFIG[tier];

  // Dimensions
  const strokeWidth = size * 0.06; // Slightly thinner main ring
  const outerRingWidth = size * 0.02;
  const radius = size / 2;
  const center = size / 2;
  const badgeSize = size * 0.3;

  // Wing path scaling - Sharper, more detailed wings
  const wingWidth = size * 0.5;
  const wingHeight = size * 0.7;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Glow Layer */}
      <View style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: size,
          backgroundColor: config.glow,
          transform: [{ scale: 1.25 }], // Larger glow
          opacity: 0.5,
          zIndex: -1
        }
      ]} />

      {/* SVG Border Layer */}
      <View style={[StyleSheet.absoluteFill, { zIndex: 10, pointerEvents: 'none' }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <LinearGradient id="borderGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={config.colors[0]} />
              <Stop offset="0.5" stopColor={config.colors[1]} />
              <Stop offset="1" stopColor={config.colors[2]} />
            </LinearGradient>
            <LinearGradient id="gemGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={config.accent} stopOpacity="0.9" />
              <Stop offset="1" stopColor="white" stopOpacity="0.6" />
            </LinearGradient>
          </Defs>

          {/* Wings (for high tiers) - Sharper Design */}
          {config.hasWings && (
            <G>
              {/* Left Wing - 3 feathers */}
              <Path
                d={`
                  M${center - radius + strokeWidth} ${center} 
                  C${center - radius - wingWidth * 0.2} ${center - wingHeight * 0.3}, ${center - radius - wingWidth * 0.5} ${center - wingHeight * 0.6}, ${center - radius - wingWidth} ${center - wingHeight}
                  L${center - radius - wingWidth * 0.8} ${center - wingHeight * 0.5}
                  L${center - radius - wingWidth * 0.6} ${center - wingHeight * 0.8}
                  L${center - radius - wingWidth * 0.4} ${center - wingHeight * 0.4}
                  Z
                `}
                fill="url(#borderGrad)"
                opacity={0.9}
              />
              {/* Right Wing - 3 feathers (Mirrored) */}
              <Path
                d={`
                  M${center + radius - strokeWidth} ${center} 
                  C${center + radius + wingWidth * 0.2} ${center - wingHeight * 0.3}, ${center + radius + wingWidth * 0.5} ${center - wingHeight * 0.6}, ${center + radius + wingWidth} ${center - wingHeight}
                  L${center + radius + wingWidth * 0.8} ${center - wingHeight * 0.5}
                  L${center + radius + wingWidth * 0.6} ${center - wingHeight * 0.8}
                  L${center + radius + wingWidth * 0.4} ${center - wingHeight * 0.4}
                  Z
                `}
                fill="url(#borderGrad)"
                opacity={0.9}
              />
            </G>
          )}

          {/* Outer Ring (Thin) */}
          <Circle
            cx={center}
            cy={center}
            r={radius - outerRingWidth / 2}
            stroke="url(#borderGrad)"
            strokeWidth={outerRingWidth}
            strokeOpacity={0.6}
            fill="none"
          />

          {/* Main Ring (Thicker) */}
          <Circle
            cx={center}
            cy={center}
            r={radius - outerRingWidth - strokeWidth / 2 - 2} // Spaced inward
            stroke="url(#borderGrad)"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Gem Accents (Cardinal Points) */}
          {config.hasGems && (
            <G>
              {/* Top */}
              <Rect x={center - 3} y={0} width={6} height={6} fill="url(#gemGrad)" transform={`rotate(45 ${center} 3)`} />
              {/* Bottom */}
              <Rect x={center - 3} y={size - 6} width={6} height={6} fill="url(#gemGrad)" transform={`rotate(45 ${center} ${size - 3})`} />
              {/* Left */}
              <Rect x={0} y={center - 3} width={6} height={6} fill="url(#gemGrad)" transform={`rotate(45 3 ${center})`} />
              {/* Right */}
              <Rect x={size - 6} y={center - 3} width={6} height={6} fill="url(#gemGrad)" transform={`rotate(45 ${size - 3} ${center})`} />
            </G>
          )}
        </Svg>
      </View>

      {/* Avatar Image */}
      <View style={[
        styles.avatarContainer,
        {
          width: size - (outerRingWidth + strokeWidth + 4) * 2,
          height: size - (outerRingWidth + strokeWidth + 4) * 2,
          borderRadius: (size - (outerRingWidth + strokeWidth + 4) * 2) / 2,
          // Centered automatically by flex container
        }
      ]}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: theme.colors.background.elevated }]}>
            <Text style={[styles.initial, { fontSize: size * 0.35, color: config.accent }]}>
              {initial}
            </Text>
          </View>
        )}
      </View>

      {/* Tier Badge */}
      {showTierBadge && tier !== 'UNRANKED' && (
        <View style={[
          styles.badge,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            backgroundColor: config.colors[1],
            borderColor: 'white',
            borderWidth: 2,
          }
        ]}>
          <Ionicons name={config.icon as any} size={badgeSize * 0.6} color="white" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 20,
  },
});

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
