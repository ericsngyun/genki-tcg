import React, { useState, useCallback } from 'react';
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

export function ActiveMatchCard({ eventId, match, onMatchUpdate, gameType, myUserId }: ActiveMatchCardProps) {
  const [reporting, setReporting] = useState(false);
  const [confirming, setConfirming] = useState(false);

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

  // Bo3 score validation helper
  const validateBo3Score = (myGames: number, oppGames: number, isWin: boolean): string | null => {
    if (myGames < 0 || oppGames < 0) {
      return 'Game scores cannot be negative';
    }
    if (myGames > 2 || oppGames > 2) {
      return 'Maximum games in Bo3 is 2';
    }
    if (myGames === 2 && oppGames === 2) {
      return 'Invalid score: both players cannot win 2 games in Bo3';
    }
    if (isWin && myGames !== 2) {
      return 'You must have won 2 games to report a win';
    }
    if (!isWin && oppGames !== 2) {
      return 'Opponent must have won 2 games to report a loss';
    }
    const totalGames = myGames + oppGames;
    if (totalGames < 2 || totalGames > 3) {
      return 'Invalid score: total games must be 2 or 3';
    }
    return null;
  };

  const handleReportWin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isBo3) {
      Alert.prompt(
        'Report Games Won',
        'Enter games won (e.g., "2-1" or "2-0" for your victory)',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit',
            onPress: async (score?: string) => {
              if (!score) return;
              const parts = score.trim().split('-');
              if (parts.length !== 2) {
                Alert.alert('Invalid format', 'Please enter score like "2-1"');
                return;
              }
              const myGames = parseInt(parts[0]);
              const oppGames = parseInt(parts[1]);

              if (isNaN(myGames) || isNaN(oppGames)) {
                Alert.alert('Invalid format', 'Please enter valid numbers');
                return;
              }

              const validationError = validateBo3Score(myGames, oppGames, true);
              if (validationError) {
                Alert.alert('Invalid Score', validationError);
                return;
              }

              await reportResult(
                match.iAmPlayerA ? 'PLAYER_A_WIN' : 'PLAYER_B_WIN',
                match.iAmPlayerA ? myGames : oppGames,
                match.iAmPlayerA ? oppGames : myGames
              );
            },
          },
        ],
        'plain-text'
      );
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
      Alert.prompt(
        'Report Games Won',
        'Enter games won (e.g., "1-2" or "0-2" for your loss)',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit',
            onPress: async (score?: string) => {
              if (!score) return;
              const parts = score.trim().split('-');
              if (parts.length !== 2) {
                Alert.alert('Invalid format', 'Please enter score like "1-2"');
                return;
              }
              const myGames = parseInt(parts[0]);
              const oppGames = parseInt(parts[1]);

              if (isNaN(myGames) || isNaN(oppGames)) {
                Alert.alert('Invalid format', 'Please enter valid numbers');
                return;
              }

              const validationError = validateBo3Score(myGames, oppGames, false);
              if (validationError) {
                Alert.alert('Invalid Score', validationError);
                return;
              }

              await reportResult(
                match.iAmPlayerA ? 'PLAYER_B_WIN' : 'PLAYER_A_WIN',
                match.iAmPlayerA ? myGames : oppGames,
                match.iAmPlayerA ? oppGames : myGames
              );
            },
          },
        ],
        'plain-text'
      );
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
            <Text style={styles.waitingText}>Submitting result...</Text>
            <Text style={styles.reportedResultSmall}>{getResultDisplay()}</Text>
          </View>
        )
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
                You'll enter game scores after selecting win/loss
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
