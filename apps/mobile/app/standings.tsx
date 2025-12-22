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
import * as Haptics from 'expo-haptics';
import { api } from '../lib/api';
import { colors, spacing, typography, borderRadius } from '../lib/theme';
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

  useRealtimeUpdates({
    eventId,
    onStandingsUpdated: useCallback(() => {
      loadData();
    }, []),
    onTournamentCompleted: useCallback(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadData();
      Alert.alert('Tournament Complete!', 'The tournament has finished. Check the final standings below.');
    }, []),
  });

  const loadData = async () => {
    try {
      const userData = await api.getMe();
      setMyUserId(userData.user.id);
      const eventData = await api.getEvent(eventId);
      setEvent(eventData);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    loadData();
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/events');
    }
  };

  const myStanding = myUserId ? standings.find((s) => s.userId === myUserId) : null;

  const getRankColor = (rank: number) => {
    if (rank === 1) return colors.rank.gold;
    if (rank === 2) return colors.rank.silver;
    if (rank === 3) return colors.rank.bronze;
    return colors.text.secondary;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading standings...</Text>
        </View>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>Event not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{event.name}</Text>
          <Text style={styles.headerSubtitle}>Standings</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary.main} />
        }
        showsVerticalScrollIndicator={false}
      >
        {standings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No standings yet</Text>
            <Text style={styles.emptySubtitle}>Standings will appear after the first round completes</Text>
          </View>
        ) : (
          <>
            {/* My Standing Card */}
            {myStanding && (
              <View style={styles.myStandingCard}>
                <View style={styles.myStandingHeader}>
                  <Text style={styles.myStandingLabel}>YOUR STANDING</Text>
                </View>
                <View style={styles.myStandingContent}>
                  <View style={styles.rankSection}>
                    <Text style={styles.rankLabel}>RANK</Text>
                    <View style={[styles.rankBox, { borderColor: getRankColor(myStanding.rank) }]}>
                      <Text style={[styles.rankNumber, { color: getRankColor(myStanding.rank) }]}>
                        {myStanding.rank}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statsSection}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{myStanding.points}</Text>
                      <Text style={styles.statLabel}>Points</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{myStanding.matchWins}-{myStanding.matchLosses}-{myStanding.matchDraws}</Text>
                      <Text style={styles.statLabel}>Record</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{(myStanding.omwPercent * 100).toFixed(1)}%</Text>
                      <Text style={styles.statLabel}>OMW%</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Standings Table */}
            <View style={styles.standingsSection}>
              <Text style={styles.sectionTitle}>All Players</Text>
              <Text style={styles.sectionSubtitle}>{standings.length} participants</Text>

              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <View style={styles.rankCell}><Text style={styles.tableHeaderText}>#</Text></View>
                  <View style={styles.playerCell}><Text style={styles.tableHeaderText}>Player</Text></View>
                  <View style={styles.ptsCell}><Text style={styles.tableHeaderText}>Pts</Text></View>
                  <View style={styles.recordCell}><Text style={styles.tableHeaderText}>Record</Text></View>
                  <View style={styles.tieCell}><Text style={styles.tableHeaderText}>OMW%</Text></View>
                </View>

                {standings.map((standing) => {
                  const isMe = standing.userId === myUserId;
                  const isTop3 = standing.rank <= 3;
                  return (
                    <View
                      key={standing.userId}
                      style={[
                        styles.tableRow,
                        isMe && styles.tableRowMe,
                        standing.isDropped && styles.tableRowDropped,
                      ]}
                    >
                      <View style={styles.rankCell}>
                        <Text style={[styles.rankText, isTop3 && { color: getRankColor(standing.rank) }]}>
                          {standing.rank}
                        </Text>
                      </View>
                      <View style={styles.playerCell}>
                        <Text style={[styles.playerName, isMe && styles.playerNameMe, standing.isDropped && styles.playerNameDropped]} numberOfLines={1}>
                          {standing.userName}
                          {isMe && <Text style={styles.youTag}> (You)</Text>}
                        </Text>
                        {standing.isDropped && <Text style={styles.droppedTag}>Dropped</Text>}
                      </View>
                      <View style={styles.ptsCell}>
                        <Text style={styles.ptsValue}>{standing.points}</Text>
                      </View>
                      <View style={styles.recordCell}>
                        <Text style={styles.recordValue}>{standing.matchWins}-{standing.matchLosses}-{standing.matchDraws}</Text>
                      </View>
                      <View style={styles.tieCell}>
                        <Text style={styles.tieValue}>{(standing.omwPercent * 100).toFixed(1)}%</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Ionicons name="information-circle-outline" size={16} color={colors.text.tertiary} />
              <Text style={styles.footerText}>
                Win=3pts, Draw=1pt, Loss=0pts. Tiebreakers: OMW% → GW% → OGW%
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['4xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: spacing.base,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // My Standing Card
  myStandingCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary.dark,
  },
  myStandingHeader: {
    marginBottom: spacing.base,
  },
  myStandingLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.light,
    letterSpacing: typography.letterSpacing.wider,
  },
  myStandingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  rankSection: {
    alignItems: 'center',
  },
  rankLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
    letterSpacing: typography.letterSpacing.wider,
    marginBottom: spacing.xs,
  },
  rankBox: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.elevated,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.black,
  },
  statsSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },

  // Standings Section
  standingsSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginBottom: spacing.md,
  },

  // Table
  table: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.background.elevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tableHeaderText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  tableRowMe: {
    backgroundColor: colors.primary.main + '10',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.main,
  },
  tableRowDropped: {
    opacity: 0.5,
  },
  rankCell: {
    width: 36,
    alignItems: 'center',
  },
  rankText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
  },
  playerCell: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  playerName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  playerNameMe: {
    color: colors.primary.light,
    fontWeight: typography.fontWeight.bold,
  },
  playerNameDropped: {
    color: colors.text.tertiary,
  },
  youTag: {
    fontSize: typography.fontSize.xs,
    color: colors.primary.main,
  },
  droppedTag: {
    fontSize: typography.fontSize.xs,
    color: colors.error.light,
    marginTop: 2,
  },
  ptsCell: {
    width: 36,
    alignItems: 'center',
  },
  ptsValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  recordCell: {
    width: 55,
    alignItems: 'center',
  },
  recordValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  tieCell: {
    width: 50,
    alignItems: 'flex-end',
  },
  tieValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.tertiary,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.md,
  },
  footerText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
