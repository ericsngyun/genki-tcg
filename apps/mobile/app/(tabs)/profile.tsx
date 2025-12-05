import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '../../lib/logger';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { RankedAvatar, mapRatingToTier } from '../../components/RankedAvatar';

const { width } = Dimensions.get('window');

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
  ONE_PIECE_TCG: 'One Piece',
  AZUKI_TCG: 'Azuki',
  RIFTBOUND: 'Riftbound',
};

const GAME_TYPE_COLORS: Record<string, string[]> = {
  ONE_PIECE_TCG: ['#DC2626', '#B91C1C'],
  AZUKI_TCG: ['#8B5CF6', '#7C3AED'],
  RIFTBOUND: ['#3B82F6', '#2563EB'],
};

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ranks, setRanks] = useState<GameRank[]>([]);
  const [tournaments, setTournaments] = useState<TournamentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ratings' | 'history'>('ratings');

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

      try {
        const historyResponse = await api.getMyTournamentHistory({ limit: 10 });
        if (historyResponse?.tournaments) {
          setTournaments(historyResponse.tournaments);
        }
      } catch (error) {
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

  const calculateOverallStats = () => {
    if (ranks.length === 0) {
      return { totalMatches: 0, totalWins: 0, winRate: 0, eventsPlayed: 0 };
    }

    const totalMatches = ranks.reduce((sum, r) => sum + r.matchesPlayed, 0);
    const totalWins = ranks.reduce((sum, r) => sum + r.wins, 0);
    const winRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;

    return {
      totalMatches,
      totalWins,
      winRate,
      eventsPlayed: tournaments.length,
    };
  };

  const stats = calculateOverallStats();

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
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section with Gradient Background */}
        <LinearGradient
          colors={['rgba(220, 38, 38, 0.15)', 'rgba(220, 38, 38, 0.05)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroContent}>
            {/* Avatar */}
            <RankedAvatar
              avatarUrl={user?.avatarUrl}
              name={user?.name || 'Unknown Player'}
              tier={getHighestTier()}
              size={80}
              showTierBadge={true}
            />

            {/* User Info */}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name || 'Unknown Player'}</Text>
              {user?.discordUsername && (
                <View style={styles.discordTag}>
                  <Ionicons name="logo-discord" size={14} color="#5865F2" />
                  <Text style={styles.discordUsername}>{user.discordUsername}</Text>
                </View>
              )}
            </View>

            {/* Edit Button */}
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push('/edit-profile')}
            >
              <Ionicons name="create-outline" size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Inline Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalWins}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.winRate.toFixed(0)}%</Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{tournaments.length}</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalMatches}</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'ratings' && styles.tabItemActive]}
            onPress={() => setActiveTab('ratings')}
          >
            <Text style={[styles.tabText, activeTab === 'ratings' && styles.tabTextActive]}>
              Ratings
            </Text>
            {activeTab === 'ratings' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'history' && styles.tabItemActive]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              History
            </Text>
            {activeTab === 'history' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'ratings' ? (
            <>
              {/* Game Ratings List */}
              {ranks.length > 0 ? (
                ranks.map((rank, index) => (
                  <View key={index} style={styles.rankItem}>
                    <LinearGradient
                      colors={GAME_TYPE_COLORS[rank.gameType] || ['#DC2626', '#B91C1C']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.rankAccent}
                    />
                    <View style={styles.rankContent}>
                      <View style={styles.rankHeader}>
                        <Text style={styles.rankGameName}>
                          {GAME_TYPE_LABELS[rank.gameType] || rank.gameType}
                        </Text>
                        {rank.rank && rank.totalPlayers && (
                          <Text style={styles.rankPosition}>
                            #{rank.rank} · {rank.totalPlayers} players
                          </Text>
                        )}
                      </View>

                      <View style={styles.rankStats}>
                        <View style={styles.rankStatGroup}>
                          <Text style={styles.rankRating}>{Math.round(rank.rating)}</Text>
                          <Text style={styles.rankStatText}>Rating</Text>
                        </View>
                        <View style={styles.rankStatGroup}>
                          <Text style={styles.rankRecord}>
                            {rank.wins}-{rank.losses}-{rank.draws}
                          </Text>
                          <Text style={styles.rankStatText}>W-L-D</Text>
                        </View>
                        <View style={styles.rankStatGroup}>
                          <Text style={styles.rankMatches}>{rank.matchesPlayed}</Text>
                          <Text style={styles.rankStatText}>Matches</Text>
                        </View>
                      </View>

                      {/* Win Rate Bar */}
                      {rank.matchesPlayed > 0 && (
                        <View style={styles.winRateBar}>
                          <LinearGradient
                            colors={['#10B981', '#059669']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[
                              styles.winRateFill,
                              { width: `${(rank.wins / rank.matchesPlayed) * 100}%` },
                            ]}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="trophy-outline" size={48} color={theme.colors.text.tertiary} />
                  </View>
                  <Text style={styles.emptyText}>No ratings yet</Text>
                  <Text style={styles.emptySubtext}>
                    Play in tournaments to earn your rating
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              {/* Tournament History List */}
              {tournaments.length > 0 ? (
                tournaments.map((tournament, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.tournamentItem}
                    onPress={() => router.push(`/event/${tournament.id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.tournamentHeader}>
                      <View style={styles.tournamentBadge}>
                        <LinearGradient
                          colors={GAME_TYPE_COLORS[tournament.gameType] || ['#DC2626', '#B91C1C']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.tournamentBadgeGradient}
                        >
                          <Text style={styles.tournamentBadgeText}>
                            {GAME_TYPE_LABELS[tournament.gameType] || tournament.gameType}
                          </Text>
                        </LinearGradient>
                      </View>
                      {tournament.placement && (
                        <View style={styles.placementBadge}>
                          <Ionicons name="medal" size={14} color="#F59E0B" />
                          <Text style={styles.placementText}>#{tournament.placement}</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.tournamentName} numberOfLines={1}>
                      {tournament.name}
                    </Text>

                    <View style={styles.tournamentFooter}>
                      <Text style={styles.tournamentDate}>
                        {new Date(tournament.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                      {tournament.matchRecord && (
                        <Text style={styles.tournamentRecord}>{tournament.matchRecord}</Text>
                      )}
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={theme.colors.text.tertiary}
                      style={styles.tournamentChevron}
                    />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="calendar-outline" size={48} color={theme.colors.text.tertiary} />
                  </View>
                  <Text style={styles.emptyText}>No tournament history</Text>
                  <Text style={styles.emptySubtext}>
                    Your completed tournaments will appear here
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/(tabs)/events')}
            activeOpacity={0.7}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="calendar" size={20} color={theme.colors.primary.main} />
            </View>
            <Text style={styles.actionText}>Find Tournaments</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/leaderboard')}
            activeOpacity={0.7}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="podium" size={20} color={theme.colors.primary.main} />
            </View>
            <Text style={styles.actionText}>View Leaderboard</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/settings')}
            activeOpacity={0.7}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="settings" size={20} color={theme.colors.primary.main} />
            </View>
            <Text style={styles.actionText}>Settings</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
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

  // Hero Section
  heroGradient: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  discordTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  discordUsername: {
    fontSize: 14,
    color: '#5865F2',
    fontWeight: '500',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Inline Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    position: 'relative',
  },
  tabItemActive: {},
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: theme.colors.primary.main,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.colors.primary.main,
  },

  // Content
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Rank Items
  rankItem: {
    marginBottom: 12,
    backgroundColor: theme.colors.background.card,
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  rankAccent: {
    width: 4,
  },
  rankContent: {
    flex: 1,
    padding: 16,
  },
  rankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankGameName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  rankPosition: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  rankStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  rankStatGroup: {
    alignItems: 'center',
  },
  rankRating: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary.main,
    marginBottom: 2,
  },
  rankRecord: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  rankMatches: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  rankStatText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  winRateBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  winRateFill: {
    height: '100%',
  },

  // Tournament Items
  tournamentItem: {
    marginBottom: 12,
    backgroundColor: theme.colors.background.card,
    borderRadius: 12,
    padding: 16,
    position: 'relative',
  },
  tournamentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tournamentBadge: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  tournamentBadgeGradient: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tournamentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  placementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  placementText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  tournamentName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  tournamentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tournamentDate: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  tournamentRecord: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  tournamentChevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -9,
  },

  // Empty States
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Quick Actions
  quickActions: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  quickActionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
});
