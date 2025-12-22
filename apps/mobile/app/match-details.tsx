import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { ActiveMatchCard } from '../components';
import { colors, spacing, typography, borderRadius } from '../lib/theme';
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates';
import { logger } from '../lib/logger';

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

// ============================================
// Sub-components
// ============================================

interface HeaderProps {
  title: string;
  subtitle: string;
  onBack: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, onBack }) => (
  <View style={styles.header}>
    <TouchableOpacity
      onPress={onBack}
      style={styles.backButton}
      activeOpacity={0.7}
    >
      <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
    </TouchableOpacity>
    <View style={styles.headerTextContainer}>
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      <Text style={styles.headerSubtitle}>{subtitle}</Text>
    </View>
  </View>
);

interface EmptyStateProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, subtitle, icon }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconContainer}>
      <Ionicons name={icon} size={48} color={colors.text.tertiary} />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptySubtitle}>{subtitle}</Text>
  </View>
);

// ============================================
// Main Component
// ============================================

export default function MatchDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const eventName = params.eventName as string;
  const gameType = params.gameType as 'ONE_PIECE_TCG' | 'AZUKI_TCG' | 'RIFTBOUND';

  const [activeMatch, setActiveMatch] = useState<ActiveMatch | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dropping, setDropping] = useState(false);

  useEffect(() => {
    loadActiveMatch();
  }, [eventId]);

  // Real-time updates
  useRealtimeUpdates({
    eventId,
    onMatchResultReported: useCallback((matchId: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadActiveMatch();
    }, []),
    onStandingsUpdated: useCallback(() => {
      loadActiveMatch();
    }, []),
  });

  const loadActiveMatch = async () => {
    try {
      const [matchData, userData] = await Promise.all([
        api.getActiveMatch(eventId),
        api.getMe(),
      ]);
      setActiveMatch(matchData);
      setMyUserId(userData.user.id);
    } catch (error) {
      logger.error('Failed to load active match:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    loadActiveMatch();
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (typeof (router as any).canDismiss === 'function' && (router as any).canDismiss()) {
      router.dismiss();
    } else if (typeof (router as any).canGoBack === 'function' && (router as any).canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/events');
    }
  };

  const handleViewStandings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/standings', params: { eventId } });
  };

  const handleDrop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              Alert.alert(
                'Dropped',
                'You have been dropped from the tournament.',
                [{ text: 'OK', onPress: handleBack }]
              );
            } catch (error: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
        <Header title={eventName || 'Match'} subtitle="Match Details" onBack={handleBack} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading match...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={eventName || 'Match'}
        subtitle="Match Details"
        onBack={handleBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary.main}
            colors={[colors.primary.main]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
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
                onPress={handleViewStandings}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="trophy" size={20} color={colors.primary.main} />
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionButtonText}>View Standings</Text>
                  <Text style={styles.actionSubtext}>See current rankings</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.dropButton]}
                onPress={handleDrop}
                disabled={dropping}
                activeOpacity={0.8}
              >
                {dropping ? (
                  <ActivityIndicator color={colors.error.main} />
                ) : (
                  <>
                    <View style={[styles.actionIconContainer, styles.dropIconContainer]}>
                      <Ionicons name="exit-outline" size={20} color={colors.error.main} />
                    </View>
                    <View style={styles.actionTextContainer}>
                      <Text style={[styles.actionButtonText, { color: colors.error.light }]}>
                        Drop from Tournament
                      </Text>
                      <Text style={styles.actionSubtext}>Cannot be undone</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <EmptyState
              icon="hourglass-outline"
              title="No Active Match"
              subtitle="You don't have an active match right now. Check back when the next round starts."
            />

            {/* Actions when no match */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleViewStandings}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="trophy" size={20} color={colors.primary.main} />
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionButtonText}>View Standings</Text>
                  <Text style={styles.actionSubtext}>See current rankings</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.dropButton]}
                onPress={handleDrop}
                disabled={dropping}
                activeOpacity={0.8}
              >
                {dropping ? (
                  <ActivityIndicator color={colors.error.main} />
                ) : (
                  <>
                    <View style={[styles.actionIconContainer, styles.dropIconContainer]}>
                      <Ionicons name="exit-outline" size={20} color={colors.error.main} />
                    </View>
                    <View style={styles.actionTextContainer}>
                      <Text style={[styles.actionButtonText, { color: colors.error.light }]}>
                        Drop from Tournament
                      </Text>
                      <Text style={styles.actionSubtext}>Cannot be undone</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ============================================
// Styles
// ============================================

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
    borderWidth: 1,
    borderColor: colors.border.light,
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
    letterSpacing: typography.letterSpacing.tight,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Loading
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

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '85%',
  },

  // Actions
  actionsContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary.dark,
  },
  dropIconContainer: {
    borderColor: colors.error.main + '30',
    backgroundColor: colors.error.main + '10',
  },
  actionTextContainer: {
    flex: 1,
  },
  actionButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  actionSubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  dropButton: {
    borderColor: colors.error.main + '30',
    marginTop: spacing.md,
  },
});
