import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ImageBackground,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api'
import { TIER_COLORS } from '../../components/TierEmblem';
import { RankedAvatar, mapRatingToTier, PlayerTier } from '../../components/RankedAvatar';
import { getGameImagePath } from '../../lib/formatters';
import { BORDER_PREFERENCE_KEY } from '../edit-profile';

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

interface Transaction {
  id: string;
  amount: number;
  reasonCode: string;
  memo?: string;
  createdAt: string;
}

const GAME_TYPE_LABELS: Record<string, string> = {
  ONE_PIECE_TCG: 'One Piece TCG',
  AZUKI_TCG: 'Azuki TCG',
  RIFTBOUND: 'Riftbound',
};

const GAME_TYPE_COLORS: Record<string, { gradient: readonly [string, string]; icon: string }> = {
  ONE_PIECE_TCG: { gradient: ['#DC2626', '#B91C1C'] as const, icon: '🏴‍☠️' },
  AZUKI_TCG: { gradient: ['#8B5CF6', '#7C3AED'] as const, icon: '🎴' },
  RIFTBOUND: { gradient: ['#3B82F6', '#2563EB'] as const, icon: '⚔️' },
};

// Tier configuration for display
const TIER_DISPLAY: Record<PlayerTier, { label: string; icon: string }> = {
  GENKI: { label: 'GENKI', icon: '🔥' },
  DIAMOND: { label: 'Diamond', icon: '💎' },
  PLATINUM: { label: 'Platinum', icon: '💎' },
  GOLD: { label: 'Gold', icon: '👑' },
  SILVER: { label: 'Silver', icon: '🛡️' },
  BRONZE: { label: 'Bronze', icon: '🛡️' },
  SPROUT: { label: 'Sprout', icon: '🌱' },
  UNRANKED: { label: 'Unranked', icon: '' },
};

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ranks, setRanks] = useState<GameRank[]>([]);
  const [lifetimeRanks, setLifetimeRanks] = useState<GameRank[]>([]);
  const [tournaments, setTournaments] = useState<TournamentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ratings' | 'history'>('ratings');
  const [ratingView, setRatingView] = useState<'seasonal' | 'lifetime'>('seasonal');

  // Wallet state
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [borderPreference, setBorderPreference] = useState('HIGHEST');

  useEffect(() => {
    loadProfileData();
  }, []);

  // Reload border preference when screen regains focus
  useFocusEffect(
    useCallback(() => {
      loadBorderPreference();
    }, [])
  );

  const loadBorderPreference = async () => {
    try {
      const saved = await AsyncStorage.getItem(BORDER_PREFERENCE_KEY);
      if (saved) {
        setBorderPreference(saved);
      }
    } catch (error) {
      logger.debug('Failed to load border preference:', error);
    }
  };

  const loadProfileData = async () => {
    try {
      console.log('🔄 Loading profile data...');

      const [userResponse, ranksResponse, lifetimeResponse, walletResponse] = await Promise.all([
        api.getMe().catch(err => {
          logger.error('Failed to load user profile:', err);
          return null;
        }),
        api.getMyRanks().catch(err => {
          logger.error('Failed to load ranks:', err);
          return { ranks: [] };
        }),
        api.getMyLifetimeRatings().catch(err => {
          logger.error('Failed to load lifetime ranks:', err);
          return { categories: [] };
        }),
        api.getMyBalance().catch(err => {
          logger.debug('Failed to load balance:', err);
          return { balance: null, recentTransactions: [] };
        }),
      ]);

      console.log('👤 User Response:', JSON.stringify(userResponse, null, 2));
      console.log('🏆 Ranks Response:', JSON.stringify(ranksResponse, null, 2));
      console.log('🌟 Lifetime Response:', JSON.stringify(lifetimeResponse, null, 2));

      if (userResponse) {
        setUser(userResponse.user || userResponse);
      }

      if (ranksResponse?.categories) {
        const mappedRanks = ranksResponse.categories.map((r: any) => ({
          ...r,
          gameType: r.category,
          wins: r.matchWins,
          losses: r.matchLosses,
          draws: r.matchDraws,
        })) || [];
        console.log('✅ Mapped Seasonal Ranks:', mappedRanks.length);
        setRanks(mappedRanks);
      } else if (ranksResponse?.ranks) {
        // Fallback if I'm wrong and it is ranks
        setRanks(ranksResponse.ranks);
      }

      if (lifetimeResponse?.categories) {
        const mappedLifetime = lifetimeResponse.categories.map((r: any) => ({
          ...r,
          gameType: r.category,
          wins: r.matchWins,
          losses: r.matchLosses,
          draws: r.matchDraws,
        })) || [];
        console.log('✅ Mapped Lifetime Ranks:', mappedLifetime.length);
        setLifetimeRanks(mappedLifetime);
      }

      if (walletResponse) {
        setBalance(walletResponse.balance);
        setTransactions(walletResponse.recentTransactions || []);
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

  const stats = useMemo(() => {
    if (ranks.length === 0) {
      return { totalMatches: 0, totalWins: 0, winRate: 0, eventsPlayed: 0 };
    }
    const totalMatches = ranks.reduce((sum, r) => sum + r.matchesPlayed, 0);
    const totalWins = ranks.reduce((sum, r) => sum + r.wins, 0);
    const winRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;
    return { totalMatches, totalWins, winRate, eventsPlayed: tournaments.length };
  }, [ranks, tournaments]);

  // Calculate display tier based on preference
  const displayTier = useMemo((): PlayerTier => {
    if (borderPreference === 'HIGHEST' || ranks.length === 0) {
      if (ranks.length === 0) return 'UNRANKED';
      const highestRating = Math.max(...ranks.map(r => r.rating));
      return mapRatingToTier(highestRating);
    }
    const gameRank = ranks.find(r => r.gameType === borderPreference);
    if (!gameRank) return 'UNRANKED';
    return mapRatingToTier(gameRank.rating);
  }, [ranks, borderPreference]);

  const tierColors = TIER_COLORS[displayTier];
  const tierDisplay = TIER_DISPLAY[displayTier];

  // Calculate credits stats
  const creditsStats = useMemo(() => {
    const earned = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const spent = Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
    return { earned, spent };
  }, [transactions]);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </View>
    );
  }

  const initial = user?.name?.charAt(0).toUpperCase() || '?';

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
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Compact Header Section */}
        <LinearGradient
          colors={['rgba(220, 38, 38, 0.08)', 'transparent']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            {/* Left: Avatar */}
            <RankedAvatar
              avatarUrl={user?.avatarUrl}
              name={user?.name || 'Unknown Player'}
              tier={displayTier}
              size={84}
              showTierBadge={false}
              showEmblem={true}
            />

            {/* Right: User Info */}
            <View style={styles.headerInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.name || 'Unknown Player'}
              </Text>

              {displayTier !== 'UNRANKED' && (
                <View style={[styles.tierBadge, { backgroundColor: `${tierColors.primary}15` }]}>
                  <Text style={styles.tierIcon}>{tierDisplay.icon}</Text>
                  <Text style={[styles.tierLabel, { color: tierColors.primary }]}>
                    {tierDisplay.label}
                  </Text>
                </View>
              )}

              {user?.discordUsername && (
                <View style={styles.discordTag}>
                  <Ionicons name="logo-discord" size={12} color="#5865F2" />
                  <Text style={styles.discordUsername}>{user.discordUsername}</Text>
                </View>
              )}
            </View>

            {/* Edit Button */}
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push('/edit-profile')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="settings-outline" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalWins}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: theme.colors.success.main }]}>
                {stats.winRate.toFixed(0)}%
              </Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{tournaments.length}</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalMatches}</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Credits Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.creditsCard}
            onPress={() => setShowTransactions(!showTransactions)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['rgba(255, 215, 0, 0.12)', 'rgba(255, 200, 0, 0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.creditsGradient}
            >
              {/* Decorative glow */}
              <View style={styles.creditsGlow} />

              <View style={styles.creditsMain}>
                <View style={styles.creditsIconWrapper}>
                  <Ionicons name="diamond" size={28} color="#FFD700" />
                </View>
                <View style={styles.creditsInfo}>
                  <Text style={styles.creditsLabel}>Credits Balance</Text>
                  <Text style={styles.creditsBalance}>
                    {balance !== null ? balance.toLocaleString() : '—'}
                  </Text>
                </View>
              </View>

              <View style={styles.creditsArrow}>
                <Text style={styles.creditsArrowText}>{showTransactions ? 'Hide' : 'View'}</Text>
                <Ionicons
                  name={showTransactions ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={theme.colors.text.tertiary}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Expanded Transactions */}
          {showTransactions && (
            <View style={styles.transactionsPanel}>
              {/* Stats Row */}
              <View style={styles.creditsStatsRow}>
                <View style={styles.creditsStat}>
                  <Ionicons name="trending-up" size={14} color={theme.colors.success.main} />
                  <Text style={styles.creditsStatLabel}>Earned</Text>
                  <Text style={[styles.creditsStatValue, { color: theme.colors.success.main }]}>
                    +{creditsStats.earned.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.creditsStatDivider} />
                <View style={styles.creditsStat}>
                  <Ionicons name="trending-down" size={14} color={theme.colors.error.main} />
                  <Text style={styles.creditsStatLabel}>Spent</Text>
                  <Text style={[styles.creditsStatValue, { color: theme.colors.error.main }]}>
                    {creditsStats.spent.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Transaction List */}
              {transactions.length === 0 ? (
                <Text style={styles.noTransactionsText}>No recent transactions</Text>
              ) : (
                transactions.slice(0, 5).map((tx, index) => (
                  <View
                    key={tx.id}
                    style={[
                      styles.transactionItem,
                      index === Math.min(4, transactions.length - 1) && { borderBottomWidth: 0 }
                    ]}
                  >
                    <View style={styles.transactionLeft}>
                      <View style={[
                        styles.transactionIcon,
                        { backgroundColor: tx.amount > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
                      ]}>
                        <Ionicons
                          name={tx.amount > 0 ? 'add' : 'remove'}
                          size={14}
                          color={tx.amount > 0 ? theme.colors.success.main : theme.colors.error.main}
                        />
                      </View>
                      <View>
                        <Text style={styles.transactionReason}>
                          {tx.reasonCode.replace(/_/g, ' ')}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <Text style={[
                      styles.transactionAmount,
                      { color: tx.amount > 0 ? theme.colors.success.main : theme.colors.error.main }
                    ]}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'ratings' && styles.tabItemActive]}
            onPress={() => setActiveTab('ratings')}
          >
            <Ionicons
              name="trophy-outline"
              size={18}
              color={activeTab === 'ratings' ? theme.colors.primary.main : theme.colors.text.tertiary}
            />
            <Text style={[styles.tabText, activeTab === 'ratings' && styles.tabTextActive]}>
              Ratings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'history' && styles.tabItemActive]}
            onPress={() => setActiveTab('history')}
          >
            <Ionicons
              name="time-outline"
              size={18}
              color={activeTab === 'history' ? theme.colors.primary.main : theme.colors.text.tertiary}
            />
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'ratings' ? (
            <>
              {/* View Toggle */}
              <View style={styles.viewToggleContainer}>
                <View style={styles.viewToggle}>
                  <TouchableOpacity
                    style={[styles.toggleOption, ratingView === 'seasonal' && styles.toggleOptionActive]}
                    onPress={() => setRatingView('seasonal')}
                  >
                    <Text style={[styles.toggleText, ratingView === 'seasonal' && styles.toggleTextActive]}>
                      Current Season
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleOption, ratingView === 'lifetime' && styles.toggleOptionActive]}
                    onPress={() => setRatingView('lifetime')}
                  >
                    <Text style={[styles.toggleText, ratingView === 'lifetime' && styles.toggleTextActive]}>
                      Lifetime
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {(ratingView === 'seasonal' ? ranks : lifetimeRanks).length > 0 ? (
                (ratingView === 'seasonal' ? ranks : lifetimeRanks).map((rank, index) => {
                  const tier = mapRatingToTier(rank.rating);
                  const tierColor = TIER_COLORS[tier];
                  const gameConfig = GAME_TYPE_COLORS[rank.gameType] || { gradient: ['#6B7280', '#4B5563'] as const, icon: '🎮' };
                  const winRate = rank.matchesPlayed > 0 ? (rank.wins / rank.matchesPlayed) * 100 : 0;
                  const gameImage = getGameImagePath(rank.gameType);

                  return (
                    <View key={index} style={styles.gameCardContainer}>
                      <ImageBackground
                        source={gameImage}
                        style={styles.gameCardImage}
                        imageStyle={styles.gameCardImageStyle}
                        resizeMode="cover"
                        blurRadius={0}
                      >
                        <LinearGradient
                          colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.75)', 'rgba(0,0,0,0.92)']}
                          style={styles.gameCardGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                        >
                          {/* Game Header */}
                          <View style={styles.gameHeader}>
                            <View style={styles.gameInfo}>
                              <Text style={styles.gameNameLight}>
                                {GAME_TYPE_LABELS[rank.gameType] || rank.gameType}
                              </Text>
                              {rank.rank && rank.totalPlayers && (
                                <Text style={styles.gameRankLight}>
                                  Rank #{rank.rank} of {rank.totalPlayers}
                                </Text>
                              )}
                            </View>
                            <View style={[styles.tierBadgeSmall, { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' }]}>
                              <Text style={[styles.tierBadgeText, { color: tierColor.primary, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 }]}>
                                {TIER_DISPLAY[tier].icon} {tier}
                              </Text>
                            </View>
                          </View>

                          {/* Rating Display */}
                          <View style={styles.ratingRowTransparent}>
                            <View style={styles.ratingMain}>
                              <Text style={[styles.ratingValue, { color: '#FFFFFF' }]}>
                                {Math.round(rank.rating)}
                              </Text>
                              <Text style={styles.ratingLabelLight}>Rating</Text>
                            </View>
                            <View style={styles.ratingDividerLight} />
                            <View style={styles.ratingStat}>
                              <Text style={styles.ratingStatValueLight}>{rank.wins}</Text>
                              <Text style={styles.ratingStatLabelLight}>Wins</Text>
                            </View>
                            <View style={styles.ratingStat}>
                              <Text style={styles.ratingStatValueLight}>{rank.losses}</Text>
                              <Text style={styles.ratingStatLabelLight}>Losses</Text>
                            </View>
                            <View style={styles.ratingStat}>
                              <Text style={styles.ratingStatValueLight}>{rank.matchesPlayed}</Text>
                              <Text style={styles.ratingStatLabelLight}>Played</Text>
                            </View>
                          </View>

                          {/* Win Rate Bar */}
                          {rank.matchesPlayed > 0 && (
                            <View style={styles.winRateContainer}>
                              <View style={styles.winRateHeader}>
                                <Text style={styles.winRateLabelLight}>Win Rate</Text>
                                <Text style={[styles.winRateValue, { color: theme.colors.success.main }]}>
                                  {winRate.toFixed(0)}%
                                </Text>
                              </View>
                              <View style={styles.winRateBarLight}>
                                <View style={[styles.winRateFill, { width: `${winRate}%` }]} />
                              </View>
                            </View>
                          )}
                        </LinearGradient>
                      </ImageBackground>
                    </View>
                  );
                })
              ) : (
              <View style={styles.emptyState}>
                <Ionicons name="trophy-outline" size={48} color={theme.colors.text.tertiary} />
                <Text style={styles.emptyText}>No ratings yet</Text>
                <Text style={styles.emptySubtext}>Play in tournaments to earn your ranking!</Text>
              </View>
              )}
            </>
          ) : (
            <>
              {tournaments.length > 0 ? (
                tournaments.map((tournament, index) => {
                  const gameConfig = GAME_TYPE_COLORS[tournament.gameType] || { gradient: ['#6B7280', '#4B5563'] as const, icon: '🎮' };
                  const isTop3 = tournament.placement && tournament.placement <= 3;

                  return (
                    <View key={tournament.id} style={styles.tournamentCard}>
                      <View style={styles.tournamentHeader}>
                        <LinearGradient
                          colors={gameConfig.gradient}
                          style={styles.tournamentIconBg}
                        >
                          <Text style={styles.tournamentIcon}>{gameConfig.icon}</Text>
                        </LinearGradient>
                        <View style={styles.tournamentInfo}>
                          <Text style={styles.tournamentName} numberOfLines={1}>
                            {tournament.name}
                          </Text>
                          <Text style={styles.tournamentDate}>
                            {new Date(tournament.date).toLocaleDateString()}
                          </Text>
                        </View>
                        {tournament.placement && (
                          <View style={[
                            styles.placementBadge,
                            isTop3 ? { backgroundColor: 'rgba(255, 215, 0, 0.15)' } : undefined
                          ]}>
                            {isTop3 && (
                              <Text style={styles.placementMedal}>
                                {tournament.placement === 1 ? '🥇' : tournament.placement === 2 ? '🥈' : '🥉'}
                              </Text>
                            )}
                            <Text style={[
                              styles.placementText,
                              isTop3 ? { color: '#FFD700' } : undefined
                            ]}>
                              #{tournament.placement}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.tournamentFooter}>
                        <Text style={styles.tournamentRecord}>
                          Record: {tournament.matchRecord}
                        </Text>
                        {tournament.totalPlayers && (
                          <Text style={styles.tournamentPlayers}>
                            {tournament.totalPlayers} players
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color={theme.colors.text.tertiary} />
                  <Text style={styles.emptyText}>No tournament history</Text>
                  <Text style={styles.emptySubtext}>Join events to start your competitive journey!</Text>
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.bottomSpacer} />
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
    flexGrow: 1,
  },

  // Header
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    marginBottom: 6,
  },
  tierIcon: {
    fontSize: 12,
  },
  tierLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  discordTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  discordUsername: {
    fontSize: 13,
    color: '#5865F2',
    fontWeight: '500',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginTop: 8,
  },

  // Credits Card
  creditsCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  creditsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.15)',
    position: 'relative',
  },
  creditsGlow: {
    position: 'absolute',
    top: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  creditsMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  creditsIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditsInfo: {},
  creditsLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  creditsBalance: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFD700',
  },
  creditsArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  creditsArrowText: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
  },

  // View Toggle
  viewToggleContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.elevated,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleOptionActive: {
    backgroundColor: theme.colors.background.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  toggleTextActive: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },

  // Transactions Panel
  transactionsPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  creditsStatsRow: {
    flexDirection: 'row',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 14,
  },
  creditsStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creditsStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 14,
  },
  creditsStatLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  creditsStatValue: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  noTransactionsText: {
    textAlign: 'center',
    fontSize: 14,
    color: theme.colors.text.tertiary,
    paddingVertical: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  transactionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionReason: {
    fontSize: 13,
    color: theme.colors.text.primary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  transactionDate: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    marginTop: 1,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
  },
  tabTextActive: {
    color: theme.colors.primary.main,
  },

  // Content
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Game Cards
  gameCardContainer: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: theme.colors.background.card,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  gameCardImage: {
    width: '100%',
    minHeight: 220,
    overflow: 'hidden',
  },
  gameCardImageStyle: {
    borderRadius: 16,
    opacity: 1,
  },
  gameCardGradient: {
    padding: 16,
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  gameInfo: {
    flex: 1,
  },
  gameNameLight: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  gameRankLight: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tierBadgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Rating Row
  ratingRowTransparent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ratingMain: {
    alignItems: 'center',
    paddingRight: 16,
  },
  ratingValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  ratingLabelLight: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  ratingDividerLight: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 16,
  },
  ratingStat: {
    flex: 1,
    alignItems: 'center',
  },
  ratingStatValueLight: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ratingStatLabelLight: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginTop: 2,
  },

  // Win Rate
  winRateContainer: {},
  winRateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  winRateLabelLight: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  winRateValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  winRateBarLight: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  winRateFill: {
    height: '100%',
    backgroundColor: theme.colors.success.main,
    borderRadius: 3,
  },

  // Tournament Cards
  tournamentCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tournamentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tournamentIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tournamentIcon: {
    fontSize: 18,
  },
  tournamentInfo: {
    flex: 1,
    marginLeft: 10,
  },
  tournamentName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  tournamentDate: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  placementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  placementMedal: {
    fontSize: 14,
  },
  placementText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  tournamentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  tournamentRecord: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  tournamentPlayers: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 6,
  },

  bottomSpacer: {
    height: 40,
  },
});
