import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api } from '../lib/api';
import { theme } from '../lib/theme';

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
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId]);

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
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
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

  if (standings.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>{event.name}</Text>
          <Text style={styles.subtitle}>Standings</Text>
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
        <Text style={styles.title}>{event.name}</Text>
        <Text style={styles.subtitle}>Standings</Text>
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
                getRankDisplay(myStanding.rank).includes('🥇') ? (
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
            <View style={[styles.cell, styles.playerCell]}>
              <Text
                style={[
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
  myStandingCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    margin: 16,
    padding: 20,
    borderWidth: 3,
    borderColor: theme.colors.primary.main,
    ...theme.shadows.lg,
  },
  myStandingLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.main,
    letterSpacing: 1,
    marginBottom: 12,
  },
  myStandingContent: {
    alignItems: 'center',
  },
  rankBadge: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  rankLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.lightest,
    textAlign: 'center',
    letterSpacing: 1,
  },
  rankNumber: {
    fontSize: 32,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.foreground,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    minWidth: '45%',
    marginBottom: 12,
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
  },
  standingsContainer: {
    backgroundColor: theme.colors.background.card,
    margin: 16,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.elevated,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
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
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  tableRowHighlight: {
    backgroundColor: theme.colors.primary.lightest,
  },
  tableRowDropped: {
    opacity: 0.5,
  },
  cell: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  rankCell: {
    width: 50,
  },
  rankText: {
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
  },
  playerCell: {
    flex: 1,
  },
  playerText: {
    fontWeight: theme.typography.fontWeight.semibold,
  },
  playerTextMe: {
    color: theme.colors.primary.main,
  },
  pointsCell: {
    width: 40,
  },
  pointsText: {
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
  },
  recordCell: {
    width: 60,
  },
  recordText: {
    textAlign: 'center',
    fontSize: theme.typography.fontSize.xs,
  },
  tieCell: {
    width: 55,
  },
  tieText: {
    textAlign: 'right',
    fontSize: theme.typography.fontSize.xs,
  },
  youBadge: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.main,
  },
  droppedBadge: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.error.main,
    marginTop: 2,
  },
  footer: {
    padding: 16,
    marginBottom: 32,
  },
  footerText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
});
