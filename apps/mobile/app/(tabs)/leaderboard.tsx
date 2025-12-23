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
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../lib/theme';
import { api } from '../../lib/api';
import { logger } from '../../lib/logger';

// Conditionally import reanimated for native platforms only
let Animated: any;
let FadeInDown: any;

if (Platform.OS !== 'web') {
  try {
    const ReanimatedModule = require('react-native-reanimated');
    Animated = ReanimatedModule.default;
    FadeInDown = ReanimatedModule.FadeInDown;
  } catch (e) {
    // Fallback if reanimated not available
  }
}

const AnimatedView = Platform.OS === 'web' || !Animated ? View : Animated.View;

const { width } = Dimensions.get('window');

// Game configuration with assets
const GAME_CONFIG = {
  ONE_PIECE_TCG: {
    label: 'One Piece',
    fullName: 'One Piece TCG',
    color: '#DC2626',
    gradient: ['#DC2626', '#991B1B'] as const,
  },
  AZUKI_TCG: {
    label: 'Azuki',
    fullName: 'Azuki TCG',
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#6D28D9'] as const,
  },
  RIFTBOUND: {
    label: 'Riftbound',
    fullName: 'Riftbound',
    color: '#3B82F6',
    gradient: ['#3B82F6', '#1D4ED8'] as const,
  },
};

const GAME_TYPES = Object.keys(GAME_CONFIG) as (keyof typeof GAME_CONFIG)[];

// Get game image path
function getGameImagePath(gameType: string) {
  switch (gameType) {
    case 'ONE_PIECE_TCG':
      return require('../../assets/game-cards/one-piece-tcg.png');
    case 'AZUKI_TCG':
      return require('../../assets/game-cards/azuki-tcg.png');
    case 'RIFTBOUND':
      return require('../../assets/game-cards/riftbound.png');
    default:
      return require('../../assets/game-cards/one-piece-tcg.png');
  }
}

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

// Map rating to tier (synced with backend thresholds)
function mapRatingToTier(rating: number): PlayerTier {
  if (rating >= 2100) return 'GENKI';
  if (rating >= 1900) return 'DIAMOND';
  if (rating >= 1750) return 'PLATINUM';
  if (rating >= 1600) return 'GOLD';
  if (rating >= 1450) return 'SILVER';
  if (rating >= 1300) return 'BRONZE';
  if (rating >= 0) return 'SPROUT';
  return 'UNRANKED';
}

// Tier display names
const TIER_LABELS: Record<PlayerTier, string> = {
  GENKI: 'Genki',
  DIAMOND: 'Diamond',
  PLATINUM: 'Platinum',
  GOLD: 'Gold',
  SILVER: 'Silver',
  BRONZE: 'Bronze',
  SPROUT: 'Sprout',
  UNRANKED: 'Unranked',
};

// Tier configuration with colors
const TIER_CONFIG: Record<PlayerTier, { color: string; bg: string }> = {
  GENKI: { color: '#FF3D00', bg: 'rgba(255, 61, 0, 0.15)' },
  DIAMOND: { color: '#448AFF', bg: 'rgba(68, 138, 255, 0.15)' },
  PLATINUM: { color: '#00E5FF', bg: 'rgba(0, 229, 255, 0.15)' },
  GOLD: { color: '#FFD700', bg: 'rgba(255, 215, 0, 0.15)' },
  SILVER: { color: '#C0C0C0', bg: 'rgba(192, 192, 192, 0.15)' },
  BRONZE: { color: '#CD7F32', bg: 'rgba(205, 127, 50, 0.15)' },
  SPROUT: { color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.15)' },
  UNRANKED: { color: '#78909C', bg: 'rgba(120, 144, 156, 0.15)' },
};

// Podium colors
const PODIUM_COLORS = {
  1: { main: '#FFD700', secondary: '#FFA500', text: '#000' },
  2: { main: '#C0C0C0', secondary: '#A8A8A8', text: '#000' },
  3: { main: '#CD7F32', secondary: '#A0522D', text: '#FFF' },
};

