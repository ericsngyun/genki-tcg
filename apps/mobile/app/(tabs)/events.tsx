import { useEffect, useState, useMemo, useCallback } from 'react';
import { logger } from '../../lib/logger';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Animated,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { api } from '../../lib/api';
import { formatGameName, formatEventFormat, getGameImagePath } from '../../lib/formatters';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { usePressAnimation } from '../../lib/animations';
import { EventActionSheet } from '../../components/EventActionSheet';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { AppHeader } from '../../components';
import { useSocket } from '../../contexts/SocketContext';

interface Event {
  id: string;
  name: string;
  game: string;
  format: string;
  status: string;
  startAt: string;
  endAt?: string;
  maxPlayers?: number;
  entryFeeCents?: number;
  currentRound?: number;
  _count: {
    entries: number;
  };
  entries?: Array<{
    userId: string;
    checkedInAt?: string;
    paidAt?: string;
    droppedAt?: string;
  }>;
}

interface CategorizedEvents {
  myTournaments: Event[];
  activeTournaments: Event[];
  upcomingEvents: Event[];
  pastEvents: Event[];
}

export default function EventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPastEvents, setShowPastEvents] = useState(false);

  // Action Sheet State
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    type: 'apply' | 'checkIn' | 'drop' | null;
    event: Event | null;
    loading: boolean;
  }>({
    visible: false,
    type: null,
    event: null,
    loading: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  // Real-time updates
  const { isConnected, joinEvent, leaveEvent, onPairingsPosted, onRoundStarted } = useSocket();

  const loadDataCallback = useCallback(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!isConnected || !myUserId || events.length === 0) return;

    const myEventIds = events
      .filter((e) => {
        const entry = e.entries?.find((entry) => entry.userId === myUserId);
        return entry && !entry.droppedAt;
      })
      .map((e) => e.id);

    myEventIds.forEach((eventId) => {
      joinEvent(eventId);
    });

    const unsubscribePairings = onPairingsPosted((data) => {
      logger.debug(`Pairings posted for event ${data.eventId}, round ${data.roundNumber}`);
      setTimeout(() => loadData(), 100);
    });

    const unsubscribeRoundStarted = onRoundStarted((data) => {
      logger.debug(`Round ${data.roundNumber} started for event ${data.eventId}`);
      setTimeout(() => loadData(), 100);
    });

    return () => {
      myEventIds.forEach((eventId) => {
        leaveEvent(eventId);
      });
      unsubscribePairings();
      unsubscribeRoundStarted();
    };
  }, [isConnected, myUserId, events, joinEvent, leaveEvent, onPairingsPosted, onRoundStarted]);

  const loadData = async () => {
    try {
      const userData = await api.getMe();
      setMyUserId(userData.user.id);
      if (userData.organization?.name) {
        setOrgName(userData.organization.name);
      }

      const [scheduledEvents, inProgressEvents, completedEvents] = await Promise.all([
        api.getEvents('SCHEDULED'),
        api.getEvents('IN_PROGRESS'),
        api.getEvents('COMPLETED').catch(() => []),
      ]);

      setEvents([...inProgressEvents, ...scheduledEvents, ...completedEvents]);
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

  // Categorize events
  const categorizedEvents = useMemo((): CategorizedEvents => {
    const now = new Date();

    const getMyEntry = (event: Event) => {
      if (!myUserId || !event.entries) return null;
      return event.entries.find((entry) => entry.userId === myUserId) || null;
    };

    const isParticipating = (event: Event) => {
      const entry = getMyEntry(event);
      return entry !== null && !entry.droppedAt;
    };

    const myTournaments = events.filter((e) => {
      if (e.status === 'COMPLETED' || e.status === 'CANCELLED') return false;
      if (e.status === 'SCHEDULED') {
        const startTime = new Date(e.startAt);
        const hoursPassed = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        if (hoursPassed > 24) return false;
      }
      return isParticipating(e);
    });

    const activeTournaments = events.filter((e) => {
      if (e.status !== 'IN_PROGRESS') return false;
      if (myTournaments.some((mt) => mt.id === e.id)) return false;
      return true;
    });

    const upcomingEvents = events.filter((e) => {
      if (e.status !== 'SCHEDULED') return false;
      const startTime = new Date(e.startAt);
      return startTime > now;
    }).filter((e) => {
      return !myTournaments.some((mt) => mt.id === e.id);
    }).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    const pastEvents = events.filter((e) => {
      if (e.status === 'COMPLETED' || e.status === 'CANCELLED') return true;
      if (e.status === 'SCHEDULED') {
        const startTime = new Date(e.startAt);
        const hoursPassed = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        return hoursPassed > 24;
      }
      return false;
    }).sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

    return {
      myTournaments,
      activeTournaments,
      upcomingEvents: upcomingEvents.filter((e) => !pastEvents.some((pe) => pe.id === e.id)),
      pastEvents,
    };
  }, [events, myUserId]);

  const handleHaptic = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleEventPress = (event: Event) => {
    handleHaptic();
    setSelectedEvent(event);
    setActionSheetVisible(true);
  };

  const closeActionSheet = () => {
    setActionSheetVisible(false);
    setTimeout(() => setSelectedEvent(null), 300);
  };

  const handleApply = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setConfirmModal({ visible: true, type: 'apply', event, loading: false });
    }
  };

  const handleCheckIn = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setConfirmModal({ visible: true, type: 'checkIn', event, loading: false });
    }
  };

  const handleDrop = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setConfirmModal({ visible: true, type: 'drop', event, loading: false });
    }
  };

  const confirmAction = async () => {
    if (!confirmModal.event || !confirmModal.type) return;

    setConfirmModal((prev) => ({ ...prev, loading: true }));

    try {
      switch (confirmModal.type) {
        case 'apply':
          await api.registerForEvent(confirmModal.event.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'checkIn':
          await api.selfCheckIn(confirmModal.event.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'drop':
          await api.dropFromEvent(confirmModal.event.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
      }
      setConfirmModal({ visible: false, type: null, event: null, loading: false });
      loadData();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      alert(error.response?.data?.message || 'Action failed. Please try again.');
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleViewPairings = (eventId: string) => {
    router.push({ pathname: '/pairings', params: { eventId } });
  };

  const handleViewStandings = (eventId: string) => {
    router.push({ pathname: '/standings', params: { eventId } });
  };

  const handleViewMatch = (event: Event) => {
    router.push({
      pathname: '/match-details',
      params: { eventId: event.id, eventName: event.name, gameType: event.game },
    });
  };

  const getMyEntry = (event: Event) => {
    if (!myUserId || !event.entries) return null;
    return event.entries.find((entry) => entry.userId === myUserId);
  };

  const hasEntry = (event: Event) => getMyEntry(event) !== null;
  const isCheckedIn = (event: Event) => {
    const entry = getMyEntry(event);
    return entry?.checkedInAt !== undefined && entry?.checkedInAt !== null;
  };
  const isDropped = (event: Event) => {
    const entry = getMyEntry(event);
    return entry?.droppedAt !== undefined && entry?.droppedAt !== null;
  };
  const isRegistered = (event: Event) => hasEntry(event);

  const getConfirmModalConfig = () => {
    if (!confirmModal.event || !confirmModal.type) return null;
    const event = confirmModal.event;

    switch (confirmModal.type) {
      case 'apply':
        return {
          title: 'Apply for Event',
          message: 'You are about to register for this tournament. Make sure you can attend!',
          icon: 'add-circle' as const,
          variant: 'default' as const,
          confirmText: 'Apply Now',
          details: [
            { label: 'Event', value: event.name },
            { label: 'Date', value: new Date(event.startAt).toLocaleDateString() },
            { label: 'Format', value: formatEventFormat(event.format) },
            ...(event.entryFeeCents ? [{ label: 'Entry Fee', value: `$${(event.entryFeeCents / 100).toFixed(2)}` }] : []),
          ],
        };
      case 'checkIn':
        return {
          title: 'Check In',
          message: 'Confirm your attendance for this tournament. You must be present at the venue.',
          icon: 'checkmark-circle' as const,
          variant: 'success' as const,
          confirmText: 'Check In',
          details: [
            { label: 'Event', value: event.name },
            { label: 'Status', value: event.status === 'IN_PROGRESS' ? 'In Progress' : 'Starting Soon' },
          ],
        };
      case 'drop':
        const isWithdraw = event.status === 'SCHEDULED';
        return {
          title: isWithdraw ? 'Withdraw Application' : 'Drop from Tournament',
          message: isWithdraw
            ? 'Are you sure you want to withdraw from this event? You can re-apply later if spots are available.'
            : 'Are you sure you want to drop? This action cannot be undone and you will be removed from future rounds.',
          icon: 'warning' as const,
          variant: isWithdraw ? ('warning' as const) : ('danger' as const),
          confirmText: isWithdraw ? 'Withdraw' : 'Drop Out',
          details: [{ label: 'Event', value: event.name }],
        };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      </View>
    );
  }

  const { myTournaments, activeTournaments, upcomingEvents, pastEvents } = categorizedEvents;
  const hasNoEvents = myTournaments.length === 0 && activeTournaments.length === 0 && upcomingEvents.length === 0;

  return (
    <View style={styles.container}>
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
        {/* Header */}
        <AppHeader
          title="Events"
          subtitle={orgName ? `${orgName} tournaments` : 'Find tournaments and track your matches'}
          showLogo={false}
        />

        {/* My Tournaments */}
        {myTournaments.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="My Tournaments" icon="person" count={myTournaments.length} />
            <View style={styles.cardList}>
              {myTournaments.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isRegistered={isRegistered(event)}
                  isCheckedIn={isCheckedIn(event)}
                  isDropped={isDropped(event)}
                  myUserId={myUserId}
                  onPress={() => handleEventPress(event)}
                  showMyStatus
                />
              ))}
            </View>
          </View>
        )}

        {/* Active Tournaments */}
        {activeTournaments.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Live Now" icon="pulse" count={activeTournaments.length} accentColor={colors.success.main} />
            <View style={styles.cardList}>
              {activeTournaments.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isRegistered={isRegistered(event)}
                  isCheckedIn={isCheckedIn(event)}
                  isDropped={isDropped(event)}
                  myUserId={myUserId}
                  onPress={() => handleEventPress(event)}
                  showMyStatus
                />
              ))}
            </View>
          </View>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Upcoming Events" icon="calendar" count={upcomingEvents.length} />
            <View style={styles.cardList}>
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isRegistered={isRegistered(event)}
                  isCheckedIn={isCheckedIn(event)}
                  isDropped={isDropped(event)}
                  myUserId={myUserId}
                  onPress={() => handleEventPress(event)}
                  showMyStatus
                />
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {hasNoEvents && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="calendar-outline" size={48} color={colors.text.tertiary} />
            </View>
            <Text style={styles.emptyTitle}>No Events Available</Text>
            <Text style={styles.emptyText}>Check back later for upcoming tournaments</Text>
          </View>
        )}

        {/* Past Events - Collapsible */}
        {pastEvents.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => {
                handleHaptic();
                setShowPastEvents(!showPastEvents);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderContent}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="time" size={18} color={colors.text.tertiary} />
                  <Text style={styles.sectionTitleMuted}>Past Events</Text>
                </View>
                <View style={styles.sectionHeaderRight}>
                  <Text style={styles.countBadgeMuted}>{pastEvents.length}</Text>
                  <Ionicons
                    name={showPastEvents ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.text.tertiary}
                  />
                </View>
              </View>
            </TouchableOpacity>

            {showPastEvents && (
              <View style={styles.cardList}>
                {pastEvents.slice(0, 10).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isRegistered={isRegistered(event)}
                    isCheckedIn={isCheckedIn(event)}
                    isDropped={isDropped(event)}
                    myUserId={myUserId}
                    onPress={() => handleEventPress(event)}
                    muted
                    showMyStatus
                  />
                ))}
                {pastEvents.length > 10 && (
                  <Text style={styles.moreText}>+ {pastEvents.length - 10} more past events</Text>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Action Sheet */}
      <EventActionSheet
        visible={actionSheetVisible}
        event={selectedEvent}
        myUserId={myUserId}
        onClose={closeActionSheet}
        onApply={handleApply}
        onCheckIn={handleCheckIn}
        onViewPairings={handleViewPairings}
        onViewStandings={handleViewStandings}
        onViewMatch={handleViewMatch}
        onDrop={handleDrop}
      />

      {/* Confirmation Modal */}
      {confirmModal.type && (
        <ConfirmationModal
          visible={confirmModal.visible}
          {...getConfirmModalConfig()!}
          loading={confirmModal.loading}
          onConfirm={confirmAction}
          onCancel={() => setConfirmModal({ visible: false, type: null, event: null, loading: false })}
        />
      )}
    </View>
  );
}

// Section Header Component
interface SectionHeaderProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  count?: number;
  accentColor?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, icon, count, accentColor }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionHeaderLeft}>
      <View style={[styles.sectionIconContainer, accentColor && { backgroundColor: accentColor + '20' }]}>
        <Ionicons name={icon} size={16} color={accentColor || colors.text.secondary} />
      </View>
      <Text style={[styles.sectionTitle, accentColor && { color: accentColor }]}>{title}</Text>
    </View>
    {count !== undefined && (
      <View style={[styles.countBadge, accentColor && { backgroundColor: accentColor + '20' }]}>
        <Text style={[styles.countBadgeText, accentColor && { color: accentColor }]}>{count}</Text>
      </View>
    )}
  </View>
);

