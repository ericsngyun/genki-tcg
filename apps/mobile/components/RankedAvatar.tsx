import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';

export type PlayerTier =
  | 'BRONZE'
  | 'SILVER'
  | 'GOLD'
  | 'PLATINUM'
  | 'DIAMOND'
  | 'GENKI'
  | 'UNRANKED';

// Tier thresholds (synced with backend)
const TIER_THRESHOLDS = {
  BRONZE: { min: 1200, max: 1349 },
  SILVER: { min: 1350, max: 1549 },
  GOLD: { min: 1550, max: 1749 },
  PLATINUM: { min: 1750, max: 1949 },
  DIAMOND: { min: 1950, max: 2149 },
  GENKI: { min: 2150, max: Infinity },
} as const;

// Map rating to tier
export function mapRatingToTier(rating: number): PlayerTier {
  if (rating >= 2150) return 'GENKI';
  if (rating >= 1950) return 'DIAMOND';
  if (rating >= 1750) return 'PLATINUM';
  if (rating >= 1550) return 'GOLD';
  if (rating >= 1350) return 'SILVER';
  if (rating >= 1200) return 'BRONZE';
  return 'UNRANKED';
}

// Border images mapping - UNRANKED has no border
const BORDER_IMAGES: Record<string, any> = {
  GENKI: require('../assets/ranked-borders/genki.png'),
  DIAMOND: require('../assets/ranked-borders/diamond.png'),
  PLATINUM: require('../assets/ranked-borders/platinum.png'),
  GOLD: require('../assets/ranked-borders/gold.png'),
  SILVER: require('../assets/ranked-borders/silver.png'),
  BRONZE: require('../assets/ranked-borders/bronze.png'),
  // UNRANKED intentionally has no border
};

interface RankedAvatarProps {
  avatarUrl?: string | null;
  name: string;
  rating?: number;
  tier?: PlayerTier;
  size?: number;
  style?: ViewStyle;
  showBorder?: boolean;
}

export function RankedAvatar({
  avatarUrl,
  name,
  rating,
  tier: providedTier,
  size = 80,
  style,
  showBorder = true,
}: RankedAvatarProps) {
  // Determine tier from rating if not provided
  const tier = providedTier || (rating !== undefined ? mapRatingToTier(rating) : 'UNRANKED');

  // Get initial for fallback
  const initial = name?.charAt(0)?.toUpperCase() || '?';

  // Get border image (all tiers now have border images)
  const borderImage = BORDER_IMAGES[tier];

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Avatar */}
      <View style={[
        styles.avatarContainer,
        { width: size, height: size, borderRadius: size / 2 }
      ]}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={[styles.avatarInitial, { fontSize: size * 0.4 }]}>{initial}</Text>
          </View>
        )}
      </View>

      {/* Ranked Border Overlay */}
      {showBorder && borderImage && (
        <Image
          source={borderImage}
          style={[styles.borderOverlay, { width: size * 1.6, height: size * 1.6, marginLeft: -(size * 0.32), marginTop: -(size * 0.27) }]}
          resizeMode="contain"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    overflow: 'hidden',
    backgroundColor: '#1a1a24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    backgroundColor: '#2a2a34',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontWeight: '700',
  },
  borderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
  },
});
