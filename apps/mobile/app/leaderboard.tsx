import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../lib/theme';
import { shadows } from '../lib/shadows';
import { api } from '../lib/api';
import { logger } from '../lib/logger';

// Conditionally import reanimated for native platforms only
let Animated: any;
let FadeInDown: any;
let FadeInUp: any;

if (Platform.OS !== 'web') {
  try {
    const ReanimatedModule = require('react-native-reanimated');
    Animated = ReanimatedModule.default;
    FadeInDown = ReanimatedModule.FadeInDown;
    FadeInUp = ReanimatedModule.FadeInUp;
  } catch (e) {
    // Fallback if reanimated not available
  }
}

const AnimatedView = Platform.OS === 'web' || !Animated ? View : Animated.View;

const { width } = Dimensions.get('window');

const GAME_TYPES = [
  { value: 'ONE_PIECE_TCG', label: 'One Piece' },
  { value: 'AZUKI_TCG', label: 'Azuki' },
  { value: 'RIFTBOUND', label: 'Riftbound' },
];

// Player Tier type
type PlayerTier =
  | 'SPROUT'
  | 'BRONZE'
  | 'SILVER'
  | 'GOLD'
  | 'PLATINUM'
  | 'DIAMOND'
  | 'GENKI'
  | 'UNRANKED';

// Map rating to tier (simplified from removed RankedAvatar component)
function mapRatingToTier(rating: number): PlayerTier {
  if (rating >= 2200) return 'GENKI';
  if (rating >= 2000) return 'DIAMOND';
  if (rating >= 1800) return 'PLATINUM';
  if (rating >= 1600) return 'GOLD';
  if (rating >= 1400) return 'SILVER';
  if (rating >= 1200) return 'BRONZE';
  if (rating >= 800) return 'SPROUT';
  return 'UNRANKED';
}

// Tier configuration with colors
const TIER_CONFIG: Record<PlayerTier, { color: string; bg: string; icon: string }> = {
  GENKI: { color: '#FF3D00', bg: 'rgba(255, 61, 0, 0.15)', icon: '🔥' },
  DIAMOND: { color: '#448AFF', bg: 'rgba(68, 138, 255, 0.15)', icon: '💎' },
  PLATINUM: { color: '#1DE9B6', bg: 'rgba(29, 233, 182, 0.15)', icon: '💎' },
  GOLD: { color: '#FFD700', bg: 'rgba(255, 215, 0, 0.15)', icon: '👑' },
  SILVER: { color: '#C0C0C0', bg: 'rgba(192, 192, 192, 0.15)', icon: '🛡️' },
  BRONZE: { color: '#CD7F32', bg: 'rgba(205, 127, 50, 0.15)', icon: '🛡️' },
  SPROUT: { color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.15)', icon: '🌱' },
  UNRANKED: { color: '#78909C', bg: 'rgba(120, 144, 156, 0.15)', icon: '' },
};

// Podium colors
const PODIUM_CONFIG = {
  1: {
    gradient: ['#FFD700', '#FFA500'] as const,
    border: '#B8860B',
    bg: 'rgba(255, 215, 0, 0.1)',
    icon: '👑',
  },
  2: {
    gradient: ['#E8E8E8', '#C0C0C0'] as const,
    border: '#A8A8A8',
    bg: 'rgba(192, 192, 192, 0.1)',
    icon: '🥈',
  },
  3: {
    gradient: ['#CD7F32', '#A0522D'] as const,
    border: '#8B4513',
    bg: 'rgba(205, 127, 50, 0.1)',
    icon: '🥉',
  },
};

