import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Circle, Path, G } from 'react-native-svg';
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
}> = {
  BRONZE: {
    colors: ['#5D4037', '#CD7F32', '#8D6E63'],
    icon: 'shield',
    accent: '#A1887F',
    glow: 'rgba(141, 110, 99, 0.3)',
  },
  SILVER: {
    colors: ['#455A64', '#CFD8DC', '#90A4AE'],
    icon: 'shield',
    accent: '#B0BEC5',
    glow: 'rgba(144, 164, 174, 0.4)',
  },
  GOLD: {
    colors: ['#8D6E63', '#FFD700', '#FFECB3'],
    icon: 'shield',
    accent: '#FFE082',
    glow: 'rgba(255, 215, 0, 0.5)',
    hasWings: true,
  },
  PLATINUM: {
    colors: ['#004D40', '#64FFDA', '#1DE9B6'],
    icon: 'diamond',
    accent: '#A7FFEB',
    glow: 'rgba(29, 233, 182, 0.6)',
    hasWings: true,
  },
  DIAMOND: {
    colors: ['#1A237E', '#448AFF', '#82B1FF'],
    icon: 'diamond',
    accent: '#82B1FF',
    glow: 'rgba(68, 138, 255, 0.7)',
    hasWings: true,
  },
  GENKI: {
    colors: ['#3E2723', '#FF3D00', '#FF9E80'],
    icon: 'flame',
    accent: '#FF9E80',
    glow: 'rgba(255, 61, 0, 0.8)',
    hasWings: true,
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
  const strokeWidth = size * 0.08;
  const radius = size / 2;
  const center = size / 2;
  const badgeSize = size * 0.3;

  // Wing dimensions - larger and contained
  const wingExtension = size * 0.35;
  const wingHeight = size * 0.5;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Glow Layer */}
      <View style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: size,
          backgroundColor: config.glow,
          transform: [{ scale: 1.05 }],
          opacity: 0.5,
          zIndex: -1
        }
      ]} />

      {/* SVG Border Layer - FIXED: proper clipping */}
      <View style={[StyleSheet.absoluteFill, { zIndex: 10, pointerEvents: 'none', overflow: 'hidden' }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <LinearGradient id="borderGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={config.colors[0]} />
              <Stop offset="0.5" stopColor={config.colors[1]} />
              <Stop offset="1" stopColor={config.colors[2]} />
            </LinearGradient>
            <LinearGradient id="wingGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={config.colors[1]} stopOpacity="0.9" />
              <Stop offset="0.5" stopColor={config.accent} stopOpacity="0.7" />
              <Stop offset="1" stopColor={config.colors[0]} stopOpacity="0.5" />
            </LinearGradient>
          </Defs>

          {/* Professional Wings (Side only) */}
          {config.hasWings && (
            <G>
              {/* Left Wing - Layered feathers */}
              <G>
                {/* Outer feather */}
                <Path
                  d={`
                    M${center - radius + strokeWidth / 2} ${center}
                    C${center - radius - wingExtension * 0.8} ${center - wingHeight * 0.4},
                     ${center - radius - wingExtension} ${center - wingHeight * 0.2},
                     ${center - radius - wingExtension} ${center}
                    C${center - radius - wingExtension} ${center + wingHeight * 0.2},
                     ${center - radius - wingExtension * 0.8} ${center + wingHeight * 0.4},
                     ${center - radius + strokeWidth / 2} ${center}
                    Z
                  `}
                  fill="url(#wingGrad)"
                  opacity={0.7}
                />
                {/* Middle feather */}
                <Path
                  d={`
                    M${center - radius + strokeWidth} ${center}
                    C${center - radius - wingExtension * 0.6} ${center - wingHeight * 0.3},
                     ${center - radius - wingExtension * 0.75} ${center - wingHeight * 0.15},
                     ${center - radius - wingExtension * 0.75} ${center}
                    C${center - radius - wingExtension * 0.75} ${center + wingHeight * 0.15},
                     ${center - radius - wingExtension * 0.6} ${center + wingHeight * 0.3},
                     ${center - radius + strokeWidth} ${center}
                    Z
                  `}
                  fill="url(#borderGrad)"
                  opacity={0.85}
                />
                {/* Inner highlight */}
                <Path
                  d={`
                    M${center - radius + strokeWidth * 1.5} ${center}
                    C${center - radius - wingExtension * 0.4} ${center - wingHeight * 0.2},
                     ${center - radius - wingExtension * 0.5} ${center - wingHeight * 0.1},
                     ${center - radius - wingExtension * 0.5} ${center}
                    C${center - radius - wingExtension * 0.5} ${center + wingHeight * 0.1},
                     ${center - radius - wingExtension * 0.4} ${center + wingHeight * 0.2},
                     ${center - radius + strokeWidth * 1.5} ${center}
                    Z
                  `}
                  fill={config.accent}
                  opacity={0.6}
                />
              </G>

              {/* Right Wing - Mirrored */}
              <G>
                {/* Outer feather */}
                <Path
                  d={`
                    M${center + radius - strokeWidth / 2} ${center}
                    C${center + radius + wingExtension * 0.8} ${center - wingHeight * 0.4},
                     ${center + radius + wingExtension} ${center - wingHeight * 0.2},
                     ${center + radius + wingExtension} ${center}
                    C${center + radius + wingExtension} ${center + wingHeight * 0.2},
                     ${center + radius + wingExtension * 0.8} ${center + wingHeight * 0.4},
                     ${center + radius - strokeWidth / 2} ${center}
                    Z
                  `}
                  fill="url(#wingGrad)"
                  opacity={0.7}
                />
                {/* Middle feather */}
                <Path
                  d={`
                    M${center + radius - strokeWidth} ${center}
                    C${center + radius + wingExtension * 0.6} ${center - wingHeight * 0.3},
                     ${center + radius + wingExtension * 0.75} ${center - wingHeight * 0.15},
                     ${center + radius + wingExtension * 0.75} ${center}
                    C${center + radius + wingExtension * 0.75} ${center + wingHeight * 0.15},
                     ${center + radius + wingExtension * 0.6} ${center + wingHeight * 0.3},
                     ${center + radius - strokeWidth} ${center}
                    Z
                  `}
                  fill="url(#borderGrad)"
                  opacity={0.85}
                />
                {/* Inner highlight */}
                <Path
                  d={`
                    M${center + radius - strokeWidth * 1.5} ${center}
                    C${center + radius + wingExtension * 0.4} ${center - wingHeight * 0.2},
                     ${center + radius + wingExtension * 0.5} ${center - wingHeight * 0.1},
                     ${center + radius + wingExtension * 0.5} ${center}
                    C${center + radius + wingExtension * 0.5} ${center + wingHeight * 0.1},
                     ${center + radius + wingExtension * 0.4} ${center + wingHeight * 0.2},
                     ${center + radius - strokeWidth * 1.5} ${center}
                    Z
                  `}
                  fill={config.accent}
                  opacity={0.6}
                />
              </G>
            </G>
          )}

          {/* Main Ring */}
          <Circle
            cx={center}
            cy={center}
            r={radius - strokeWidth / 2}
            stroke="url(#borderGrad)"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Inner subtle ring for depth */}
          <Circle
            cx={center}
            cy={center}
            r={radius - strokeWidth - 1}
            stroke={config.accent}
            strokeWidth={0.5}
            strokeOpacity={0.3}
            fill="none"
          />
        </Svg>
      </View>

      {/* Avatar Image */}
      <View style={[
        styles.avatarContainer,
        {
          width: size - strokeWidth * 2,
          height: size - strokeWidth * 2,
          borderRadius: (size - strokeWidth * 2) / 2,
          margin: strokeWidth
        }
      ]}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: theme.colors.background.elevated }]}>
            <Text style={[styles.initial, { fontSize: size * 0.4, color: config.accent }]}>
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
