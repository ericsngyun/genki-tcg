import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '../lib/theme';
import { api } from '../lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates';

interface ActiveMatch {
  id: string;
  roundId: string;
  roundNumber: number;
  tableNumber: number;
  opponent: {
    id: string;
    name: string;
  } | null;
  result: string | null;
  gamesWonA: number;
  gamesWonB: number;
  reportedBy: string | null;
  confirmedBy: string | null;
  iAmPlayerA: boolean;
}

interface ActiveMatchCardProps {
  eventId: string;
  match: ActiveMatch;
  onMatchUpdate: () => void;
  gameType: 'ONE_PIECE_TCG' | 'AZUKI_TCG' | 'RIFTBOUND';
  myUserId: string;
}

type GameWinner = 'me' | 'opponent' | null;

export function ActiveMatchCard({ eventId, match, onMatchUpdate, gameType, myUserId }: ActiveMatchCardProps) {
  const [reporting, setReporting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showBo3Selector, setShowBo3Selector] = useState(false);
  const [gameWinners, setGameWinners] = useState<[GameWinner, GameWinner, GameWinner]>([null, null, null]);

  // Real-time updates: Refresh match when opponent reports result
  useRealtimeUpdates({
    eventId,
    onMatchResultReported: useCallback((matchId: string) => {
      if (matchId === match.id) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onMatchUpdate();
      }
    }, [match.id, onMatchUpdate]),
  });

  const isBo3 = gameType === 'RIFTBOUND';
  const iReported = match.reportedBy !== null;
  const iAmTheReporter = match.reportedBy === myUserId;
  const opponentReported = iReported && !iAmTheReporter;
  const waitingForConfirmation = iReported && !match.confirmedBy;
  const matchConfirmed = match.confirmedBy !== null;

  // Calculate result from game selections
  const calculatedResult = useMemo(() => {
    const myWins = gameWinners.filter(w => w === 'me').length;
    const oppWins = gameWinners.filter(w => w === 'opponent').length;

    let matchResult: 'win' | 'loss' | null = null;
    if (myWins >= 2) matchResult = 'win';
    else if (oppWins >= 2) matchResult = 'loss';

    return {
      matchResult,
      myWins,
      oppWins,
      isComplete: matchResult !== null,
      gamesPlayed: gameWinners.filter(w => w !== null).length,
    };
  }, [gameWinners]);

  const handleGameWinnerSelect = (gameIndex: number, winner: GameWinner) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newWinners = [...gameWinners] as [GameWinner, GameWinner, GameWinner];

    // Toggle off if clicking the same selection
    if (newWinners[gameIndex] === winner) {
      newWinners[gameIndex] = null;
    } else {
      newWinners[gameIndex] = winner;
    }

    // Clear game 3 if match is already decided after games 1 and 2
    const myWins = newWinners.filter(w => w === 'me').length;
    const oppWins = newWinners.filter(w => w === 'opponent').length;
    if (gameIndex < 2 && (myWins >= 2 || oppWins >= 2)) {
      newWinners[2] = null;
    }

    setGameWinners(newWinners);
  };

  const handleSubmitBo3Result = async () => {
    if (!calculatedResult.isComplete) {
      Alert.alert('Incomplete', 'Please select the winner for each game played');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const isWin = calculatedResult.matchResult === 'win';
    const myGames = calculatedResult.myWins;
    const oppGames = calculatedResult.oppWins;

    // Convert to player A/B format
    const result = isWin
      ? (match.iAmPlayerA ? 'PLAYER_A_WIN' : 'PLAYER_B_WIN')
      : (match.iAmPlayerA ? 'PLAYER_B_WIN' : 'PLAYER_A_WIN');

    const gamesWonA = match.iAmPlayerA ? myGames : oppGames;
    const gamesWonB = match.iAmPlayerA ? oppGames : myGames;

    await reportResult(result, gamesWonA, gamesWonB);
  };

  const handleReportWin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isBo3) {
      setShowBo3Selector(true);
      // Pre-select a 2-0 win by default
      setGameWinners(['me', 'me', null]);
    } else {
      await reportResult(
        match.iAmPlayerA ? 'PLAYER_A_WIN' : 'PLAYER_B_WIN',
        match.iAmPlayerA ? 1 : 0,
        match.iAmPlayerA ? 0 : 1
      );
    }
  };

  const handleReportLoss = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isBo3) {
      setShowBo3Selector(true);
      // Pre-select a 0-2 loss by default
      setGameWinners(['opponent', 'opponent', null]);
    } else {
      await reportResult(
        match.iAmPlayerA ? 'PLAYER_B_WIN' : 'PLAYER_A_WIN',
        match.iAmPlayerA ? 0 : 1,
        match.iAmPlayerA ? 1 : 0
      );
    }
  };

  const handleReportDraw = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await reportResult('DRAW', 0, 0);
  };

  const reportResult = async (result: string, gamesWonA: number, gamesWonB: number) => {
    setReporting(true);
    try {
      await api.reportMatchResult(match.id, result, gamesWonA, gamesWonB);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Match result submitted! Your opponent can dispute if they disagree.');
      setShowBo3Selector(false);
      setGameWinners([null, null, null]);
      onMatchUpdate();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to report result');
    } finally {
      setReporting(false);
    }
  };

  const handleConfirm = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConfirming(true);
    try {
      await api.confirmMatchResult(match.id, true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Match result confirmed!');
      onMatchUpdate();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to confirm result');
    } finally {
      setConfirming(false);
    }
  };

  const handleDispute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Dispute Result',
      'Do you want to submit a different result?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Different Result',
          onPress: () => {
            Alert.alert(
              'Report Correct Result',
              'Please report the correct match result',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const getResultDisplay = () => {
    if (!match.result) return null;

    const resultMap: Record<string, string> = {
      PLAYER_A_WIN: match.iAmPlayerA ? 'You Won' : 'You Lost',
      PLAYER_B_WIN: match.iAmPlayerA ? 'You Lost' : 'You Won',
      DRAW: 'Draw',
    };

    const score = match.gamesWonA || match.gamesWonB
      ? ` (${match.gamesWonA}-${match.gamesWonB})`
      : '';

    return resultMap[match.result] + score;
  };

  const getResultIcon = () => {
    if (!match.result) return null;
    const isWin = (match.result === 'PLAYER_A_WIN' && match.iAmPlayerA) ||
                  (match.result === 'PLAYER_B_WIN' && !match.iAmPlayerA);
    const isDraw = match.result === 'DRAW';

    if (isDraw) return 'remove-circle';
    return isWin ? 'trophy' : 'close-circle';
  };

  const getResultColor = () => {
    if (!match.result) return colors.text.primary;
    const isWin = (match.result === 'PLAYER_A_WIN' && match.iAmPlayerA) ||
                  (match.result === 'PLAYER_B_WIN' && !match.iAmPlayerA);
    const isDraw = match.result === 'DRAW';

    if (isDraw) return colors.warning.main;
    return isWin ? colors.success.main : colors.error.main;
  };

  const isBye = !match.opponent;

  // Get truncated names for Bo3 selector
  const myName = 'You';
  const oppName = match.opponent
    ? (match.opponent.name.length > 10 ? match.opponent.name.substring(0, 10) + '...' : match.opponent.name)
    : 'Opponent';

  // Bo3 Game Selector Component
  const Bo3GameSelector = () => {
    const games = [
      { index: 0, label: 'Game 1' },
      { index: 1, label: 'Game 2' },
      { index: 2, label: 'Game 3' },
    ];

    // Check if game 3 is needed
    const winsAfterTwo = {
      me: gameWinners.slice(0, 2).filter(w => w === 'me').length,
      opp: gameWinners.slice(0, 2).filter(w => w === 'opponent').length,
    };
    const needsGame3 = winsAfterTwo.me === 1 && winsAfterTwo.opp === 1;
    const matchDecided = calculatedResult.myWins >= 2 || calculatedResult.oppWins >= 2;

    return (
      <View style={styles.bo3Container}>
        <View style={styles.bo3Header}>
          <Text style={styles.bo3Title}>Select Game Winners</Text>
          <View style={styles.bo3Badge}>
            <Text style={styles.bo3BadgeText}>Bo3</Text>
          </View>
        </View>

        <View style={styles.bo3Games}>
          {games.map(({ index, label }) => {
            const isGame3 = index === 2;
            const isDisabled = isGame3 && !needsGame3 && !gameWinners[2];
            const isGreyedOut = isGame3 && matchDecided && !gameWinners[2];
            const winner = gameWinners[index];

            return (
              <View
                key={index}
                style={[
                  styles.bo3GameRow,
                  winner && styles.bo3GameRowSelected,
                  isGreyedOut && styles.bo3GameRowDisabled,
                ]}
              >
                <Text style={styles.bo3GameLabel}>{label}</Text>
                <View style={styles.bo3ButtonsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.bo3Button,
                      winner === 'me' && styles.bo3ButtonSelectedWin,
                    ]}
                    onPress={() => handleGameWinnerSelect(index, 'me')}
                    disabled={isDisabled || reporting}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.bo3ButtonText,
                      winner === 'me' && styles.bo3ButtonTextSelected,
                    ]}>
                      {myName}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.bo3Button,
                      winner === 'opponent' && styles.bo3ButtonSelectedLoss,
                    ]}
                    onPress={() => handleGameWinnerSelect(index, 'opponent')}
                    disabled={isDisabled || reporting}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.bo3ButtonText,
                      winner === 'opponent' && styles.bo3ButtonTextSelected,
                    ]}>
                      {oppName}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Result Preview */}
        {calculatedResult.gamesPlayed > 0 && (
          <View style={[
            styles.bo3Preview,
            calculatedResult.isComplete ? styles.bo3PreviewComplete : styles.bo3PreviewIncomplete,
          ]}>
            {calculatedResult.isComplete ? (
              <Text style={styles.bo3PreviewTextComplete}>
                {calculatedResult.matchResult === 'win' ? 'You win' : 'You lose'}{' '}
                <Text style={styles.bo3PreviewScore}>
                  {calculatedResult.myWins}-{calculatedResult.oppWins}
                </Text>
              </Text>
            ) : (
              <Text style={styles.bo3PreviewTextIncomplete}>
                Score: {calculatedResult.myWins}-{calculatedResult.oppWins}
                {needsGame3 && !gameWinners[2] && ' — Select Game 3'}
              </Text>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.bo3Actions}>
          <TouchableOpacity
            style={styles.bo3CancelButton}
            onPress={() => {
              setShowBo3Selector(false);
              setGameWinners([null, null, null]);
            }}
            disabled={reporting}
          >
            <Text style={styles.bo3CancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.bo3SubmitButton,
              !calculatedResult.isComplete && styles.bo3SubmitButtonDisabled,
            ]}
            onPress={handleSubmitBo3Result}
            disabled={!calculatedResult.isComplete || reporting}
            activeOpacity={0.8}
          >
            {reporting ? (
              <ActivityIndicator color={colors.neutral.white} size="small" />
            ) : (
              <Text style={styles.bo3SubmitText}>Submit Result</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="game-controller" size={18} color={colors.primary.main} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Active Match</Text>
            <Text style={styles.headerSubtitle}>Round {match.roundNumber}</Text>
          </View>
        </View>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* Table Number */}
      <View style={styles.tableContainer}>
        <Text style={styles.tableLabel}>TABLE</Text>
        <View style={styles.tableNumberContainer}>
          <Text style={styles.tableNumber}>{match.tableNumber}</Text>
        </View>
      </View>

      {/* Opponent */}
      <View style={styles.opponentContainer}>
        <View style={styles.vsContainer}>
          <View style={styles.vsLine} />
          <Text style={styles.vsLabel}>VS</Text>
          <View style={styles.vsLine} />
        </View>
        <Text style={styles.opponentName}>
          {match.opponent ? match.opponent.name : '— BYE —'}
        </Text>
      </View>

      {/* Match Status & Actions */}
      {isBye ? (
        <View style={styles.byeContainer}>
          <View style={styles.byeIconContainer}>
            <Ionicons name="cafe-outline" size={32} color={colors.primary.main} />
          </View>
          <Text style={styles.byeTitle}>Bye Round</Text>
          <Text style={styles.byeText}>
            You received a bye this round. This counts as an automatic win with 2 match points.
          </Text>
          <Text style={styles.byeSubtext}>
            Take a break or watch other matches. The next round will start when all matches are complete.
          </Text>
        </View>
      ) : matchConfirmed ? (
        <View style={styles.confirmedContainer}>
          <View style={styles.confirmedIconContainer}>
            <Ionicons name="checkmark-circle" size={40} color={colors.success.main} />
          </View>
          <Text style={styles.confirmedText}>Match Confirmed</Text>
          <View style={styles.resultContainer}>
            <Ionicons name={getResultIcon() || 'help'} size={24} color={getResultColor()} />
            <Text style={[styles.resultText, { color: getResultColor() }]}>{getResultDisplay()}</Text>
          </View>
        </View>
      ) : waitingForConfirmation ? (
        opponentReported ? (
          <View style={styles.confirmationContainer}>
            <View style={styles.pendingBadge}>
              <View style={styles.pendingDot} />
              <Text style={styles.pendingText}>Opponent Submitted Result</Text>
            </View>

            <View style={styles.reportedResultContainer}>
              <Ionicons name={getResultIcon() || 'help'} size={28} color={getResultColor()} />
              <Text style={[styles.reportedResult, { color: getResultColor() }]}>{getResultDisplay()}</Text>
            </View>

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirm}
                activeOpacity={0.8}
                disabled={confirming}
              >
                {confirming ? (
                  <ActivityIndicator color={colors.neutral.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color={colors.neutral.white} />
                    <Text style={styles.confirmButtonText}>Accept</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.disputeButton}
                onPress={handleDispute}
                activeOpacity={0.8}
              >
                <Ionicons name="flag" size={18} color={colors.error.main} />
                <Text style={styles.disputeButtonText}>Dispute</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.waitingContainer}>
            <ActivityIndicator size="large" color={colors.primary.main} />
            <Text style={styles.waitingText}>Waiting for opponent...</Text>
            <Text style={styles.reportedResultSmall}>{getResultDisplay()}</Text>
          </View>
        )
      ) : showBo3Selector && isBo3 ? (
        <Bo3GameSelector />
      ) : (
        <View style={styles.actionsContainer}>
          <Text style={styles.actionLabel}>Report Match Result</Text>

          <View style={styles.reportButtons}>
            <TouchableOpacity
              style={styles.winButton}
              onPress={handleReportWin}
              disabled={reporting}
              activeOpacity={0.8}
            >
              {reporting ? (
                <ActivityIndicator color={colors.neutral.white} />
              ) : (
                <>
                  <Ionicons name="trophy" size={28} color={colors.neutral.white} />
                  <Text style={styles.reportButtonText}>I Won</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.lossButton}
              onPress={handleReportLoss}
              disabled={reporting}
              activeOpacity={0.8}
            >
              {reporting ? (
                <ActivityIndicator color={colors.neutral.white} />
              ) : (
                <>
                  <Ionicons name="close-circle" size={28} color={colors.neutral.white} />
                  <Text style={styles.reportButtonText}>I Lost</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.drawButton}
            onPress={handleReportDraw}
            disabled={reporting}
            activeOpacity={0.7}
          >
            <Ionicons name="remove-circle-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.drawButtonText}>Draw</Text>
          </TouchableOpacity>

          {isBo3 && (
            <View style={styles.hintContainer}>
              <Ionicons name="information-circle-outline" size={14} color={colors.text.tertiary} />
              <Text style={styles.hintText}>
                Tap to select individual game winners
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.base,
    marginVertical: spacing.base,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary.dark,
    padding: spacing.lg,
    overflow: 'hidden',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary.dark,
  },
  headerTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.tight,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginTop: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success.main + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success.main,
  },
  liveText: {
    fontSize: typography.fontSize['2xs'],
    fontWeight: typography.fontWeight.bold,
    color: colors.success.main,
    letterSpacing: typography.letterSpacing.wider,
  },

  // Table
  tableContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    backgroundColor: colors.background.elevated,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  tableLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
    letterSpacing: typography.letterSpacing.widest,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  tableNumberContainer: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableNumber: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.black,
    color: colors.neutral.white,
  },

  // Opponent
  opponentContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  vsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    width: '100%',
  },
  vsLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  vsLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
    paddingHorizontal: spacing.base,
    letterSpacing: typography.letterSpacing.wider,
  },
  opponentName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },

  // Actions
  actionsContainer: {
    marginTop: spacing.sm,
  },
  actionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    marginBottom: spacing.base,
    textAlign: 'center',
    letterSpacing: typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  reportButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  winButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.success.dark,
    borderRadius: borderRadius.lg,
  },
  lossButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.error.dark,
    borderRadius: borderRadius.lg,
  },
  reportButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral.white,
  },
  drawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  drawButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  hintText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },

  // Bo3 Selector
  bo3Container: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  bo3Header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  bo3Title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  bo3Badge: {
    backgroundColor: '#3B82F6' + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#3B82F6' + '40',
  },
  bo3BadgeText: {
    fontSize: typography.fontSize['2xs'],
    fontWeight: typography.fontWeight.bold,
    color: '#3B82F6',
  },
  bo3Games: {
    gap: spacing.sm,
  },
  bo3GameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  bo3GameRowSelected: {
    borderColor: colors.primary.main + '40',
    backgroundColor: colors.primary.main + '08',
  },
  bo3GameRowDisabled: {
    opacity: 0.4,
  },
  bo3GameLabel: {
    width: 56,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.tertiary,
  },
  bo3ButtonsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  bo3Button: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
  },
  bo3ButtonSelectedWin: {
    backgroundColor: colors.success.dark,
  },
  bo3ButtonSelectedLoss: {
    backgroundColor: colors.error.dark,
  },
  bo3ButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
  bo3ButtonTextSelected: {
    color: colors.neutral.white,
  },
  bo3Preview: {
    marginTop: spacing.base,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  bo3PreviewComplete: {
    backgroundColor: colors.success.main + '15',
    borderWidth: 1,
    borderColor: colors.success.main + '30',
  },
  bo3PreviewIncomplete: {
    backgroundColor: colors.warning.main + '15',
    borderWidth: 1,
    borderColor: colors.warning.main + '30',
  },
  bo3PreviewTextComplete: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.success.main,
  },
  bo3PreviewTextIncomplete: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.warning.main,
  },
  bo3PreviewScore: {
    fontWeight: typography.fontWeight.bold,
  },
  bo3Actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.base,
  },
  bo3CancelButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  bo3CancelText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
  bo3SubmitButton: {
    flex: 2,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
  },
  bo3SubmitButtonDisabled: {
    backgroundColor: colors.primary.main + '50',
  },
  bo3SubmitText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral.white,
  },

  // Confirmation
  confirmationContainer: {
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warning.main + '20',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.base,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warning.main,
  },
  pendingText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.warning.main,
    letterSpacing: typography.letterSpacing.wide,
  },
  reportedResultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  reportedResult: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  reportedResultSmall: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.base,
    backgroundColor: colors.success.dark,
    borderRadius: borderRadius.lg,
  },
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral.white,
  },
  disputeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.base,
    backgroundColor: colors.background.highlight,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.error.main + '40',
  },
  disputeButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.error.main,
  },

  // Waiting
  waitingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  waitingText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.base,
    fontWeight: typography.fontWeight.medium,
  },

  // Confirmed
  confirmedContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.success.main + '10',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.success.main + '30',
  },
  confirmedIconContainer: {
    marginBottom: spacing.md,
  },
  confirmedText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.success.main,
    marginBottom: spacing.sm,
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  resultText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },

  // Bye
  byeContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary.main + '10',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary.main + '30',
  },
  byeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.primary.dark,
  },
  byeTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
    marginBottom: spacing.sm,
  },
  byeText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  byeSubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
