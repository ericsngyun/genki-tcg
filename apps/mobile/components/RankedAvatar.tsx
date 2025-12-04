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
  hasTopDetail?: boolean;
}> = {
  BRONZE: {
    colors: ['#804A00', '#CD7F32', '#804A00'],
    icon: 'shield',
    accent: '#CD7F32',
    glow: 'rgba(205, 127, 50, 0.3)',
  },
  SILVER: {
    colors: ['#707070', '#E0E0E0', '#707070'],
    icon: 'shield',
    accent: '#C0C0C0',
    glow: 'rgba(192, 192, 192, 0.3)',
  },
  GOLD: {
    colors: ['#B8860B', '#FFD700', '#B8860B'],
    icon: 'shield',
    accent: '#FFD700',
    glow: 'rgba(255, 215, 0, 0.4)',
    hasTopDetail: true,
  },
  PLATINUM: {
    colors: ['#2E8B57', '#7FFFD4', '#2E8B57'], // Greenish tint for Plat usually or just silver-blue. Let's go Teal/Cyan for distinctiveness
    icon: 'diamond',
    accent: '#4FD1C5',
    glow: 'rgba(79, 209, 197, 0.5)',
    hasWings: true,
  },
  DIAMOND: {
    colors: ['#1E3A8A', '#60A5FA', '#1E3A8A'],
    icon: 'diamond',
    accent: '#3B82F6',
    glow: 'rgba(59, 130, 246, 0.6)',
    hasWings: true,
    hasTopDetail: true,
  },
  GENKI: {
    colors: ['#7F1D1D', '#EF4444', '#7F1D1D'],
    icon: 'flame',
    accent: '#EF4444',
    glow: 'rgba(239, 68, 68, 0.7)',
    hasWings: true,
    hasTopDetail: true,
  },
  UNRANKED: {
    colors: ['#374151', '#6B7280', '#374151'],
    icon: '',
    accent: '#6B7280',
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

  // Wing path scaling
  const wingWidth = size * 0.4;
  const wingHeight = size * 0.6;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Glow Layer */}
      <View style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: size,
          backgroundColor: config.glow,
          transform: [{ scale: 1.15 }],
          opacity: 0.6,
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
          </Defs>

          {/* Wings (for high tiers) */}
          {config.hasWings && (
            <G>
              {/* Left Wing */}
              <Path
                d={`M${center - radius} ${center} Q${center - radius - wingWidth / 2} ${center - wingHeight / 2} ${center - radius} ${center - wingHeight} L${center - radius + 5} ${center - wingHeight + 10} Z`}
                fill="url(#borderGrad)"
                opacity={0.9}
              />
              {/* Right Wing */}
              <Path
                d={`M${center + radius} ${center} Q${center + radius + wingWidth / 2} ${center - wingHeight / 2} ${center + radius} ${center - wingHeight} L${center + radius - 5} ${center - wingHeight + 10} Z`}
                fill="url(#borderGrad)"
                opacity={0.9}
              />
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

          {/* Top Detail (Gem/Crown) */}
          {config.hasTopDetail && (
            <Path
              d={`M${center} ${0} L${center - 10} ${15} L${center} ${25} L${center + 10} ${15} Z`}
              fill={config.accent}
              stroke="white"
              strokeWidth={1}
            />
          )}
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
