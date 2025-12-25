import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';

export type PlayerTier =
  | 'SPROUT'
  | 'BRONZE'
  | 'SILVER'
  | 'GOLD'
  | 'PLATINUM'
  | 'DIAMOND'
  | 'GENKI'
  | 'UNRANKED';

// Tier thresholds (synced with backend)
const TIER_THRESHOLDS = {
  SPROUT: { min: 0, max: 1299 },
  BRONZE: { min: 1300, max: 1449 },
  SILVER: { min: 1450, max: 1599 },
  GOLD: { min: 1600, max: 1749 },
  PLATINUM: { min: 1750, max: 1899 },
  DIAMOND: { min: 1900, max: 2099 },
  GENKI: { min: 2100, max: Infinity },
} as const;

// Map rating to tier
export function mapRatingToTier(rating: number): PlayerTier {
  if (rating >= 2100) return 'GENKI';
  if (rating >= 1900) return 'DIAMOND';
  if (rating >= 1750) return 'PLATINUM';
  if (rating >= 1600) return 'GOLD';
  if (rating >= 1450) return 'SILVER';
  if (rating >= 1300) return 'BRONZE';
  if (rating >= 0) return 'SPROUT';
  return 'UNRANKED';
}

// Border images mapping
const BORDER_IMAGES = {
  GENKI: require('../assets/ranked-borders/genki.png'),
  DIAMOND: require('../assets/ranked-borders/diamond.png'),
  PLATINUM: require('../assets/ranked-borders/platinum.png'),
  GOLD: require('../assets/ranked-borders/gold.png'),
  SILVER: require('../assets/ranked-borders/silver.png'),
  BRONZE: require('../assets/ranked-borders/bronze.png'),
  SPROUT: require('../assets/ranked-borders/sprout.png'),
  UNRANKED: require('../assets/ranked-borders/sprout.png'), // Use sprout for unranked
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

  // Get border image (use null for SPROUT and UNRANKED)
  const borderImage = tier === 'SPROUT' || tier === 'UNRANKED' ? null : BORDER_IMAGES[tier];

  // Determine if we should show a simple green border for SPROUT
  const showSproutBorder = showBorder && tier === 'SPROUT';

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Avatar */}
      <View style={[
        styles.avatarContainer,
        { width: size, height: size, borderRadius: size / 2 },
        showSproutBorder && { borderWidth: 3, borderColor: '#10b981' }
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
