import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import { TierEmblem, TIER_COLORS } from './TierEmblem';

export type PlayerTier =
  | 'SPROUT'
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
  showEmblem?: boolean;
  style?: ViewStyle;
}

// Border image mapping - Custom PNG borders with fallback to SVG
const TIER_BORDER_IMAGES: Record<PlayerTier, ImageSourcePropType | null> = {
  SPROUT: require('../assets/ranked-borders/sprout.png'),
  BRONZE: require('../assets/ranked-borders/bronze.png'),
  SILVER: require('../assets/ranked-borders/silver.png'),
  GOLD: require('../assets/ranked-borders/gold.png'),
  PLATINUM: require('../assets/ranked-borders/platinum.png'),
  DIAMOND: require('../assets/ranked-borders/diamond.png'),
  GENKI: require('../assets/ranked-borders/genki.png'),
  UNRANKED: null, // No border for unranked
};

export function RankedAvatar({
  avatarUrl,
  name,
  tier = 'UNRANKED',
  size = 80,
  showTierBadge = true,
  showEmblem = true,
  style,
}: RankedAvatarProps) {
  const initial = name?.charAt(0).toUpperCase() || '?';
  const tierColors = TIER_COLORS[tier];
  const borderImage = TIER_BORDER_IMAGES[tier];

  // Calculate dimensions for perfect border overlay:
  // FINAL APPROVED RATIOS (Do not change without review):
  // - Border is 145% of container (reduced from 150%)
  // - Avatar is 70% of container to ensure it stays within the border frame
  const borderSize = size * 1.45;
  const avatarSize = size * 0.7;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Avatar - Renders first (behind border) */}
      <View
        style={[
          styles.avatarContainer,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            // Perfect centering using 50% + negative margin
            top: '50%',
            left: '50%',
            marginTop: -(avatarSize / 2),
            marginLeft: -(avatarSize / 2),
          },
        ]}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatarImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: theme.colors.background.elevated }]}>
            <Text style={[styles.initial, { fontSize: avatarSize * 0.42, color: tierColors.accent }]}>
              {initial}
            </Text>
          </View>
        )}
      </View>

      {/* Tier Border - Renders on top of avatar */}
      {showEmblem && (
        <View
          style={[
            styles.borderWrapper,
            {
              width: borderSize,
              height: borderSize,
              // Perfect centering using 50% + negative margin (same technique as avatar)
              top: '50%',
              left: '50%',
              // Center vertically but offset downwards by 8% of container size to align with avatar face
              marginTop: -(borderSize / 2) + (size * 0.08),
              marginLeft: -(borderSize / 2),
            }
          ]}
        >
          {borderImage ? (
            <Image
              source={borderImage}
              style={{
                width: borderSize,
                height: borderSize,
              }}
              resizeMode="contain"
              // High quality image rendering
              resizeMethod="scale"
              fadeDuration={0}
            />
          ) : tier !== 'UNRANKED' ? (
            // Fallback to SVG emblem if PNG not available
            <TierEmblem tier={tier} size={borderSize} />
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'visible', // Allow border to overflow container
  },
  avatarContainer: {
    position: 'absolute',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.elevated,
    zIndex: 1, // Avatar behind border
  },
  borderWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10, // Border on top of avatar
    pointerEvents: 'none', // Allow touches to pass through to avatar
  },
  avatarImage: {
    width: '100%',
    height: '100%',
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

});

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
