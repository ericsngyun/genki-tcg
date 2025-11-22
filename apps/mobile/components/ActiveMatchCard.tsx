import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../lib/theme';
import { api } from '../lib/api';
import { Ionicons } from '@expo/vector-icons';

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

  const isBo3 = gameType === 'RIFTBOUND';
  const iReported = match.reportedBy !== null;
  // FIX: Check if opponent reported (not me) - was incorrectly always true when iReported was true
  const iAmTheReporter = match.reportedBy === myUserId;
  const opponentReported = iReported && !iAmTheReporter;
  const waitingForConfirmation = iReported && !match.confirmedBy;
  const matchConfirmed = match.confirmedBy !== null;

  // Bo3 score validation helper
  const validateBo3Score = (myGames: number, oppGames: number, isWin: boolean): string | null => {
    // Check for negative numbers
    if (myGames < 0 || oppGames < 0) {
      return 'Game scores cannot be negative';
    }
    // Check max games in Bo3 (first to 2)
    if (myGames > 2 || oppGames > 2) {
      return 'Maximum games in Bo3 is 2';
    }
    // Check for impossible scores like 2-2
    if (myGames === 2 && oppGames === 2) {
      return 'Invalid score: both players cannot win 2 games in Bo3';
    }
    // Check that winner has 2 wins
    if (isWin && myGames !== 2) {
      return 'You must have won 2 games to report a win';
    }
    if (!isWin && oppGames !== 2) {
      return 'Opponent must have won 2 games to report a loss';
    }
    // Total games should be valid (2, 3)
    const totalGames = myGames + oppGames;
    if (totalGames < 2 || totalGames > 3) {
      return 'Invalid score: total games must be 2 or 3';
    }
    return null;
  };

  const handleReportWin = async () => {
    if (isBo3) {
      // For Bo3, show game entry UI
      Alert.prompt(
        'Report Games Won',
        'Enter games won (e.g., "2-1" or "2-0" for your victory)',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit',
            onPress: async (score) => {
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

              // Validate Bo3 score
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
      // For 1v1, simple win
      await reportResult(
        match.iAmPlayerA ? 'PLAYER_A_WIN' : 'PLAYER_B_WIN',
        match.iAmPlayerA ? 1 : 0,
        match.iAmPlayerA ? 0 : 1
      );
    }
  };

  const handleReportLoss = async () => {
    if (isBo3) {
      Alert.prompt(
        'Report Games Won',
        'Enter games won (e.g., "1-2" or "0-2" for your loss)',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit',
            onPress: async (score) => {
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

              // Validate Bo3 score for a loss
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
      // For 1v1, simple loss
      await reportResult(
        match.iAmPlayerA ? 'PLAYER_B_WIN' : 'PLAYER_A_WIN',
        match.iAmPlayerA ? 0 : 1,
        match.iAmPlayerA ? 1 : 0
      );
    }
  };

  const handleReportDraw = async () => {
    await reportResult('DRAW', 0, 0);
  };

  const reportResult = async (result: string, gamesWonA: number, gamesWonB: number) => {
    setReporting(true);
    try {
      await api.reportMatchResult(match.id, result, gamesWonA, gamesWonB);
      Alert.alert('Success', 'Match result reported. Waiting for opponent confirmation.');
      onMatchUpdate();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to report result');
    } finally {
      setReporting(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await api.confirmMatchResult(match.id, true);
      Alert.alert('Success', 'Match result confirmed!');
      onMatchUpdate();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to confirm result');
    } finally {
      setConfirming(false);
    }
  };

  const handleDispute = () => {
    Alert.alert(
      'Dispute Result',
      'Do you want to submit a different result?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Different Result',
          onPress: () => {
            // This will show the same UI as reporting
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

  // Determine what to show
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

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="trophy" size={24} color={theme.colors.primary.main} />
          <Text style={styles.headerTitle}>Active Match</Text>
        </View>
        <View style={styles.roundBadge}>
          <Text style={styles.roundText}>Round {match.roundNumber}</Text>
        </View>
      </View>

      {/* Table Number */}
      <View style={styles.tableContainer}>
        <Text style={styles.tableLabel}>TABLE</Text>
        <Text style={styles.tableNumber}>{match.tableNumber}</Text>
      </View>

      {/* Opponent */}
      <View style={styles.opponentContainer}>
        <Text style={styles.vsLabel}>vs</Text>
        <Text style={styles.opponentName}>
          {match.opponent ? match.opponent.name : '— BYE —'}
        </Text>
      </View>

      {/* Match Status & Actions */}
      {matchConfirmed ? (
        <View style={styles.confirmedContainer}>
          <Ionicons name="checkmark-circle" size={48} color={theme.colors.success.main} />
          <Text style={styles.confirmedText}>Match Confirmed</Text>
          <Text style={styles.resultText}>{getResultDisplay()}</Text>
        </View>
      ) : waitingForConfirmation ? (
        opponentReported ? (
          // Opponent reported, I need to confirm
          <View style={styles.confirmationContainer}>
            <View style={styles.pendingBadge}>
              <Ionicons name="time" size={20} color={theme.colors.warning.main} />
              <Text style={styles.pendingText}>Opponent Reported Result</Text>
            </View>
            <Text style={styles.reportedResult}>{getResultDisplay()}</Text>

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={handleConfirm}
                disabled={confirming}
              >
                {confirming ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Confirm</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.disputeButton]}
                onPress={handleDispute}
                disabled={confirming}
              >
                <Ionicons name="close" size={20} color={theme.colors.error.main} />
                <Text style={[styles.buttonText, { color: theme.colors.error.main }]}>
                  Dispute
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // I reported, waiting for opponent
          <View style={styles.waitingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
            <Text style={styles.waitingText}>Waiting for opponent confirmation...</Text>
            <Text style={styles.reportedResult}>{getResultDisplay()}</Text>
          </View>
        )
      ) : (
        // No result reported yet - show report buttons
        <View style={styles.actionsContainer}>
          <Text style={styles.actionLabel}>Report Match Result:</Text>

          <View style={styles.reportButtons}>
            <TouchableOpacity
              style={[styles.reportButton, styles.winButton]}
              onPress={handleReportWin}
              disabled={reporting}
            >
              {reporting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="trophy" size={24} color="#fff" />
                  <Text style={styles.reportButtonText}>I Won</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.reportButton, styles.lossButton]}
              onPress={handleReportLoss}
              disabled={reporting}
            >
              {reporting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="close-circle" size={24} color="#fff" />
                  <Text style={styles.reportButtonText}>I Lost</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.reportButton, styles.drawButton]}
            onPress={handleReportDraw}
            disabled={reporting}
          >
            <Ionicons name="remove-circle" size={20} color={theme.colors.text.primary} />
            <Text style={[styles.reportButtonText, { color: theme.colors.text.primary }]}>
              Draw
            </Text>
          </TouchableOpacity>

          {isBo3 && (
            <Text style={styles.hintText}>
              You'll enter game scores after selecting win/loss
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary.main,
    ...theme.shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  roundBadge: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.base,
  },
  roundText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary.foreground,
  },
  tableContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  tableLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.secondary,
    letterSpacing: 1,
  },
  tableNumber: {
    fontSize: 48,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.main,
  },
  opponentContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  vsLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    marginBottom: 8,
  },
  opponentName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  actionsContainer: {
    marginTop: 8,
  },
  actionLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  reportButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  reportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.base,
  },
  winButton: {
    backgroundColor: theme.colors.success.main,
  },
  lossButton: {
    backgroundColor: theme.colors.error.main,
  },
  drawButton: {
    backgroundColor: theme.colors.background.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  reportButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary.foreground,
  },
  hintText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  confirmationContainer: {
    alignItems: 'center',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.warning.lightest,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.base,
    marginBottom: 16,
  },
  pendingText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.warning.main,
  },
  reportedResult: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.base,
  },
  confirmButton: {
    backgroundColor: theme.colors.success.main,
  },
  disputeButton: {
    backgroundColor: theme.colors.background.elevated,
    borderWidth: 1,
    borderColor: theme.colors.error.main,
  },
  buttonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary.foreground,
  },
  waitingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  waitingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  confirmedContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  confirmedText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.success.main,
    marginTop: 12,
    marginBottom: 8,
  },
  resultText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
});