// Event Card Component
interface EventCardProps {
  event: Event;
  isRegistered: boolean;
  isCheckedIn: boolean;
  isDropped: boolean;
  myUserId: string | null;
  onPress: () => void;
  compact?: boolean;
  muted?: boolean;
  showMyStatus?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  isRegistered,
  isCheckedIn,
  isDropped,
  myUserId,
  onPress,
  compact = false,
  muted = false,
  showMyStatus = false,
}) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation();
  const isLive = event.status === 'IN_PROGRESS';

  const isPast = (() => {
    if (event.status === 'COMPLETED' || event.status === 'CANCELLED') return true;
    if (event.status === 'SCHEDULED') {
      const now = new Date();
      const startTime = new Date(event.startAt);
      const hoursPastStart = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      return hoursPastStart > 24;
    }
    return false;
  })();

  const isStartingSoon = (() => {
    if (event.status === 'SCHEDULED') {
      const now = new Date();
      const startTime = new Date(event.startAt);
      const hoursPastStart = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      return hoursPastStart > 0 && hoursPastStart <= 24;
    }
    return false;
  })();

  const getMyEntry = () => {
    if (!myUserId || !event.entries) return null;
    return event.entries.find((entry) => entry.userId === myUserId) || null;
  };

  const getPlayerStatusBadge = () => {
    if (isDropped) {
      return { text: 'Dropped', bg: colors.error.main + '20', color: colors.error.light };
    }
    if (isCheckedIn) {
      return { text: 'Checked In', bg: colors.success.main + '20', color: colors.success.light };
    }
    const entry = getMyEntry();
    if (entry) {
      if (entry.paidAt) {
        return { text: 'Registered', bg: colors.info.main + '20', color: colors.info.light };
      } else {
        return { text: 'Applied', bg: 'rgba(139, 92, 246, 0.2)', color: '#A78BFA' };
      }
    }
    return null;
  };

  const playerStatus = getPlayerStatusBadge();
  const gameImage = getGameImagePath(event.game);

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View
        style={[
          styles.eventCard,
          animatedStyle,
          isLive && styles.eventCardLive,
          muted && styles.eventCardMuted,
          compact && styles.eventCardCompact,
        ]}
      >
        {/* Game Image Background */}
        <View style={styles.cardImageContainer}>
          <ImageBackground source={gameImage} style={styles.cardImage} resizeMode="cover">
            <LinearGradient
              colors={[colors.background.card, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.7, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          </ImageBackground>
        </View>

        {/* Content Container */}
        <View style={styles.cardContent}>
          {/* Live Indicator */}
          {isLive && !compact && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}

          {/* Event Header */}
          <View style={styles.eventHeader}>
            <View style={styles.eventTitleContainer}>
              {isLive && compact && <View style={styles.liveDotSmall} />}
              <Text style={[styles.eventName, muted && styles.eventNameMuted]} numberOfLines={compact ? 1 : 2}>
                {event.name}
              </Text>
            </View>
            <View style={[
              styles.statusBadge,
              isPast ? { backgroundColor: colors.background.elevated } :
                isStartingSoon ? { backgroundColor: colors.warning.main + '20' } :
                  getStatusStyle(event.status)
            ]}>
              <Text style={[
                styles.statusText,
                isPast ? { color: colors.text.tertiary } :
                  isStartingSoon ? { color: colors.warning.light } :
                    getStatusTextStyle(event.status)
              ]}>
                {isPast ? 'Past' : isStartingSoon ? 'Starting Soon' : formatStatus(event.status)}
              </Text>
            </View>
          </View>

          {/* Event Details */}
          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="game-controller-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.detailText}>{formatGameName(event.game)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.detailText}>
                {new Date(event.startAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.detailText}>
                {event._count.entries}
                {event.maxPlayers ? `/${event.maxPlayers}` : ''} players
              </Text>
            </View>
          </View>

          {/* Player Status Badge */}
          {showMyStatus && playerStatus && (
            <View style={[styles.playerStatusBadge, { backgroundColor: playerStatus.bg }]}>
              <Text style={[styles.playerStatusText, { color: playerStatus.color }]}>
                {playerStatus.text}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
};

// Helper functions for styles
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'IN_PROGRESS':
      return { backgroundColor: colors.success.main + '20' };
    case 'SCHEDULED':
      return { backgroundColor: colors.info.main + '20' };
    case 'COMPLETED':
      return { backgroundColor: colors.background.elevated };
    case 'CANCELLED':
      return { backgroundColor: colors.error.main + '20' };
    default:
      return { backgroundColor: colors.background.elevated };
  }
};

const getStatusTextStyle = (status: string) => {
  switch (status) {
    case 'IN_PROGRESS':
      return { color: colors.success.light };
    case 'SCHEDULED':
      return { color: colors.info.light };
    case 'COMPLETED':
      return { color: colors.text.tertiary };
    case 'CANCELLED':
      return { color: colors.error.light };
    default:
      return { color: colors.text.tertiary };
  }
};

const formatStatus = (status: string) => {
  switch (status) {
    case 'IN_PROGRESS':
      return 'Live';
    case 'SCHEDULED':
      return 'Upcoming';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status.replace('_', ' ');
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionIconContainer: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.tight,
  },
  sectionTitleMuted: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.tertiary,
  },
  countBadge: {
    backgroundColor: colors.background.elevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  countBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
  },
  countBadgeMuted: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
    backgroundColor: colors.background.highlight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  cardList: {
    gap: spacing.md,
  },
  eventCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 140,
  },
  cardImageContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '60%',
    zIndex: 0,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    padding: spacing.base,
    position: 'relative',
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  eventCardLive: {
    borderColor: colors.success.main + '60',
    borderWidth: 1.5,
  },
  eventCardCompact: {},
  eventCardMuted: {
    opacity: 0.7,
    borderColor: colors.border.subtle,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success.main,
    marginRight: spacing.xs,
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success.main,
    marginRight: spacing.xs,
  },
  liveText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.success.main,
    letterSpacing: typography.letterSpacing.wide,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  eventTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  eventName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    lineHeight: 22,
  },
  eventNameMuted: {
    color: colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize['2xs'],
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
  eventDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  playerStatusBadge: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  playerStatusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
    marginTop: spacing.lg,
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
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  collapsibleHeader: {
    marginBottom: spacing.md,
  },
  moreText: {
    textAlign: 'center',
    color: colors.text.tertiary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.sm,
  },
});