export default function LeaderboardTab() {
  const [selectedGame, setSelectedGame] = useState<keyof typeof GAME_CONFIG>('ONE_PIECE_TCG');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const gameConfig = GAME_CONFIG[selectedGame];
  const gameImage = getGameImagePath(selectedGame);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedGame]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');

      const [leaderboardResponse, userResponse] = await Promise.all([
        api.getLifetimeLeaderboard(selectedGame, { limit: 100 }),
        api.getMe().catch(() => null),
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

  // Player Avatar Component
  const PlayerAvatar = ({ avatarUrl, name, size = 48, borderColor }: { avatarUrl?: string; name: string; size?: number; borderColor?: string }) => {
    const initial = name?.charAt(0).toUpperCase() || '?';

    return (
      <View style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
        borderColor && { borderWidth: 2, borderColor }
      ]}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={[styles.avatarInitial, { fontSize: size * 0.4 }]}>{initial}</Text>
        )}
      </View>
    );
  };

  // Top 3 Podium Component
  const TopThreePodium = () => {
    if (leaderboardData.length < 3) return null;

    const [first, second, third] = leaderboardData.slice(0, 3);

    const PodiumPlayer = ({ player, position, size }: { player: any; position: 1 | 2 | 3; size: 'large' | 'small' }) => {
      const tier = mapRatingToTier(player.lifetimeRating);
      const tierConfig = TIER_CONFIG[tier];
      const podiumColor = PODIUM_COLORS[position];
      const avatarSize = size === 'large' ? 80 : 60;
      const isFirst = position === 1;

      return (
        <View style={[styles.podiumPlayer, isFirst && styles.podiumPlayerFirst]}>
          {/* Position Badge */}
          <View style={[styles.positionBadge, { backgroundColor: podiumColor.main }]}>
            <Text style={[styles.positionText, { color: podiumColor.text }]}>{position}</Text>
          </View>

          {/* Avatar with tier border */}
          <PlayerAvatar
            avatarUrl={player.avatarUrl}
            name={player.userName}
            size={avatarSize}
            borderColor={tierConfig.color}
          />

          {/* Name */}
          <Text style={[styles.podiumName, isFirst && styles.podiumNameFirst]} numberOfLines={1}>
            {player.userName}
          </Text>

          {/* Tier */}
          <View style={[styles.podiumTierBadge, { backgroundColor: `${tierConfig.color}20` }]}>
            <View style={[styles.tierDot, { backgroundColor: tierConfig.color }]} />
            <Text style={[styles.podiumTierText, { color: tierConfig.color }]}>
              {TIER_LABELS[tier]}
            </Text>
          </View>

          {/* Stats */}
          <Text style={styles.podiumStats}>
            {player.matchWins}W - {player.matchLosses}L
          </Text>
        </View>
      );
    };

    return (
      <View style={styles.podiumContainer}>
        {/* 2nd Place */}
        <View style={styles.podiumSide}>
          <PodiumPlayer player={second} position={2} size="small" />
          <View style={[styles.podiumBase, styles.podiumBaseSecond, { backgroundColor: PODIUM_COLORS[2].main }]}>
            <Text style={styles.podiumBaseText}>2</Text>
          </View>
        </View>

        {/* 1st Place */}
        <View style={styles.podiumCenter}>
          <PodiumPlayer player={first} position={1} size="large" />
          <View style={[styles.podiumBase, styles.podiumBaseFirst, { backgroundColor: PODIUM_COLORS[1].main }]}>
            <Text style={[styles.podiumBaseText, { color: '#000' }]}>1</Text>
          </View>
        </View>

        {/* 3rd Place */}
        <View style={styles.podiumSide}>
          <PodiumPlayer player={third} position={3} size="small" />
          <View style={[styles.podiumBase, styles.podiumBaseThird, { backgroundColor: PODIUM_COLORS[3].main }]}>
            <Text style={styles.podiumBaseText}>3</Text>
          </View>
        </View>
      </View>
    );
  };

  // Rank Item Component
  const RankItem = ({ player, rank, index, isCurrentUser }: { player: any; rank: number; index: number; isCurrentUser?: boolean }) => {
    const tier = mapRatingToTier(player.lifetimeRating);
    const tierConfig = TIER_CONFIG[tier];
    const winRate = player.matchesPlayed > 0
      ? Math.round((player.matchWins / player.matchesPlayed) * 100)
      : 0;

    return (
      <AnimatedView
        {...(Platform.OS !== 'web' && FadeInDown ? {
          entering: FadeInDown.delay(100 + index * 30).springify()
        } : {})}
        style={[
          styles.rankItem,
          isCurrentUser && styles.rankItemCurrentUser,
        ]}
      >
        {/* Tier accent */}
        <View style={[styles.rankAccent, { backgroundColor: tierConfig.color }]} />

        {/* Rank */}
        <View style={styles.rankNumber}>
          <Text style={[styles.rankNumberText, rank <= 10 && { color: gameConfig.color }]}>
            {rank}
          </Text>
        </View>

        {/* Avatar */}
        <PlayerAvatar
          avatarUrl={player.avatarUrl}
          name={player.userName}
          size={44}
          borderColor={tierConfig.color}
        />

        {/* Info */}
        <View style={styles.rankInfo}>
          <View style={styles.rankNameRow}>
            <Text style={[styles.rankName, isCurrentUser && { color: gameConfig.color }]} numberOfLines={1}>
              {player.userName}
            </Text>
            {isCurrentUser && (
              <View style={[styles.youBadge, { backgroundColor: gameConfig.color }]}>
                <Text style={styles.youBadgeText}>YOU</Text>
              </View>
            )}
          </View>
          <View style={styles.rankMeta}>
            <View style={[styles.tierBadgeSmall, { backgroundColor: tierConfig.bg }]}>
              <Text style={[styles.tierBadgeText, { color: tierConfig.color }]}>{TIER_LABELS[tier]}</Text>
            </View>
            <Text style={styles.rankStatsText}>{player.matchWins}W-{player.matchLosses}L</Text>
            <Text style={styles.rankWinRate}>{winRate}%</Text>
          </View>
        </View>
      </AnimatedView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Hero Header with Game Image */}
      <ImageBackground
        source={gameImage}
        style={styles.heroHeader}
        imageStyle={styles.heroImageStyle}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', theme.colors.background.primary]}
          style={styles.heroGradient}
        >
          {/* Title */}
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Leaderboard</Text>
            <Text style={styles.heroSubtitle}>{gameConfig.fullName}</Text>
          </View>

          {/* Game Selector */}
          <View style={styles.gameSelector}>
            {GAME_TYPES.map((gameKey) => {
              const game = GAME_CONFIG[gameKey];
              const isSelected = selectedGame === gameKey;

              return (
                <TouchableOpacity
                  key={gameKey}
                  style={[
                    styles.gameTab,
                    isSelected && { backgroundColor: game.color }
                  ]}
                  onPress={() => setSelectedGame(gameKey)}
                >
                  <Text style={[
                    styles.gameTabText,
                    isSelected && styles.gameTabTextActive
                  ]}>
                    {game.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </LinearGradient>
      </ImageBackground>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={gameConfig.color} />
          <Text style={styles.loadingText}>Loading rankings...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.error.main} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: gameConfig.color }]} onPress={loadLeaderboard}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={gameConfig.color}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {leaderboardData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIcon, { backgroundColor: `${gameConfig.color}15` }]}>
                <Ionicons name="trophy-outline" size={48} color={gameConfig.color} />
              </View>
              <Text style={styles.emptyText}>No rankings yet</Text>
              <Text style={styles.emptySubtext}>
                Be the first to compete in {gameConfig.fullName}!
              </Text>
            </View>
          ) : (
            <>
              {/* Top 3 Podium */}
              {leaderboardData.length >= 3 && <TopThreePodium />}

              {/* Rankings List */}
              <View style={styles.rankingsSection}>
                <Text style={styles.sectionTitle}>
                  {leaderboardData.length >= 3 ? 'Rankings' : 'Top Players'}
                </Text>
                {leaderboardData.slice(leaderboardData.length >= 3 ? 3 : 0).map((player, index) => (
                  <RankItem
                    key={player.userId}
                    player={player}
                    rank={leaderboardData.length >= 3 ? index + 4 : index + 1}
                    index={index}
                    isCurrentUser={player.userId === currentUserId}
                  />
                ))}

                {leaderboardData.length > 0 && leaderboardData.length <= 3 && (
                  <View style={styles.fewPlayersNote}>
                    <Text style={styles.fewPlayersText}>
                      {leaderboardData.length} player{leaderboardData.length !== 1 ? 's' : ''} ranked
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

  // Hero Header
  heroHeader: {
    height: 220,
  },
  heroImageStyle: {
    opacity: 0.9,
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 60,
  },
  heroContent: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },

  // Game Selector
  gameSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    padding: 4,
  },
  gameTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  gameTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  gameTabTextActive: {
    color: '#FFFFFF',
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
    marginTop: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
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

  // Podium
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  podiumSide: {
    flex: 1,
    alignItems: 'center',
  },
  podiumCenter: {
    flex: 1.2,
    alignItems: 'center',
  },
  podiumPlayer: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  podiumPlayerFirst: {
    marginBottom: 8,
  },
  positionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  positionText: {
    fontSize: 12,
    fontWeight: '800',
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 80,
  },
  podiumNameFirst: {
    fontSize: 14,
    fontWeight: '700',
    maxWidth: 100,
  },
  podiumTierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 6,
    gap: 4,
  },
  tierDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  podiumTierText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  podiumStats: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    marginTop: 4,
  },
  podiumBase: {
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  podiumBaseFirst: {
    height: 60,
  },
  podiumBaseSecond: {
    height: 44,
  },
  podiumBaseThird: {
    height: 32,
  },
  podiumBaseText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
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

  // Rankings Section
  rankingsSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
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
  rankItemCurrentUser: {
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
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
  rankNumber: {
    width: 32,
    alignItems: 'center',
    marginLeft: 4,
  },
  rankNumberText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
  },
  rankInfo: {
    flex: 1,
    marginLeft: 12,
  },
  rankNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  rankName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
  },
  youBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  rankMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tierBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  rankStatsText: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
  },
  rankWinRate: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.success.main,
  },

  // Few Players Note
  fewPlayersNote: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  fewPlayersText: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
  },

  bottomSpacer: {
    height: 100,
  },
});
