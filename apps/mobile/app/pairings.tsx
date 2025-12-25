import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { api } from '../lib/api';
import { colors, spacing, typography, borderRadius } from '../lib/theme';
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates';
import { logger } from '../lib/logger';
import { RankedAvatar } from '../components';

interface Pairing {
  id: string;
  tableNumber: number;
  playerA: { id: string; name: string; avatarUrl?: string | null };
  playerB?: { id: string; name: string; avatarUrl?: string | null };
  result?: string;
  gamesWonA?: number;
  gamesWonB?: number;
}

interface Round {
  id: string;
  roundNumber: number;
  status: string;
}

interface Event {
  id: string;
  name: string;
  game: string;
  status: string;
  rounds: Round[];
}

export default function PairingsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId]);

  useEffect(() => {
    if (event?.rounds?.length) {
      loadPairings(selectedRound);
    }
  }, [selectedRound, event?.rounds]);

  useRealtimeUpdates({
    eventId,
    onPairingsPosted: useCallback((roundNumber: number) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadData();
      setSelectedRound(roundNumber);
    }, []),
    onMatchResultReported: useCallback(() => {
      loadPairings(selectedRound);
    }, [selectedRound]),
  });

  const loadData = async () => {
    try {
      const [userData, eventData] = await Promise.all([
        api.getMe(),
        api.getEvent(eventId),
      ]);
      setMyUserId(userData.user.id);
      setEvent(eventData);

      if (eventData.rounds?.length > 0) {
        const latestRound = eventData.rounds[eventData.rounds.length - 1];
        setSelectedRound(latestRound.roundNumber);
      }
    } catch (error) {
      logger.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadPairings = async (roundNumber: number) => {
    const round = event?.rounds.find((r) => r.roundNumber === roundNumber);
    if (!round) return;
    try {
      const data = await api.getPairings(round.id);
      setPairings(data);
    } catch (error) {
      logger.error('Failed to load pairings:', error);
    }
  };

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    loadData();
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/events');
    }
  };

  const handleReportResult = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/match-details',
      params: { eventId, eventName: event?.name || '', gameType: event?.game || 'ONE_PIECE_TCG' },
    });
  };

  const myPairing = pairings.find(
    (p) => myUserId && (p.playerA.id === myUserId || p.playerB?.id === myUserId)
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading pairings...</Text>
        </View>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>Event not found</Text>
        </View>
      </View>
    );
  }

  const rounds = event.rounds || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{event.name}</Text>
          <Text style={styles.headerSubtitle}>Pairings</Text>
        </View>
      </View>

      {/* Round Selector */}
      {rounds.length > 0 && (
        <View style={styles.roundSelectorContainer}>
          <View style={styles.roundSelectorHeader}>
            <Text style={styles.roundSelectorLabel}>SELECT ROUND</Text>
            <Text style={styles.roundSelectorCount}>{rounds.length} rounds</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.roundSelector}
            contentContainerStyle={styles.roundSelectorContent}
          >
            {rounds.map((round, index) => {
              const isSelected = round.roundNumber === selectedRound;
              const isActive = round.status === 'ACTIVE';
              const isCompleted = round.status === 'COMPLETED';
              return (
                <TouchableOpacity
                  key={round.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedRound(round.roundNumber);
                  }}
                  style={[
                    styles.roundPill,
                    isSelected && styles.roundPillSelected,
                    isActive && !isSelected && styles.roundPillActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.roundPillNumber,
                    isSelected && styles.roundPillNumberSelected,
                    isActive && !isSelected && styles.roundPillNumberActive,
                  ]}>
                    {round.roundNumber}
                  </Text>
                  {isActive && (
                    <View style={[styles.roundStatusDot, isSelected && styles.roundStatusDotSelected]} />
                  )}
                  {isCompleted && !isSelected && (
                    <Ionicons name="checkmark" size={10} color={colors.text.tertiary} style={styles.roundCheckmark} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary.main}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {pairings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No pairings yet</Text>
            <Text style={styles.emptySubtitle}>Pairings will appear once the round is created</Text>
          </View>
        ) : (
          <>
            {/* My Match Card - Different display for active vs history */}
            {myPairing && (() => {
              const currentRound = event?.rounds.find((r) => r.roundNumber === selectedRound);
              const isHistorical = currentRound?.status === 'COMPLETED' || myPairing.result !== undefined;
              const isActiveRound = currentRound?.status === 'ACTIVE';
              const didWin = (myPairing.result === 'PLAYER_A_WIN' && myPairing.playerA.id === myUserId) ||
                             (myPairing.result === 'PLAYER_B_WIN' && myPairing.playerB?.id === myUserId);
              const didLose = (myPairing.result === 'PLAYER_A_WIN' && myPairing.playerB?.id === myUserId) ||
                              (myPairing.result === 'PLAYER_B_WIN' && myPairing.playerA.id === myUserId);
              const isDraw = myPairing.result === 'DRAW';
              const opponentName = myPairing.playerB
                ? (myPairing.playerA.id === myUserId ? myPairing.playerB.name : myPairing.playerA.name)
                : 'BYE';

              // Calculate game score display (my games - opponent games)
              const myGames = myPairing.playerA.id === myUserId ? myPairing.gamesWonA : myPairing.gamesWonB;
              const oppGames = myPairing.playerA.id === myUserId ? myPairing.gamesWonB : myPairing.gamesWonA;
              const hasGameScore = (myGames !== undefined && myGames > 0) || (oppGames !== undefined && oppGames > 0);

              return isHistorical && myPairing.result ? (
                // MATCH HISTORY CARD - Completed match, read-only view
                <View style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <View style={styles.historyLabelContainer}>
                      <Ionicons name="time-outline" size={14} color={colors.text.tertiary} />
                      <Text style={styles.historyLabel}>ROUND {selectedRound} RESULT</Text>
                    </View>
                  </View>

                  <View style={styles.historyContent}>
                    {/* Result Icon & Status */}
                    <View style={[
                      styles.historyResultIcon,
                      didWin && styles.historyResultIconWin,
                      didLose && styles.historyResultIconLoss,
                      isDraw && styles.historyResultIconDraw,
                    ]}>
                      <Ionicons
                        name={didWin ? 'trophy' : isDraw ? 'remove' : 'close'}
                        size={28}
                        color={didWin ? colors.success.main : isDraw ? colors.warning.main : colors.error.main}
                      />
                    </View>

                    {/* Match Details */}
                    <View style={styles.historyDetails}>
                      <Text style={[
                        styles.historyResultText,
                        didWin && { color: colors.success.main },
                        didLose && { color: colors.error.main },
                        isDraw && { color: colors.warning.main },
                      ]}>
                        {didWin ? 'Victory' : isDraw ? 'Draw' : 'Defeat'}
                      </Text>
                      <Text style={styles.historyOpponent}>vs {opponentName}</Text>
                      {hasGameScore && (
                        <Text style={styles.historyScore}>Games: {myGames || 0} - {oppGames || 0}</Text>
                      )}
                    </View>

                    {/* Table Badge */}
                    <View style={styles.historyTableBadge}>
                      <Text style={styles.historyTableLabel}>TBL</Text>
                      <Text style={styles.historyTableNumber}>{myPairing.tableNumber}</Text>
                    </View>
                  </View>
                </View>
              ) : (
                // ACTIVE MATCH CARD - Current match, action required
                <View style={styles.myMatchCard}>
                  <View style={styles.myMatchHeader}>
                    <View style={styles.myMatchLabelContainer}>
                      {isActiveRound && <View style={styles.liveDot} />}
                      <Text style={styles.myMatchLabel}>
                        {isActiveRound ? 'CURRENT MATCH' : 'YOUR MATCH'}
                      </Text>
                    </View>
                    {myPairing.result ? (
                      <View style={[
                        styles.statusBadge,
                        didWin ? styles.statusBadgeWin : isDraw ? styles.statusBadgeDraw : styles.statusBadgeLoss
                      ]}>
                        <Text style={styles.statusBadgeText}>
                          {didWin ? 'Won' : isDraw ? 'Draw' : 'Lost'}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.statusBadgePending}>
                        <Text style={styles.statusBadgeTextPending}>Pending</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.myMatchContent}>
                    <View style={styles.tableSection}>
                      <Text style={styles.tableLabel}>TABLE</Text>
                      <View style={styles.tableNumberBox}>
                        <Text style={styles.tableNumber}>{myPairing.tableNumber}</Text>
                      </View>
                    </View>
                    <View style={styles.matchupSection}>
                      <Text style={styles.vsLabel}>VS</Text>
                      <Text style={styles.opponentName}>{opponentName}</Text>
                    </View>
                  </View>

                  {!myPairing.result && myPairing.playerB && isActiveRound && (
                    <TouchableOpacity style={styles.reportButton} onPress={handleReportResult}>
                      <Ionicons name="create-outline" size={18} color={colors.primary.foreground} />
                      <Text style={styles.reportButtonText}>Report Result</Text>
                    </TouchableOpacity>
                  )}

                  {!myPairing.playerB && (
                    <View style={styles.byeInfo}>
                      <Ionicons name="information-circle-outline" size={16} color={colors.text.tertiary} />
                      <Text style={styles.byeInfoText}>You have a bye this round. Automatic win awarded.</Text>
                    </View>
                  )}
                </View>
              );
            })()}

            {/* All Pairings */}
            <View style={styles.allPairingsSection}>
              <Text style={styles.sectionTitle}>All Pairings</Text>
              <Text style={styles.sectionSubtitle}>{pairings.length} matches</Text>

              <View style={styles.pairingsTable}>
                <View style={styles.tableHeader}>
                  <View style={styles.tableCell}><Text style={styles.tableHeaderText}>Table</Text></View>
                  <View style={styles.playersCell}><Text style={styles.tableHeaderText}>Players</Text></View>
                  <View style={styles.statusCell}><Text style={styles.tableHeaderText}>Status</Text></View>
                </View>

                {pairings.map((pairing) => {
                  const isMyMatch = myUserId && (pairing.playerA.id === myUserId || pairing.playerB?.id === myUserId);
                  return (
                    <View key={pairing.id} style={[styles.pairingRow, isMyMatch && styles.pairingRowHighlight]}>
                      <View style={styles.tableCell}>
                        <Text style={styles.tableCellText}>{pairing.tableNumber}</Text>
                      </View>
                      <View style={styles.playersCell}>
                        <View style={styles.playerBlock}>
                          <RankedAvatar
                            avatarUrl={pairing.playerA.avatarUrl}
                            name={pairing.playerA.name}
                            tier="UNRANKED"
                            size={32}
                          />
                          <Text style={[styles.playerName, pairing.playerA.id === myUserId && styles.playerNameMe]} numberOfLines={1}>
                            {pairing.playerA.name}
                          </Text>
                        </View>
                        <Text style={styles.vsText}>vs</Text>
                        {pairing.playerB ? (
                          <View style={styles.playerBlock}>
                            <RankedAvatar
                              avatarUrl={pairing.playerB.avatarUrl}
                              name={pairing.playerB.name}
                              tier="UNRANKED"
                              size={32}
                            />
                            <Text style={[styles.playerName, pairing.playerB.id === myUserId && styles.playerNameMe]} numberOfLines={1}>
                              {pairing.playerB.name}
                            </Text>
                          </View>
                        ) : (
                          <Text style={styles.playerName}>BYE</Text>
                        )}
                      </View>
                      <View style={styles.statusCell}>
                        <View style={[styles.statusDot, { backgroundColor: pairing.result ? colors.success.main : colors.warning.main }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['4xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: spacing.base,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Round Selector
  roundSelectorContainer: {
    paddingTop: spacing.base,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  roundSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  roundSelectorLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
    letterSpacing: typography.letterSpacing.wider,
  },
  roundSelectorCount: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.tertiary,
  },
  roundSelector: {
    flexGrow: 0,
  },
  roundSelectorContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  roundPill: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    position: 'relative',
  },
  roundPillSelected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  roundPillActive: {
    borderColor: colors.success.main,
    backgroundColor: colors.success.main + '15',
  },
  roundPillNumber: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
  },
  roundPillNumberSelected: {
    color: colors.primary.foreground,
  },
  roundPillNumberActive: {
    color: colors.success.main,
  },
  roundStatusDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success.main,
  },
  roundStatusDotSelected: {
    backgroundColor: colors.primary.foreground,
  },
  roundCheckmark: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },

  // My Match Card (Active)
  myMatchCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary.dark,
  },
  myMatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  myMatchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success.main,
  },
  myMatchLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.light,
    letterSpacing: typography.letterSpacing.wider,
  },

  // History Card (Completed Match)
  historyCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  historyHeader: {
    marginBottom: spacing.base,
  },
  historyLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  historyLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
    letterSpacing: typography.letterSpacing.wider,
  },
  historyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  historyResultIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.elevated,
  },
  historyResultIconWin: {
    backgroundColor: colors.success.main + '15',
  },
  historyResultIconLoss: {
    backgroundColor: colors.error.main + '15',
  },
  historyResultIconDraw: {
    backgroundColor: colors.warning.main + '15',
  },
  historyDetails: {
    flex: 1,
  },
  historyResultText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  historyOpponent: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginTop: 2,
  },
  historyScore: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  historyTableBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  historyTableLabel: {
    fontSize: typography.fontSize['2xs'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
    letterSpacing: typography.letterSpacing.wider,
  },
  historyTableNumber: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
  },
  statusBadgeWin: {
    backgroundColor: colors.success.main + '20',
  },
  statusBadgeLoss: {
    backgroundColor: colors.error.main + '20',
  },
  statusBadgeDraw: {
    backgroundColor: colors.warning.main + '20',
  },
  statusBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  statusBadgePending: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.warning.main + '20',
  },
  statusBadgeTextPending: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.warning.light,
  },
  myMatchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  tableSection: {
    alignItems: 'center',
  },
  tableLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
    letterSpacing: typography.letterSpacing.wider,
    marginBottom: spacing.xs,
  },
  tableNumberBox: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableNumber: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.black,
    color: colors.primary.foreground,
  },
  matchupSection: {
    flex: 1,
  },
  vsLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  opponentName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
  },
  reportButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.foreground,
  },
  byeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.base,
    padding: spacing.md,
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.md,
  },
  byeInfoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },

  // All Pairings
  allPairingsSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginBottom: spacing.md,
  },
  pairingsTable: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.background.elevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tableHeaderText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
  pairingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  pairingRowHighlight: {
    backgroundColor: colors.primary.main + '10',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.main,
  },
  tableCell: {
    width: 50,
    alignItems: 'center',
  },
  tableCellText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  playersCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  playerBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  playerName: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  playerNameMe: {
    color: colors.primary.light,
    fontWeight: typography.fontWeight.bold,
  },
  vsText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  statusCell: {
    width: 40,
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
