import { useEffect, useState } from 'react';
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
import { api } from '../lib/api';
import { theme } from '../lib/theme';

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
      console.error('Failed to load data:', error);
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
      console.error('Failed to load pairings:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
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
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
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
          <Text style={styles.title}>{event.name}</Text>
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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>{event.name}</Text>
        <Text style={styles.subtitle}>Round {selectedRound?.roundNumber}</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    padding: 20,
    backgroundColor: theme.colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.error.main,
    textAlign: 'center',
  },
  myPairingCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    margin: 16,
    padding: 20,
    borderWidth: 3,
    borderColor: theme.colors.primary.main,
    ...theme.shadows.lg,
  },
  myPairingLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.main,
    letterSpacing: 1,
    marginBottom: 12,
  },
  myPairingContent: {
    alignItems: 'center',
  },
  tableNumberBadge: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  tableNumberLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.lightest,
    textAlign: 'center',
    letterSpacing: 1,
  },
  tableNumber: {
    fontSize: 32,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.foreground,
    textAlign: 'center',
  },
  matchupContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  playerName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginVertical: 4,
  },
  vsText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    marginVertical: 8,
  },
  youLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.main,
  },
  byeLabel: {
    fontSize: theme.typography.fontSize.md,
    fontStyle: 'italic',
    color: theme.colors.text.tertiary,
  },
  resultContainer: {
    marginTop: 8,
  },
  resultText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
  resultCompleted: {
    color: theme.colors.success.main,
  },
  resultPending: {
    color: theme.colors.warning.main,
  },
  roundSelectorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  roundButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.base,
    marginRight: 8,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
  },
  roundButtonActive: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  roundButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  roundButtonTextActive: {
    color: theme.colors.primary.foreground,
  },
  allPairingsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  pairingCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  pairingCardHighlight: {
    borderWidth: 2,
    borderColor: theme.colors.primary.main,
  },
  pairingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pairingTable: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  pairingStatus: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
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
    marginBottom: 8,
  },
  pairingPlayer: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    flex: 1,
  },
  pairingVs: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginHorizontal: 8,
  },
  pairingResult: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  youBadge: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.main,
  },
});
