import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../lib/api';
import { theme } from '../lib/theme';
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates';
import { logger } from '../lib/logger';

interface Pairing {
  id: string;
  tableNumber: number;
  playerA: {
    id: string;
    name: string;
  };
  playerB?: {
    id: string;
    name: string;
  };
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
  rounds: Round[];
}

export default function PairingsScreen() {
  const params = useLocalSearchParams();
  const eventId = params.eventId as string;
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId]);

  useEffect(() => {
    if (selectedRoundId) {
      loadPairings(selectedRoundId);
    }
  }, [selectedRoundId]);

  // Real-time updates: Auto-refresh when new rounds are posted
  useRealtimeUpdates({
    eventId,
    onPairingsPosted: useCallback((roundNumber: number) => {
      logger.debug(`New round ${roundNumber} pairings posted`);
      // Reload event data to get new round
      loadData();
      // Show notification
      Alert.alert(
        'New Round!',
        `Round ${roundNumber} pairings are now available`,
        [{ text: 'OK' }]
      );
    }, []),
    onRoundStarted: useCallback((roundNumber: number) => {
      logger.debug(`Round ${roundNumber} started`);
      loadPairings(selectedRoundId || '');
    }, [selectedRoundId]),
  });

  const loadData = async () => {
    try {
      // Load user data
      const userData = await api.getMe();
      setMyUserId(userData.user.id);

      // Load event
      const eventData = await api.getEvent(eventId);
      setEvent(eventData);

      // Select the latest round
      if (eventData.rounds.length > 0) {
        const latestRound = eventData.rounds[eventData.rounds.length - 1];
        setSelectedRoundId(latestRound.id);
      }
    } catch (error) {
      logger.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadPairings = async (roundId: string) => {
    try {
      const data = await api.getPairings(roundId);
      setPairings(data);
    } catch (error) {
      logger.error('Failed to load pairings:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleBack = () => {
    // Check if we can dismiss (for modals) or go back
    // If neither works, navigate to events tab as fallback
    if (typeof (router as any).canDismiss === 'function' && (router as any).canDismiss()) {
      router.dismiss();
    } else if (typeof (router as any).canGoBack === 'function' && (router as any).canGoBack()) {
      router.back();
    } else {
      // No screen to go back to - navigate to events tab
      router.replace('/(tabs)/events');
    }
  };

  const getMyPairing = () => {
    if (!myUserId) return null;
    return pairings.find(
      (p) => p.playerA.id === myUserId || p.playerB?.id === myUserId
    );
  };

  const formatResult = (pairing: Pairing) => {
    if (!pairing.result) return 'In Progress';

    const resultMap: Record<string, string> = {
      PLAYER_A_WIN: `${pairing.playerA.name} Wins`,
      PLAYER_B_WIN: `${pairing.playerB?.name || 'Unknown'} Wins`,
      DRAW: 'Draw',
      INTENTIONAL_DRAW: 'Intentional Draw',
    };

    const resultText = resultMap[pairing.result] || pairing.result;
    const score =
      pairing.gamesWonA !== undefined
        ? ` (${pairing.gamesWonA}-${pairing.gamesWonB})`
        : '';

    return resultText + score;
  };

  if (loading) {
    return (
      <View style={styles.mainContainer}>
        <LinearGradient
          colors={[theme.colors.background.primary, '#1a1a2e']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        </View>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  if (event.rounds.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>{event.name}</Text>
            <Text style={styles.subtitle}>Pairings</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No rounds posted yet</Text>
          <Text style={styles.emptySubtext}>
            Pairings will appear here once the tournament starts
          </Text>
        </View>
      </ScrollView>
    );
  }

  const myPairing = getMyPairing();
  const selectedRound = event.rounds.find((r) => r.id === selectedRoundId);

  const handleReportResult = () => {
    router.push({
      pathname: '/match-details',
      params: {
        eventId,
        eventName: event.name,
        gameType: event.game,
      },
    });
  };

  return (
    <View style={styles.mainContainer}>
      <LinearGradient
        colors={[theme.colors.background.primary, '#1a1a2e']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary.main} />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>{event.name}</Text>
            <Text style={styles.subtitle}>Round {selectedRound?.roundNumber}</Text>
          </View>
        </View>

        {/* My Pairing Highlight */}
        {myPairing && (
          <View style={styles.myPairingCard}>
            <Text style={styles.myPairingLabel}>Your Match</Text>
            <View style={styles.myPairingContent}>
              <View style={styles.tableNumberBadge}>
                <Text style={styles.tableNumberLabel}>TABLE</Text>
                <Text style={styles.tableNumber}>{myPairing.tableNumber}</Text>
              </View>
              <View style={styles.matchupContainer}>
                <Text style={styles.playerName}>
                  {myPairing.playerA.id === myUserId ? (
                    <Text style={styles.youLabel}>YOU</Text>
                  ) : (
                    myPairing.playerA.name
                  )}
                </Text>
                <Text style={styles.vsText}>vs</Text>
                <Text style={styles.playerName}>
                  {!myPairing.playerB ? (
                    <Text style={styles.byeLabel}>— BYE —</Text>
                  ) : myPairing.playerB.id === myUserId ? (
                    <Text style={styles.youLabel}>YOU</Text>
                  ) : (
                    myPairing.playerB.name
                  )}
                </Text>
              </View>
              <View style={styles.resultContainer}>
                <Text
                  style={[
                    styles.resultText,
                    myPairing.result ? styles.resultCompleted : styles.resultPending,
                  ]}
                >
                  {formatResult(myPairing)}
                </Text>
              </View>

              {/* Report Result Button */}
              {!myPairing.result && myPairing.playerB && (
                <TouchableOpacity
                  style={styles.reportResultButton}
                  onPress={handleReportResult}
                >
                  <Ionicons name="create" size={20} color={theme.colors.primary.foreground} />
                  <Text style={styles.reportResultButtonText}>Report Result</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Round Selector */}
        {event.rounds.length > 1 && (
          <View style={styles.roundSelectorContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {event.rounds.map((round) => (
                <TouchableOpacity
                  key={round.id}
                  onPress={() => setSelectedRoundId(round.id)}
                  style={[
                    styles.roundButton,
                    selectedRoundId === round.id && styles.roundButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.roundButtonText,
                      selectedRoundId === round.id && styles.roundButtonTextActive,
                    ]}
                  >
                    Round {round.roundNumber}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* All Pairings */}
        <View style={styles.allPairingsContainer}>
          <Text style={styles.sectionTitle}>All Pairings</Text>
          {pairings.length === 0 ? (
            <Text style={styles.emptyText}>No pairings yet</Text>
          ) : (
            pairings.map((pairing) => (
              <View
                key={pairing.id}
                style={[
                  styles.pairingCard,
                  (pairing.playerA.id === myUserId ||
                    pairing.playerB?.id === myUserId) &&
                  styles.pairingCardHighlight,
                ]}
              >
                <View style={styles.pairingHeader}>
                  <Text style={styles.pairingTable}>Table {pairing.tableNumber}</Text>
                  <Text
                    style={[
                      styles.pairingStatus,
                      pairing.result
                        ? styles.pairingStatusCompleted
                        : styles.pairingStatusPending,
                    ]}
                  >
                    {pairing.result ? '✓ Complete' : '⏱ In Progress'}
                  </Text>
                </View>
                <View style={styles.pairingMatchup}>
                  <Text style={styles.pairingPlayer}>
                    {pairing.playerA.name}
                    {pairing.playerA.id === myUserId && (
                      <Text style={styles.youBadge}> (You)</Text>
                    )}
                  </Text>
                  <Text style={styles.pairingVs}>vs</Text>
                  <Text style={styles.pairingPlayer}>
                    {pairing.playerB ? (
                      <>
                        {pairing.playerB.name}
                        {pairing.playerB.id === myUserId && (
                          <Text style={styles.youBadge}> (You)</Text>
                        )}
                      </>
                    ) : (
                      <Text style={styles.byeLabel}>— BYE —</Text>
                    )}
                  </Text>
                </View>
                {pairing.result && (
                  <Text style={styles.pairingResult}>{formatResult(pairing)}</Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: 'transparent', // Make transparent for gradient
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)', // Subtle border
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.elevated,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
    fontWeight: theme.typography.fontWeight.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.error.main,
    textAlign: 'center',
    marginTop: 20,
  },
  myPairingCard: {
    backgroundColor: 'rgba(24, 24, 27, 0.7)', // Glassmorphism
    borderRadius: theme.borderRadius.xl,
    margin: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)', // Subtle primary border
    ...theme.shadows.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  myPairingLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.main,
    letterSpacing: 1.5,
    marginBottom: 20,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  myPairingContent: {
    alignItems: 'center',
  },
  tableNumberBadge: {
    backgroundColor: theme.colors.primary.lightest,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.primary.light,
  },
  tableNumberLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.dark,
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  tableNumber: {
    fontSize: 40,
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.primary.main,
    textAlign: 'center',
    lineHeight: 48,
  },
  matchupContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  playerName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginVertical: 4,
    textAlign: 'center',
  },
  vsText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.tertiary,
    marginVertical: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  youLabel: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.main,
  },
  byeLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontStyle: 'italic',
    color: theme.colors.text.tertiary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  resultContainer: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.elevated,
  },
  resultText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultCompleted: {
    color: theme.colors.success.main,
  },
  resultPending: {
    color: theme.colors.warning.main,
  },
  roundSelectorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  roundButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: theme.colors.background.elevated,
    borderRadius: theme.borderRadius.full,
    marginRight: 10,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  roundButtonActive: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
    ...theme.shadows.md,
  },
  roundButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  roundButtonTextActive: {
    color: theme.colors.primary.foreground,
    fontWeight: theme.typography.fontWeight.bold,
  },
  allPairingsContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 16,
    marginLeft: 4,
  },
  pairingCard: {
    backgroundColor: 'rgba(24, 24, 27, 0.6)', // Glassmorphism
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    ...theme.shadows.sm,
  },
  pairingCardHighlight: {
    borderWidth: 2,
    borderColor: theme.colors.primary.main,
    backgroundColor: theme.colors.primary.lightest + '20', // Very transparent primary bg
  },
  pairingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  pairingTable: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pairingStatus: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pairingStatusCompleted: {
    color: theme.colors.success.main,
  },
  pairingStatusPending: {
    color: theme.colors.warning.main,
  },
  pairingMatchup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pairingPlayer: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  pairingVs: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginHorizontal: 12,
    fontWeight: theme.typography.fontWeight.bold,
  },
  pairingResult: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  youBadge: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.main,
  },
  reportResultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary.main,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: theme.borderRadius.full,
    marginTop: 24,
    width: '100%',
    ...theme.shadows.md,
  },
  reportResultButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.foreground,
  },
});
