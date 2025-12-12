import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RankedAvatar, PlayerTier } from './RankedAvatar';
import { theme } from '../lib/theme';

/**
 * Test component to preview all ranked borders at different sizes
 * Use this to verify border quality and responsiveness
 *
 * Import in any screen to test:
 * import { RankedBorderTest } from '@/components/RankedBorderTest';
 * <RankedBorderTest />
 */

const TIERS: PlayerTier[] = [
  'SPROUT',
  'BRONZE',
  'SILVER',
  'GOLD',
  'PLATINUM',
  'DIAMOND',
  'GENKI',
  'UNRANKED',
];

export function RankedBorderTest() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Ranked Border Quality Test</Text>
      <Text style={styles.subtitle}>Check border quality at different sizes</Text>

      {/* Small size (60px) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Small (60px) - Leaderboard</Text>
        <View style={styles.row}>
          {TIERS.map((tier) => (
            <View key={`small-${tier}`} style={styles.tierContainer}>
              <RankedAvatar
                name={tier}
                tier={tier}
                size={60}
              />
              <Text style={styles.tierLabel}>{tier}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Medium size (80px) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medium (80px) - Default</Text>
        <View style={styles.row}>
          {TIERS.map((tier) => (
            <View key={`medium-${tier}`} style={styles.tierContainer}>
              <RankedAvatar
                name={tier}
                tier={tier}
                size={80}
              />
              <Text style={styles.tierLabel}>{tier}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Large size (120px) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Large (120px) - Profile</Text>
        <View style={styles.row}>
          {TIERS.map((tier) => (
            <View key={`large-${tier}`} style={styles.tierContainer}>
              <RankedAvatar
                name={tier}
                tier={tier}
                size={120}
              />
              <Text style={styles.tierLabel}>{tier}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Extra Large size (160px) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>XL (160px) - Hero Display</Text>
        <View style={styles.row}>
          {TIERS.slice(0, 4).map((tier) => (
            <View key={`xl-${tier}`} style={styles.tierContainer}>
              <RankedAvatar
                name={tier}
                tier={tier}
                size={160}
              />
              <Text style={styles.tierLabel}>{tier}</Text>
            </View>
          ))}
        </View>
        <View style={styles.row}>
          {TIERS.slice(4).map((tier) => (
            <View key={`xl-${tier}`} style={styles.tierContainer}>
              <RankedAvatar
                name={tier}
                tier={tier}
                size={160}
              />
              <Text style={styles.tierLabel}>{tier}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ✅ Borders should be crisp and clear at all sizes
        </Text>
        <Text style={styles.footerText}>
          ✅ No pixelation or blurring
        </Text>
        <Text style={styles.footerText}>
          ✅ Responsive scaling
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  tierContainer: {
    alignItems: 'center',
    gap: 8,
  },
  tierLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  footer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: theme.colors.background.elevated,
    borderRadius: 8,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
});
