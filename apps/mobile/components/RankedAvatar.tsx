import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
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

// Tier icon configuration


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
  // Calculate dimensions - avatar is 78% of size for slimmer border appearance
  const emblemSize = size;
  const avatarSize = size * 0.78;

  return (
    <View style={[styles.container, { width: emblemSize, height: emblemSize }, style]}>
      {/* Tier Emblem as background decoration - always show */}
      {showEmblem && (
        <View style={styles.emblemWrapper}>
          <TierEmblem tier={tier} size={emblemSize} />
        </View>
      )}

      {/* Avatar - Absolutely centered */}
      <View
        style={[
          styles.avatarContainer,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
          },
        ]}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatarImage}
          />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: theme.colors.background.elevated }]}>
            <Text style={[styles.initial, { fontSize: avatarSize * 0.42, color: tierColors.accent }]}>
              {initial}
            </Text>
          </View>
        )}
      </View>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emblemWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.elevated,
    zIndex: 10,
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
