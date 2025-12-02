import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import { shadows } from '../lib/shadows';
import { api } from '../lib/api';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  SlideInRight,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const GAME_TYPES = [
  { value: 'ONE_PIECE_TCG', label: 'One Piece' },
  { value: 'AZUKI_TCG', label: 'Azuki' },
  { value: 'RIFTBOUND', label: 'Riftbound' },
];

export default function LeaderboardScreen() {
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState('ONE_PIECE_TCG');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
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
      const data = await api.getLifetimeLeaderboard(selectedGame, {
        limit: 100,
      });
      setLeaderboardData(data.ratings || []);
    } catch (err: any) {
      console.error('Failed to load leaderboard:', err);
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

  const getTierBadge = (rating: number) => {
    if (rating >= 2000) return { label: 'Platinum', color: '#E5E4E2', bg: '#E5E4E220' };
    if (rating >= 1800) return { label: 'Gold', color: '#FFD700', bg: '#FFD70020' };
    if (rating >= 1600) return { label: 'Silver', color: '#C0C0C0', bg: '#C0C0C020' };
    if (rating >= 1400) return { label: 'Bronze', color: '#CD7F32', bg: '#CD7F3220' };
    return { label: 'Unranked', color: theme.colors.text.tertiary, bg: theme.colors.background.elevated };
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
          <View style={{ width: 40 }} />
        </View>

        {/* Game Selector */}
        <View style={styles.gameSelector}>
          {GAME_TYPES.map((game) => (
            <TouchableOpacity
              key={game.value}
              style={[
                styles.gameTab,
                selectedGame === game.value && styles.gameTabActive,
              ]}
              onPress={() => setSelectedGame(game.value)}
            >
              <Text
                style={[
                  styles.gameTabText,
                  selectedGame === game.value && styles.gameTabTextActive,
                ]}
              >
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
        >
          {leaderboardData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="trophy-outline" size={64} color={theme.colors.text.tertiary} />
              <Text style={styles.emptyText}>No rankings yet</Text>
              <Text style={styles.emptySubtext}>
                Play in tournaments to earn your ranking!
              </Text>
            </View>
          ) : (
            <>
              {/* Podium */}
              {leaderboardData.length >= 3 && (
                <View style={styles.podiumContainer}>
                  {/* 2nd Place */}
                  <Animated.View
                    entering={FadeInDown.delay(200).springify()}
                    style={[styles.podiumPosition, { marginTop: 30 }]}
                  >
                    <View style={styles.avatarContainer}>
                      <LinearGradient
                        colors={['#C0C0C0', '#E5E4E2']}
                        style={[styles.avatarBorder, { borderColor: '#C0C0C0' }]}
                      >
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarInitial}>{leaderboardData[1].userName[0]}</Text>
                        </View>
                      </LinearGradient>
                      <View style={[styles.rankBadge, { backgroundColor: '#C0C0C0' }]}>
                        <Text style={styles.rankBadgeText}>2</Text>
                      </View>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>{leaderboardData[1].userName}</Text>
                    <Text style={styles.podiumRating}>{Math.round(leaderboardData[1].lifetimeRating)}</Text>
                  </Animated.View>

                  {/* 1st Place */}
                  <Animated.View
                    entering={FadeInDown.delay(100).springify()}
                    style={[styles.podiumPosition, { zIndex: 1 }]}
                  >
                    <View style={styles.crownContainer}>
                      <Ionicons name="trophy" size={24} color="#FFD700" />
                    </View>
                    <View style={[styles.avatarContainer, { transform: [{ scale: 1.1 }] }]}>
                      <LinearGradient
                        colors={['#FFD700', '#FDB931']}
                        style={[styles.avatarBorder, { borderColor: '#FFD700' }]}
                      >
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarInitial}>{leaderboardData[0].userName[0]}</Text>
                        </View>
                      </LinearGradient>
                      <View style={[styles.rankBadge, { backgroundColor: '#FFD700' }]}>
                        <Text style={styles.rankBadgeText}>1</Text>
                      </View>
                    </View>
                    <Text style={[styles.podiumName, styles.podiumNameFirst]} numberOfLines={1}>
                      {leaderboardData[0].userName}
                    </Text>
                    <Text style={[styles.podiumRating, styles.podiumRatingFirst]}>
                      {Math.round(leaderboardData[0].lifetimeRating)}
                    </Text>
                  </Animated.View>

                  {/* 3rd Place */}
                  <Animated.View
                    entering={FadeInDown.delay(300).springify()}
                    style={[styles.podiumPosition, { marginTop: 40 }]}
                  >
                    <View style={styles.avatarContainer}>
                      <LinearGradient
                        colors={['#CD7F32', '#B87333']}
                        style={[styles.avatarBorder, { borderColor: '#CD7F32' }]}
                      >
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarInitial}>{leaderboardData[2].userName[0]}</Text>
                        </View>
                      </LinearGradient>
                      <View style={[styles.rankBadge, { backgroundColor: '#CD7F32' }]}>
                        <Text style={styles.rankBadgeText}>3</Text>
                      </View>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>{leaderboardData[2].userName}</Text>
                    <Text style={styles.podiumRating}>{Math.round(leaderboardData[2].lifetimeRating)}</Text>
                  </Animated.View>
                </View>
              )}

              {/* List */}
              <View style={styles.listContainer}>
                {leaderboardData.slice(3).map((entry, index) => {
                  const rank = index + 4;
                  const tier = getTierBadge(entry.lifetimeRating);

                  return (
                    <Animated.View
                      key={entry.userId}
                      entering={FadeInDown.delay(400 + (index * 50)).springify()}
                      layout={Layout.springify()}
                      style={styles.rankItem}
                    >
                      <View style={styles.rankNumberContainer}>
                        <Text style={styles.rankNumber}>{rank}</Text>
                      </View>

                      <View style={styles.rankContent}>
                        <View style={styles.rankHeader}>
                          <Text style={styles.playerName}>{entry.userName}</Text>
                          <Text style={styles.ratingText}>{Math.round(entry.lifetimeRating)}</Text>
                        </View>

                        <View style={styles.rankFooter}>
                          <View style={[styles.tierBadge, { backgroundColor: tier.bg }]}>
                            <Text style={[styles.tierText, { color: tier.color }]}>{tier.label}</Text>
                          </View>
                          <Text style={styles.statsText}>
                            {entry.matchWins}W - {entry.matchLosses}L ({Math.round((entry.matchWins / entry.matchesPlayed) * 100)}%)
                          </Text>
                        </View>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
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
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    ...shadows.sm,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  gameSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.elevated,
    borderRadius: 12,
    padding: 4,
  },
  gameTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  gameTabActive: {
    backgroundColor: theme.colors.background.card,
    ...shadows.sm,
  },
  gameTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  gameTabTextActive: {
    color: theme.colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.error.main,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary.main,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 16,
    gap: 16,
  },
  podiumPosition: {
    alignItems: 'center',
    width: width * 0.28,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarBorder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: theme.colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  rankBadge: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background.primary,
  },
  rankBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  crownContainer: {
    marginBottom: -10,
    zIndex: 2,
  },
  podiumName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  podiumNameFirst: {
    fontSize: 15,
    fontWeight: '700',
  },
  podiumRating: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  podiumRatingFirst: {
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: 16,
    padding: 16,
    ...shadows.sm,
  },
  rankNumberContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
  },
  rankContent: {
    flex: 1,
  },
  rankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  rankFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statsText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
});
