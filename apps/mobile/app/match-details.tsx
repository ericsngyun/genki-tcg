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
  const [loading, setLoading] = useState(true);
  const [dropping, setDropping] = useState(false);
  const [myUserId, setMyUserId] = useState<string>('');

  useEffect(() => {
    loadCurrentUser();
    loadActiveMatch();
  }, [eventId]);

  const loadCurrentUser = async () => {
    try {
      const data = await api.getMe();
      setMyUserId(data.user?.id || '');
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const loadActiveMatch = async () => {
    try {
      const data = await api.getActiveMatch(eventId);
      setActiveMatch(data);
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
            myUserId={myUserId}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
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
  },
  noMatchTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  noMatchText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.background.card,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.base,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  dropButton: {
    borderColor: theme.colors.error.main + '40',
    backgroundColor: theme.colors.background.elevated,
  },
});
