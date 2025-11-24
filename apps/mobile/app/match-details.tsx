import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../lib/api';
import { ActiveMatchCard } from '../components';
import { theme } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ActiveMatch {
  match: {
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
  } | null;
}

export default function MatchDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const eventName = params.eventName as string;
  const gameType = params.gameType as 'ONE_PIECE_TCG' | 'AZUKI_TCG' | 'RIFTBOUND';

  const [activeMatch, setActiveMatch] = useState<ActiveMatch | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropping, setDropping] = useState(false);

  useEffect(() => {
    loadActiveMatch();
  }, [eventId]);

  const loadActiveMatch = async () => {
    try {
      const [matchData, userData] = await Promise.all([
        api.getActiveMatch(eventId),
        api.getMe(),
      ]);
      setActiveMatch(matchData);
      setMyUserId(userData.user.id);
    } catch (error) {
      console.error('Failed to load active match:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = () => {
    Alert.alert(
      'Drop from Tournament',
      'Are you sure you want to drop from this tournament? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Drop',
          style: 'destructive',
          onPress: async () => {
            setDropping(true);
            try {
              await api.dropFromEvent(eventId);
              Alert.alert(
                'Dropped',
                'You have been dropped from the tournament.',
                [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to drop from tournament');
            } finally {
              setDropping(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{eventName}</Text>
            <Text style={styles.headerSubtitle}>Match Details</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <LinearGradient
        colors={[theme.colors.background.primary, '#1a1a2e']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{eventName}</Text>
            <Text style={styles.headerSubtitle}>Match Details</Text>
          </View>
        </View>

        {activeMatch?.match ? (
          <>
            <ActiveMatchCard
              eventId={eventId}
              match={activeMatch.match}
              onMatchUpdate={loadActiveMatch}
              gameType={gameType}
              myUserId={myUserId || ''}
            />

            {/* Additional Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  router.push({
                    pathname: '/pairings',
                    params: { eventId },
                  })
                }
              >
                <Ionicons name="list" size={20} color={theme.colors.text.primary} />
                <Text style={styles.actionButtonText}>View All Pairings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  router.push({
                    pathname: '/standings',
                    params: { eventId },
                  })
                }
              >
                <Ionicons name="trophy" size={20} color={theme.colors.text.primary} />
                <Text style={styles.actionButtonText}>View Standings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.dropButton]}
                onPress={handleDrop}
                disabled={dropping}
              >
                {dropping ? (
                  <ActivityIndicator color={theme.colors.error.main} />
                ) : (
                  <>
                    <Ionicons name="exit" size={20} color={theme.colors.error.main} />
                    <Text style={[styles.actionButtonText, { color: theme.colors.error.main }]}>
                      Drop from Tournament
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.noMatchContainer}>
            <Ionicons name="information-circle" size={64} color={theme.colors.text.tertiary} />
            <Text style={styles.noMatchTitle}>No Active Match</Text>
            <Text style={styles.noMatchText}>
              You don't have an active match right now. Check back when the next round starts.
            </Text>

            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  router.push({
                    pathname: '/standings',
                    params: { eventId },
                  })
                }
              >
                <Ionicons name="trophy" size={20} color={theme.colors.text.primary} />
                <Text style={styles.actionButtonText}>View Standings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.dropButton]}
                onPress={handleDrop}
                disabled={dropping}
              >
                {dropping ? (
                  <ActivityIndicator color={theme.colors.error.main} />
                ) : (
                  <>
                    <Ionicons name="exit" size={20} color={theme.colors.error.main} />
                    <Text style={[styles.actionButtonText, { color: theme.colors.error.main }]}>
                      Drop from Tournament
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
    fontWeight: theme.typography.fontWeight.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noMatchContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    flex: 1,
    justifyContent: 'center',
  },
  noMatchTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: 24,
    marginBottom: 12,
  },
  noMatchText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
  },
  actionsContainer: {
    padding: 24,
    gap: 16,
    width: '100%',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: theme.colors.background.card,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.sm,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  dropButton: {
    borderColor: theme.colors.error.light,
    backgroundColor: theme.colors.error.lightest + '40',
    marginTop: 20,
  },
});
