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
        <ActivityIndicator size="large" color="#4F46E5" />
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
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#4F46E5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E7FF',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  myStandingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 16,
    padding: 20,
    borderWidth: 3,
    borderColor: '#4F46E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  myStandingLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
    letterSpacing: 1,
    marginBottom: 12,
  },
  myStandingContent: {
    alignItems: 'center',
  },
  rankBadge: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  rankLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E0E7FF',
    textAlign: 'center',
    letterSpacing: 1,
  },
  rankNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  standingsContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  headerCell: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableRowHighlight: {
    backgroundColor: '#EEF2FF',
  },
  tableRowDropped: {
    opacity: 0.5,
  },
  cell: {
    fontSize: 13,
    color: '#1F2937',
  },
  rankCell: {
    width: 50,
  },
  rankText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  playerCell: {
    flex: 1,
  },
  playerText: {
    fontWeight: '600',
  },
  playerTextMe: {
    color: '#4F46E5',
  },
  pointsCell: {
    width: 40,
  },
  pointsText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  recordCell: {
    width: 60,
  },
  recordText: {
    textAlign: 'center',
    fontSize: 11,
  },
  tieCell: {
    width: 55,
  },
  tieText: {
    textAlign: 'right',
    fontSize: 11,
  },
  youBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  droppedBadge: {
    fontSize: 10,
    color: '#EF4444',
    marginTop: 2,
  },
  footer: {
    padding: 16,
    marginBottom: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