export default function LeaderboardScreen() {
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState('ONE_PIECE_TCG');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/more');
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [selectedGame]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');

      // Load leaderboard and current user in parallel
      const [leaderboardResponse, userResponse] = await Promise.all([
        api.getLifetimeLeaderboard(selectedGame, { limit: 100 }),
        api.getMe().catch(() => null), // Don't fail if user not logged in
      ]);

      setLeaderboardData(leaderboardResponse.ratings || []);

      if (userResponse?.user?.id || userResponse?.id) {
        setCurrentUserId(userResponse.user?.id || userResponse.id);
      }
    } catch (err: any) {
      logger.error('Failed to load leaderboard:', err);
      setError(err.response?.data?.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  // Simple avatar component for leaderboard (no complex emblems)
  const PlayerAvatar = ({ avatarUrl, name, size = 48 }: { avatarUrl?: string; name: string; size?: number }) => {
    const initial = name?.charAt(0).toUpperCase() || '?';

    return (
      <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={[styles.avatarInitial, { fontSize: size * 0.4 }]}>{initial}</Text>
        )}
      </View>
    );
  };

  // Podium Card Component
  const PodiumCard = ({ player, position }: { player: any; position: 1 | 2 | 3 }) => {
    const config = PODIUM_CONFIG[position];
    const tier = mapRatingToTier(player.lifetimeRating);
    const tierConfig = TIER_CONFIG[tier];
    const isFirst = position === 1;
    const avatarSize = isFirst ? 72 : 56;

    return (
      <AnimatedView
        {...(Platform.OS !== 'web' && FadeInDown ? {
          entering: FadeInDown.delay(position === 1 ? 100 : position === 2 ? 200 : 300).springify()
        } : {})}
        style={[
          styles.podiumCard,
          isFirst && styles.podiumCardFirst,
          { backgroundColor: config.bg, borderColor: config.border }
        ]}
      >
        {/* Position Badge */}
        <View style={[styles.positionBadge, { borderColor: config.border }]}>
          <LinearGradient
            colors={config.gradient}
            style={styles.positionBadgeGradient}
          >
            <Text style={styles.positionBadgeText}>{position}</Text>
          </LinearGradient>
        </View>

        {/* Crown for 1st */}
        {isFirst && (
          <Text style={styles.crownIcon}>{config.icon}</Text>
        )}

        {/* Avatar */}
        <PlayerAvatar
          avatarUrl={player.avatarUrl}
          name={player.userName}
          size={avatarSize}
        />

        {/* Player Info */}
        <Text style={[styles.podiumName, isFirst && styles.podiumNameFirst]} numberOfLines={1}>
          {player.userName}
        </Text>

        {/* Rating */}
        <Text style={[styles.podiumRating, { color: tierConfig.color }]}>
          {Math.round(player.lifetimeRating)}
        </Text>

        {/* Tier Badge */}
        <View style={[styles.podiumTierBadge, { backgroundColor: tierConfig.bg }]}>
          <Text style={[styles.podiumTierText, { color: tierConfig.color }]}>
            {tierConfig.icon} {tier}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.podiumStats}>
          <Text style={styles.podiumStatsText}>
            {player.matchWins}W-{player.matchLosses}L
          </Text>
        </View>
      </AnimatedView>
    );
  };

  // Rank List Item Component
  const RankItem = ({ player, rank, index, isCurrentUser }: { player: any; rank: number; index: number; isCurrentUser?: boolean }) => {
    const tier = mapRatingToTier(player.lifetimeRating);
    const tierConfig = TIER_CONFIG[tier];
    const winRate = player.matchesPlayed > 0
      ? Math.round((player.matchWins / player.matchesPlayed) * 100)
      : 0;

    return (
      <AnimatedView
        {...(Platform.OS !== 'web' && FadeInDown ? {
          entering: FadeInDown.delay(400 + index * 40).springify()
        } : {})}
        style={[
          styles.rankItem,
          isCurrentUser && styles.rankItemCurrentUser,
        ]}
      >
        {/* Left accent */}
        <View style={[styles.rankAccent, { backgroundColor: tierConfig.color }]} />

        {/* Rank number */}
        <View style={styles.rankPosition}>
          <Text style={[styles.rankNumber, rank <= 10 && { color: theme.colors.primary.main }]}>
            {rank}
          </Text>
        </View>

        {/* Avatar */}
        <PlayerAvatar
          avatarUrl={player.avatarUrl}
          name={player.userName}
          size={40}
        />

        {/* Player info */}
        <View style={styles.rankInfo}>
          <View style={styles.rankNameRow}>
            <Text style={[styles.rankName, isCurrentUser && styles.rankNameCurrentUser]} numberOfLines={1}>
              {player.userName}
            </Text>
            {isCurrentUser && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>YOU</Text>
              </View>
            )}
          </View>
          <View style={styles.rankMeta}>
            <View style={[styles.rankTierBadge, { backgroundColor: tierConfig.bg }]}>
              <Text style={[styles.rankTierText, { color: tierConfig.color }]}>{tier}</Text>
            </View>
            <Text style={styles.rankStats}>{player.matchWins}W-{player.matchLosses}L ({winRate}%)</Text>
          </View>
        </View>

        {/* Rating */}
        <View style={styles.rankRatingContainer}>
          <Text style={[styles.rankRating, { color: tierConfig.color }]}>
            {Math.round(player.lifetimeRating)}
          </Text>
          <Text style={styles.rankRatingLabel}>Rating</Text>
        </View>
      </AnimatedView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leaderboard</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Game Selector */}
        <View style={styles.gameSelector}>
          {GAME_TYPES.map((game) => (
            <TouchableOpacity
              key={game.value}
              style={[styles.gameTab, selectedGame === game.value && styles.gameTabActive]}
              onPress={() => setSelectedGame(game.value)}
            >
              <Text style={[styles.gameTabText, selectedGame === game.value && styles.gameTabTextActive]}>
                {game.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Loading rankings...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.error.main} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadLeaderboard}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary.main} />
          }
          showsVerticalScrollIndicator={false}
        >
          {leaderboardData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="trophy-outline" size={64} color={theme.colors.text.tertiary} />
              </View>
              <Text style={styles.emptyText}>No rankings yet</Text>
              <Text style={styles.emptySubtext}>Play in tournaments to earn your ranking!</Text>
            </View>
          ) : (
            <>
              {/* Top 3 Podium */}
              {leaderboardData.length >= 3 && (
                <View style={styles.podiumSection}>
                  <Text style={styles.sectionTitle}>Top Players</Text>
                  <View style={styles.podiumContainer}>
                    {/* 2nd Place - Left */}
                    <View style={styles.podiumSide}>
                      <PodiumCard player={leaderboardData[1]} position={2} />
                    </View>

                    {/* 1st Place - Center (elevated) */}
                    <View style={styles.podiumCenter}>
                      <PodiumCard player={leaderboardData[0]} position={1} />
                    </View>

                    {/* 3rd Place - Right */}
                    <View style={styles.podiumSide}>
                      <PodiumCard player={leaderboardData[2]} position={3} />
                    </View>
                  </View>
                </View>
              )}

              {/* Rankings List */}
              <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Rankings</Text>
                {leaderboardData.slice(3).map((player, index) => (
                  <RankItem
                    key={player.userId}
                    player={player}
                    rank={index + 4}
                    index={index}
                    isCurrentUser={player.userId === currentUserId}
                  />
                ))}

                {leaderboardData.length <= 3 && leaderboardData.length > 0 && (
                  <View style={styles.noMoreRanks}>
                    <Text style={styles.noMoreRanksText}>
                      Only {leaderboardData.length} player{leaderboardData.length !== 1 ? 's' : ''} ranked
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.bottomSpacer} />
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },

  // Header
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    ...shadows.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },
  gameSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.elevated,
    borderRadius: 12,
    padding: 4,
  },
  gameTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  gameTabActive: {
    backgroundColor: theme.colors.primary.main,
  },
  gameTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  gameTabTextActive: {
    color: '#FFF',
  },

  // Loading & Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error.main,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary.main,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
    marginTop: 80,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Sections
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  // Podium Section
  podiumSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  podiumSide: {
    flex: 1,
    paddingTop: 24,
  },
  podiumCenter: {
    flex: 1.15,
  },

  // Podium Card
  podiumCard: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    position: 'relative',
  },
  podiumCardFirst: {
    paddingVertical: 24,
  },
  positionBadge: {
    position: 'absolute',
    top: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: theme.colors.background.card,
  },
  positionBadgeGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  crownIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  podiumAvatarContainer: {
    borderRadius: 100,
    borderWidth: 3,
    padding: 2,
    marginBottom: 10,
  },
  podiumName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
    maxWidth: '95%',
  },
  podiumNameFirst: {
    fontSize: 14,
    fontWeight: '700',
  },
  podiumRating: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  podiumTierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  podiumTierText: {
    fontSize: 10,
    fontWeight: '700',
  },
  podiumStats: {
    marginTop: 2,
  },
  podiumStatsText: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
  },

  // Avatar
  avatar: {
    backgroundColor: theme.colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },

  // List Section
  listSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },

  // Rank Item
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  rankAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  rankPosition: {
    width: 32,
    alignItems: 'center',
    marginLeft: 4,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
  },
  rankInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  rankName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  rankMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rankTierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rankTierText: {
    fontSize: 9,
    fontWeight: '700',
  },
  rankStats: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
  },
  rankRatingContainer: {
    alignItems: 'flex-end',
  },
  rankRating: {
    fontSize: 16,
    fontWeight: '800',
  },
  rankRatingLabel: {
    fontSize: 9,
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    fontWeight: '500',
  },

  noMoreRanks: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noMoreRanksText: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
  },

  bottomSpacer: {
    height: 40,
  },

  // Current user highlighting
  rankItemCurrentUser: {
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  rankNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  rankNameCurrentUser: {
    color: theme.colors.primary.main,
  },
  youBadge: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  youBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
});
