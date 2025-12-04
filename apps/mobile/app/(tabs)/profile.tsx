import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '../../lib/logger';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../lib/theme';
import { shadows } from '../../lib/shadows';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { AppHeader } from '../../components';
import { RankedAvatar, mapRatingToTier } from '../../components/RankedAvatar';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  discordUsername?: string;
}

interface GameRank {
  gameType: string;
  rating: number;
  deviation: number;
  volatility: number;
  rank?: number;
  totalPlayers?: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
}

interface TournamentRecord {
  id: string;
  name: string;
  gameType: string;
  date: string;
  placement?: number;
  totalPlayers?: number;
  matchRecord: string;
}

const GAME_TYPE_LABELS: Record<string, string> = {
  ONE_PIECE_TCG: 'One Piece TCG',
  AZUKI_TCG: 'Azuki TCG',
  RIFTBOUND: 'Riftbound',
};

const GAME_TYPE_ICONS: Record<string, any> = {
  ONE_PIECE_TCG: 'game-controller',
  AZUKI_TCG: 'flower',
  RIFTBOUND: 'sparkles',
};

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ranks, setRanks] = useState<GameRank[]>([]);
  const [tournaments, setTournaments] = useState<TournamentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const [userResponse, ranksResponse] = await Promise.all([
        api.getMe().catch(err => {
          logger.error('Failed to load user profile:', err);
          return null;
        }),
        api.getMyRanks().catch(err => {
          logger.error('Failed to load ranks:', err);
          return { ranks: [] };
        }),
      ]);

      if (userResponse) {
        setUser(userResponse.user || userResponse);
      }

      if (ranksResponse?.ranks) {
        setRanks(ranksResponse.ranks);
      }

      // Load tournament history if available
      try {
        const historyResponse = await api.getMyTournamentHistory({ limit: 10 });
        if (historyResponse?.tournaments) {
          setTournaments(historyResponse.tournaments);
        }
      } catch (error) {
        // Tournament history endpoint might not exist yet, that's okay
        logger.debug('Tournament history not available:', error);
      }
    } catch (error) {
      logger.error('Failed to load profile data:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  }, []);

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const calculateOverallStats = () => {
    if (ranks.length === 0) {
      return {
        totalMatches: 0,
        totalWins: 0,
        totalLosses: 0,
        totalDraws: 0,
        winRate: 0,
        eventsPlayed: 0,
      };
    }

    const totalMatches = ranks.reduce((sum, r) => sum + r.matchesPlayed, 0);
    const totalWins = ranks.reduce((sum, r) => sum + r.wins, 0);
    const totalLosses = ranks.reduce((sum, r) => sum + r.losses, 0);
    const totalDraws = ranks.reduce((sum, r) => sum + r.draws, 0);
    const winRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;

    return {
      totalMatches,
      totalWins,
      totalLosses,
      totalDraws,
      winRate,
      eventsPlayed: tournaments.length,
    };
  };

  const stats = calculateOverallStats();

  // Calculate tier based on highest rating
  const getHighestTier = () => {
    if (ranks.length === 0) return 'UNRANKED';
    const highestRating = Math.max(...ranks.map(r => r.rating));
    return mapRatingToTier(highestRating);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <AppHeader title="Profile" subtitle="Your player profile" showLogo={false} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary.main}
            colors={[theme.colors.primary.main]}
          />
        }
      >
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <RankedAvatar
            avatarUrl={user?.avatarUrl}
            name={user?.name || 'Unknown Player'}
            tier={getHighestTier()}
            size={100}
            showTierBadge={true}
            style={styles.avatarContainer}
          />

          <Text style={styles.playerName}>{user?.name || 'Unknown Player'}</Text>
          <Text style={styles.playerEmail}>{user?.email || 'No email'}</Text>

          {user?.discordUsername && (
            <View style={styles.discordBadge}>
              <Ionicons name="logo-discord" size={16} color="#5865F2" />
              <Text style={styles.discordUsername}>{user.discordUsername}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
            <Ionicons name="create-outline" size={18} color={theme.colors.primary.foreground} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="trophy" size={24} color={theme.colors.primary.main} style={styles.statIcon} />
            <Text style={styles.statValue}>{stats.totalWins}</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={24} color={theme.colors.success.main} style={styles.statIcon} />
            <Text style={styles.statValue}>{stats.winRate.toFixed(1)}%</Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color={theme.colors.info.main} style={styles.statIcon} />
            <Text style={styles.statValue}>{tournaments.length}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="game-controller" size={24} color={theme.colors.warning.main} style={styles.statIcon} />
            <Text style={styles.statValue}>{stats.totalMatches}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
              Ratings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.tabActive]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content Based on Active Tab */}
        {activeTab === 'overview' ? (
          <>
            {/* Game-Specific Ratings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Game Ratings</Text>
              {ranks.length > 0 ? (
                ranks.map((rank, index) => (
                  <View key={index} style={styles.rankCard}>
                    <View style={styles.rankHeader}>
                      <View style={styles.rankGameInfo}>
                        <Ionicons
                          name={GAME_TYPE_ICONS[rank.gameType] || 'game-controller'}
                          size={24}
                          color={theme.colors.primary.main}
                        />
                        <Text style={styles.rankGameName}>
                          {GAME_TYPE_LABELS[rank.gameType] || rank.gameType}
                        </Text>
                      </View>
                      {rank.rank && rank.totalPlayers && (
                        <View style={styles.rankBadge}>
                          <Text style={styles.rankBadgeText}>
                            #{rank.rank} of {rank.totalPlayers}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.rankStats}>
                      <View style={styles.rankStatItem}>
                        <Text style={styles.rankStatLabel}>Rating</Text>
                        <Text style={styles.rankStatValue}>{Math.round(rank.rating)}</Text>
                      </View>
                      <View style={styles.rankStatDivider} />
                      <View style={styles.rankStatItem}>
                        <Text style={styles.rankStatLabel}>Record</Text>
                        <Text style={styles.rankStatValue}>
                          {rank.wins}-{rank.losses}-{rank.draws}
                        </Text>
                      </View>
                      <View style={styles.rankStatDivider} />
                      <View style={styles.rankStatItem}>
                        <Text style={styles.rankStatLabel}>Matches</Text>
                        <Text style={styles.rankStatValue}>{rank.matchesPlayed}</Text>
                      </View>
                    </View>

                    {rank.matchesPlayed > 0 && (
                      <View style={styles.winRateBar}>
                        <View
                          style={[
                            styles.winRateFill,
                            { width: `${(rank.wins / rank.matchesPlayed) * 100}%` },
                          ]}
                        />
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="trophy-outline" size={48} color={theme.colors.text.tertiary} />
                  <Text style={styles.emptyStateText}>No ratings yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Play in tournaments to earn your rating!
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <>
            {/* Tournament History */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Tournaments</Text>
              {tournaments.length > 0 ? (
                tournaments.map((tournament, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.historyCard}
                    onPress={() => router.push(`/event/${tournament.id}`)}
                  >
                    <View style={styles.historyHeader}>
                      <View style={styles.historyGameBadge}>
                        <Ionicons
                          name={GAME_TYPE_ICONS[tournament.gameType] || 'game-controller'}
                          size={16}
                          color={theme.colors.primary.main}
                        />
                        <Text style={styles.historyGameType}>
                          {GAME_TYPE_LABELS[tournament.gameType] || tournament.gameType}
                        </Text>
                      </View>
                      {tournament.placement && (
                        <View style={styles.placementBadge}>
                          <Ionicons name="medal" size={14} color={theme.colors.warning.main} />
                          <Text style={styles.placementText}>#{tournament.placement}</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.historyTournamentName} numberOfLines={1}>
                      {tournament.name}
                    </Text>

                    <View style={styles.historyFooter}>
                      <Text style={styles.historyDate}>
                        {new Date(tournament.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                      {tournament.matchRecord && (
                        <Text style={styles.historyRecord}>{tournament.matchRecord}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color={theme.colors.text.tertiary} />
                  <Text style={styles.emptyStateText}>No tournament history</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Your completed tournaments will appear here
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Overall Match Record */}
        {stats.totalMatches > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Career Statistics</Text>
            <View style={styles.careerCard}>
              <View style={styles.careerStatRow}>
                <Text style={styles.careerStatLabel}>Total Matches</Text>
                <Text style={styles.careerStatValue}>{stats.totalMatches}</Text>
              </View>
              <View style={styles.careerStatRow}>
                <Text style={styles.careerStatLabel}>Wins</Text>
                <Text style={[styles.careerStatValue, { color: theme.colors.success.main }]}>
                  {stats.totalWins}
                </Text>
              </View>
              <View style={styles.careerStatRow}>
                <Text style={styles.careerStatLabel}>Losses</Text>
                <Text style={[styles.careerStatValue, { color: theme.colors.error.main }]}>
                  {stats.totalLosses}
                </Text>
              </View>
              <View style={styles.careerStatRow}>
                <Text style={styles.careerStatLabel}>Draws</Text>
                <Text style={[styles.careerStatValue, { color: theme.colors.text.secondary }]}>
                  {stats.totalDraws}
                </Text>
              </View>
              <View style={[styles.careerStatRow, styles.careerStatRowLast]}>
                <Text style={styles.careerStatLabel}>Win Rate</Text>
                <Text style={[styles.careerStatValue, { color: theme.colors.primary.main }]}>
                  {stats.winRate.toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/events')}
          >
            <Ionicons name="calendar" size={20} color={theme.colors.primary.main} />
            <Text style={styles.actionButtonText}>Find Tournaments</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/leaderboard')}
          >
            <Ionicons name="podium" size={20} color={theme.colors.primary.main} />
            <Text style={styles.actionButtonText}>View Leaderboard</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings" size={20} color={theme.colors.primary.main} />
            <Text style={styles.actionButtonText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileCard: {
    backgroundColor: theme.colors.background.card,
    margin: 16,
    marginTop: 8,
    borderRadius: theme.borderRadius.lg,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...shadows.md,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  playerName: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  playerEmail: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  discordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(88, 101, 242, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    marginBottom: 16,
  },
  discordUsername: {
    fontSize: theme.typography.fontSize.sm,
    color: '#5865F2',
    marginLeft: 6,
    fontWeight: theme.typography.fontWeight.medium,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.full,
    gap: 6,
    ...shadows.primary,
  },
  editProfileText: {
    color: theme.colors.primary.foreground,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...shadows.base,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: theme.colors.background.elevated,
    borderRadius: theme.borderRadius.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },
  tabActive: {
    backgroundColor: theme.colors.background.card,
    ...shadows.sm,
  },
  tabText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  tabTextActive: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  rankCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...shadows.sm,
  },
  rankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankGameInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rankGameName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  rankBadge: {
    backgroundColor: theme.colors.primary.main + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  rankBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary.main,
  },
  rankStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  rankStatItem: {
    alignItems: 'center',
  },
  rankStatLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  rankStatValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  rankStatDivider: {
    width: 1,
    backgroundColor: theme.colors.border.light,
  },
  winRateBar: {
    height: 4,
    backgroundColor: theme.colors.background.elevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  winRateFill: {
    height: '100%',
    backgroundColor: theme.colors.success.main,
  },
  historyCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...shadows.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyGameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyGameType: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.primary.main,
  },
  placementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.warning.main + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  placementText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.warning.main,
  },
  historyTournamentName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  historyRecord: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  careerCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...shadows.sm,
  },
  careerStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  careerStatRowLast: {
    borderBottomWidth: 0,
  },
  careerStatLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  careerStatValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...shadows.sm,
  },
  actionButtonText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginLeft: 12,
  },
  emptyState: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...shadows.sm,
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});
