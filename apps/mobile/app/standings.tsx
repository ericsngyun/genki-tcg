import { useEffect, useState, useCallback } from 'react';
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
import { api } from '../lib/api';
import { theme } from '../lib/theme';
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates';

import { logger } from '../lib/logger';
interface Standing {
  userId: string;
  userName: string;
  rank: number;
  points: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  omwPercent: number;
  gwPercent: number;
  oomwPercent: number;
  receivedBye: boolean;
  isDropped: boolean;
}

interface Event {
  id: string;
  name: string;
  game: string;
  format: string;
}

export default function StandingsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId]);

  // Real-time updates with optimized performance
  useRealtimeUpdates({
    eventId,
    onStandingsUpdated: useCallback(() => {
      logger.debug('Standings updated - refreshing');
      loadData();
    }, []),
    onTournamentCompleted: useCallback(() => {
      logger.debug('Tournament completed');
      loadData();
      Alert.alert(
        'Tournament Complete! 🏆',
        'The tournament has finished. Check the final standings below.',
        [{ text: 'OK' }]
      );
    }, []),
  });

  const loadData = async () => {
    try {
      // Load user data
      const userData = await api.getMe();
      setMyUserId(userData.user.id);

      // Load event
      const eventData = await api.getEvent(eventId);
      setEvent(eventData);

      // Load standings
      const standingsData = await api.getStandings(eventId);
      setStandings(standingsData);
    } catch (error) {
      logger.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const getMyStanding = () => {
    if (!myUserId) return null;
    return standings.find((s) => s.userId === myUserId);
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
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

  if (standings.length === 0) {
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
            <Text style={styles.subtitle}>Standings</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No standings yet</Text>
          <Text style={styles.emptySubtext}>
            Standings will appear after the first round completes
          </Text>
        </View>
      </ScrollView>
    );
  }

  const myStanding = getMyStanding();

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
          <Text style={styles.subtitle}>Standings</Text>
        </View>
      </View>

      {/* My Standing Highlight */}
      {myStanding && (
        <View style={styles.myStandingCard}>
          <Text style={styles.myStandingLabel}>Your Standing</Text>
          <View style={styles.myStandingContent}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankLabel}>RANK</Text>
              <Text style={styles.rankNumber}>
                {typeof getRankDisplay(myStanding.rank) === 'string' &&
                  String(getRankDisplay(myStanding.rank)).includes('🥇') ? (
                  <Text style={{ fontSize: 48 }}>
                    {getRankDisplay(myStanding.rank)}
                  </Text>
                ) : (
                  getRankDisplay(myStanding.rank)
                )}
              </Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{myStanding.points}</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {myStanding.matchWins}-{myStanding.matchLosses}-
                  {myStanding.matchDraws}
                </Text>
                <Text style={styles.statLabel}>Record</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {(myStanding.omwPercent * 100).toFixed(1)}%
                </Text>
                <Text style={styles.statLabel}>OMW%</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {(myStanding.gwPercent * 100).toFixed(1)}%
                </Text>
                <Text style={styles.statLabel}>GW%</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {(myStanding.oomwPercent * 100).toFixed(1)}%
                </Text>
                <Text style={styles.statLabel}>OOMW%</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* All Standings */}
      <View style={styles.standingsContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.rankCell]}>Rank</Text>
          <Text style={[styles.headerCell, styles.playerCell]}>Player</Text>
          <Text style={[styles.headerCell, styles.pointsCell]}>Pts</Text>
          <Text style={[styles.headerCell, styles.recordCell]}>Record</Text>
          <Text style={[styles.headerCell, styles.tieCell]}>OMW%</Text>
        </View>
        {standings.map((standing) => (
          <View
            key={standing.userId}
            style={[
              styles.tableRow,
              standing.userId === myUserId && styles.tableRowHighlight,
              standing.isDropped && styles.tableRowDropped,
            ]}
          >
            <Text style={[styles.cell, styles.rankCell, styles.rankText]}>
              {getRankDisplay(standing.rank)}
            </Text>
            <View style={styles.playerCell}>
              <Text
                style={[
                  styles.cell,
                  styles.playerText,
                  standing.userId === myUserId && styles.playerTextMe,
                ]}
                numberOfLines={1}
              >
                {standing.userName}
                {standing.userId === myUserId && (
                  <Text style={styles.youBadge}> (You)</Text>
                )}
              </Text>
              {standing.isDropped && (
                <Text style={styles.droppedBadge}>Dropped</Text>
              )}
            </View>
            <Text style={[styles.cell, styles.pointsCell, styles.pointsText]}>
              {standing.points}
            </Text>
            <Text style={[styles.cell, styles.recordCell, styles.recordText]}>
              {standing.matchWins}-{standing.matchLosses}-{standing.matchDraws}
            </Text>
            <Text style={[styles.cell, styles.tieCell, styles.tieText]}>
              {(standing.omwPercent * 100).toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Standings are calculated using Swiss pairing tiebreakers
        </Text>
        <Text style={styles.footerSubtext}>
          Points: Win=3, Draw=1, Loss=0 • Tiebreakers: OMW%, GW%, OGW%, OOMW%
        </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
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
    backgroundColor: theme.colors.background.primary,
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
  myStandingCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    margin: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.primary.main + '40',
    ...theme.shadows.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  myStandingLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.main,
    letterSpacing: 1.5,
    marginBottom: 20,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  myStandingContent: {
    alignItems: 'center',
  },
  rankBadge: {
    backgroundColor: theme.colors.primary.lightest,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.primary.light,
    minWidth: 120,
    alignItems: 'center',
  },
  rankLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.dark,
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  rankNumber: {
    fontSize: 40,
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.primary.main,
    textAlign: 'center',
    lineHeight: 48,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
    width: '48%', // 2 columns
    backgroundColor: theme.colors.background.elevated,
    padding: 12,
    borderRadius: theme.borderRadius.md,
  },
  statValue: {
    fontSize: 20,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  standingsContainer: {
    backgroundColor: theme.colors.background.card,
    margin: 16,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.sm,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.elevated,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.main,
  },
  headerCell: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  tableRowHighlight: {
    backgroundColor: theme.colors.primary.lightest + '10',
  },
  tableRowDropped: {
    opacity: 0.5,
    backgroundColor: theme.colors.background.primary,
  },
  cell: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  rankCell: {
    width: 40,
    textAlign: 'center',
  },
  rankText: {
    fontWeight: theme.typography.fontWeight.bold,
  },
  playerCell: {
    flex: 1,
    paddingHorizontal: 8,
  },
  playerText: {
    fontWeight: theme.typography.fontWeight.semibold,
    fontSize: theme.typography.fontSize.base,
  },
  playerTextMe: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.fontWeight.bold,
  },
  pointsCell: {
    width: 40,
    textAlign: 'center',
  },
  pointsText: {
    fontWeight: theme.typography.fontWeight.bold,
  },
  recordCell: {
    width: 60,
    textAlign: 'center',
  },
  recordText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  tieCell: {
    width: 50,
    textAlign: 'right',
  },
  tieText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    fontVariant: ['tabular-nums'],
  },
  youBadge: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.main,
  },
  droppedBadge: {
    fontSize: 10,
    color: theme.colors.error.main,
    marginTop: 2,
    fontWeight: theme.typography.fontWeight.medium,
  },
  footer: {
    padding: 20,
    marginBottom: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: theme.typography.fontWeight.medium,
  },
  footerSubtext: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    maxWidth: '80%',
  },
});
