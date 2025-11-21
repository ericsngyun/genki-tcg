import { useEffect, useState, useMemo } from 'react';
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
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../lib/api';
import { formatGameName, formatEventFormat } from '../../lib/formatters';
import { theme } from '../../lib/theme';
import { usePressAnimation } from '../../lib/animations';
import { EventActionSheet } from '../../components/EventActionSheet';
import { ConfirmationModal } from '../../components/ConfirmationModal';

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
  myActiveMatch: Event | null;
  myTournaments: Event[];
  activeTournaments: Event[];
  upcomingEvents: Event[];
  pastEvents: Event[];
}

export default function EventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
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

  const loadData = async () => {
    try {
      const userData = await api.getMe();
      setMyUserId(userData.user.id);

      // Load all event statuses
      const [scheduledEvents, inProgressEvents, completedEvents] = await Promise.all([
        api.getEvents('SCHEDULED'),
        api.getEvents('IN_PROGRESS'),
        api.getEvents('COMPLETED').catch(() => []), // Gracefully handle if COMPLETED not supported
      ]);

      setEvents([...inProgressEvents, ...scheduledEvents, ...completedEvents]);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Categorize events based on status, date, and user participation
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

    const isCheckedIn = (event: Event) => {
      const entry = getMyEntry(event);
      return entry?.checkedInAt !== undefined && entry?.checkedInAt !== null;
    };

    // Find active match (live tournament where user is checked in)
    const myActiveMatch = events.find(
      (e) => e.status === 'IN_PROGRESS' && isCheckedIn(e)
    ) || null;

    // My tournaments (registered but not the active match event)
    const myTournaments = events.filter((e) => {
      if (e.status === 'COMPLETED' || e.status === 'CANCELLED') return false;
      if (myActiveMatch && e.id === myActiveMatch.id) return false;
      return isParticipating(e);
    });

    // Active tournaments (IN_PROGRESS, excluding ones user is in)
    const activeTournaments = events.filter((e) => {
      if (e.status !== 'IN_PROGRESS') return false;
      if (myActiveMatch && e.id === myActiveMatch.id) return false;
      if (myTournaments.some((mt) => mt.id === e.id)) return false;
      return true;
    });

    // Upcoming events (SCHEDULED and start time is in the future)
    const upcomingEvents = events.filter((e) => {
      if (e.status !== 'SCHEDULED') return false;
      const startTime = new Date(e.startAt);
      // Only show as upcoming if start time is in the future
      return startTime > now;
    }).filter((e) => {
      // Exclude events user is already registered for (they go to myTournaments)
      return !myTournaments.some((mt) => mt.id === e.id);
    }).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    // Past events (COMPLETED or CANCELLED, or SCHEDULED but start time was > 24h ago)
    const pastEvents = events.filter((e) => {
      if (e.status === 'COMPLETED' || e.status === 'CANCELLED') return true;
      // If SCHEDULED but start time was more than 24 hours ago, consider it past/missed
      if (e.status === 'SCHEDULED') {
        const startTime = new Date(e.startAt);
        const hoursPassed = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        return hoursPassed > 24;
      }
      return false;
    }).sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

    return {
      myActiveMatch,
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

  // Quick action - go directly to active match
  const handleGoToActiveMatch = (event: Event) => {
    handleHaptic();
    router.push({
      pathname: '/match-details',
      params: {
        eventId: event.id,
        eventName: event.name,
        gameType: event.game,
      },
    });
  };

  // Action handlers with confirmation modals
  const handleApply = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setConfirmModal({
        visible: true,
        type: 'apply',
        event,
        loading: false,
      });
    }
  };

  const handleCheckIn = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setConfirmModal({
        visible: true,
        type: 'checkIn',
        event,
        loading: false,
      });
    }
  };

  const handleDrop = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setConfirmModal({
        visible: true,
        type: 'drop',
        event,
        loading: false,
      });
    }
  };

  const confirmAction = async () => {
    if (!confirmModal.event || !confirmModal.type) return;

    setConfirmModal((prev) => ({ ...prev, loading: true }));

    try {
      switch (confirmModal.type) {
        case 'apply':
          await api.registerForEvent(confirmModal.event.id);
          if (Platform.OS === 'ios' || Platform.OS === 'android') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          break;
        case 'checkIn':
          await api.selfCheckIn(confirmModal.event.id);
          if (Platform.OS === 'ios' || Platform.OS === 'android') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          break;
        case 'drop':
          await api.dropFromEvent(confirmModal.event.id);
          if (Platform.OS === 'ios' || Platform.OS === 'android') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
          break;
      }
      setConfirmModal({ visible: false, type: null, event: null, loading: false });
      loadData();
    } catch (error: any) {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      alert(error.response?.data?.message || 'Action failed. Please try again.');
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleViewPairings = (eventId: string) => {
    router.push({
      pathname: '/pairings',
      params: { eventId },
    });
  };

  const handleViewStandings = (eventId: string) => {
    router.push({
      pathname: '/standings',
      params: { eventId },
    });
  };

  const handleViewMatch = (event: Event) => {
    router.push({
      pathname: '/match-details',
      params: {
        eventId: event.id,
        eventName: event.name,
        gameType: event.game,
      },
    });
  };

  // Helper functions
  const getMyEntry = (event: Event) => {
    if (!myUserId || !event.entries) return null;
    return event.entries.find((entry) => entry.userId === myUserId);
  };

  const isRegistered = (event: Event) => getMyEntry(event) !== null;

  const isCheckedIn = (event: Event) => {
    const entry = getMyEntry(event);
    return entry?.checkedInAt !== undefined && entry?.checkedInAt !== null;
  };

  const isDropped = (event: Event) => {
    const entry = getMyEntry(event);
    return entry?.droppedAt !== undefined && entry?.droppedAt !== null;
  };

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
            ...(event.entryFeeCents
              ? [{ label: 'Entry Fee', value: `$${(event.entryFeeCents / 100).toFixed(2)}` }]
              : []),
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
        return {
          title: 'Drop from Tournament',
          message:
            'Are you sure you want to drop? This action cannot be undone and you will be removed from future rounds.',
          icon: 'warning' as const,
          variant: 'danger' as const,
          confirmText: 'Drop Out',
          details: [{ label: 'Event', value: event.name }],
        };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  const { myActiveMatch, myTournaments, activeTournaments, upcomingEvents, pastEvents } = categorizedEvents;
  const hasNoEvents = !myActiveMatch && myTournaments.length === 0 && activeTournaments.length === 0 && upcomingEvents.length === 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary.main}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/genki-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Events</Text>
          <Text style={styles.subtitle}>Find tournaments and track your matches</Text>
        </View>

        {/* My Active Match - Most Prominent */}
        {myActiveMatch && (
          <View style={styles.section}>
            <ActiveMatchBanner
              event={myActiveMatch}
              onPress={() => handleGoToActiveMatch(myActiveMatch)}
              onViewPairings={() => handleViewPairings(myActiveMatch.id)}
              onViewStandings={() => handleViewStandings(myActiveMatch.id)}
              onDrop={() => handleDrop(myActiveMatch.id)}
            />
          </View>
        )}

        {/* My Tournaments */}
        {myTournaments.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="My Tournaments"
              icon="person"
              count={myTournaments.length}
            />
            <View style={styles.cardList}>
              {myTournaments.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isRegistered={isRegistered(event)}
                  isCheckedIn={isCheckedIn(event)}
                  isDropped={isDropped(event)}
                  onPress={() => handleEventPress(event)}
                  compact
                  showMyStatus
                />
              ))}
            </View>
          </View>
        )}

        {/* Active Tournaments */}
        {activeTournaments.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="Live Now"
              icon="pulse"
              count={activeTournaments.length}
              accentColor={theme.colors.success.main}
            />
            <View style={styles.cardList}>
              {activeTournaments.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isRegistered={isRegistered(event)}
                  isCheckedIn={isCheckedIn(event)}
                  isDropped={isDropped(event)}
                  onPress={() => handleEventPress(event)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="Upcoming Events"
              icon="calendar"
              count={upcomingEvents.length}
            />
            <View style={styles.cardList}>
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isRegistered={isRegistered(event)}
                  isCheckedIn={isCheckedIn(event)}
                  isDropped={isDropped(event)}
                  onPress={() => handleEventPress(event)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {hasNoEvents && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={theme.colors.text.tertiary} />
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
                  <Ionicons name="time" size={18} color={theme.colors.text.tertiary} />
                  <Text style={styles.sectionTitleMuted}>Past Events</Text>
                </View>
                <View style={styles.sectionHeaderRight}>
                  <Text style={styles.countBadgeMuted}>{pastEvents.length}</Text>
                  <Ionicons
                    name={showPastEvents ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={theme.colors.text.tertiary}
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
                    onPress={() => handleEventPress(event)}
                    muted
                  />
                ))}
                {pastEvents.length > 10 && (
                  <Text style={styles.moreText}>
                    + {pastEvents.length - 10} more past events
                  </Text>
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

// Active Match Banner - Prominent card for players in a live tournament
interface ActiveMatchBannerProps {
  event: Event;
  onPress: () => void;
  onViewPairings: () => void;
  onViewStandings: () => void;
  onDrop: () => void;
}

const ActiveMatchBanner: React.FC<ActiveMatchBannerProps> = ({
  event,
  onPress,
  onViewPairings,
  onViewStandings,
  onDrop,
}) => {
  const handleHaptic = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  return (
    <View style={styles.activeMatchContainer}>
      <LinearGradient
        colors={['#1a2e05', '#0f1a03']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.activeMatchGradient}
      >
        {/* Animated Live Indicator */}
        <View style={styles.liveHeader}>
          <View style={styles.liveIndicatorLarge}>
            <View style={styles.liveDotAnimated} />
            <Text style={styles.liveTextLarge}>LIVE</Text>
          </View>
          <Text style={styles.roundText}>
            Round {event.currentRound || 1}
          </Text>
        </View>

        <Text style={styles.activeMatchTitle}>{event.name}</Text>

        <View style={styles.activeMatchMeta}>
          <View style={styles.metaChip}>
            <Ionicons name="game-controller" size={14} color="#A3E635" />
            <Text style={styles.metaChipText}>{formatGameName(event.game)}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="people" size={14} color="#A3E635" />
            <Text style={styles.metaChipText}>{event._count.entries} players</Text>
          </View>
        </View>

        {/* Primary Action - Go to Match */}
        <TouchableOpacity
          style={styles.goToMatchButton}
          onPress={() => {
            handleHaptic();
            onPress();
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.primary.main, theme.colors.primary.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.goToMatchGradient}
          >
            <Ionicons name="flash" size={20} color={theme.colors.primary.foreground} />
            <Text style={styles.goToMatchText}>Go to Active Match</Text>
            <Ionicons name="arrow-forward" size={20} color={theme.colors.primary.foreground} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={onViewPairings}
            activeOpacity={0.7}
          >
            <Ionicons name="grid" size={18} color="#E5E7EB" />
            <Text style={styles.quickActionTextDark}>Pairings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={onViewStandings}
            activeOpacity={0.7}
          >
            <Ionicons name="podium" size={18} color="#E5E7EB" />
            <Text style={styles.quickActionTextDark}>Standings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionButton, styles.quickActionDanger]}
            onPress={onDrop}
            activeOpacity={0.7}
          >
            <Ionicons name="exit" size={18} color={theme.colors.error.light} />
            <Text style={[styles.quickActionTextDark, styles.quickActionTextDanger]}>Drop</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

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
      <Ionicons name={icon} size={18} color={accentColor || theme.colors.text.secondary} />
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
  onPress,
  compact = false,
  muted = false,
  showMyStatus = false,
}) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation();
  const isLive = event.status === 'IN_PROGRESS';

  // Determine if event is past based on status AND time
  const isPast = (() => {
    if (event.status === 'COMPLETED' || event.status === 'CANCELLED') return true;
    // SCHEDULED events more than 24 hours past their start time are considered past
    if (event.status === 'SCHEDULED') {
      const now = new Date();
      const startTime = new Date(event.startAt);
      const hoursPastStart = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      return hoursPastStart > 24;
    }
    return false;
  })();

  // Determine if event has started (time passed but within 24h)
  const isStartingSoon = (() => {
    if (event.status === 'SCHEDULED') {
      const now = new Date();
      const startTime = new Date(event.startAt);
      const hoursPastStart = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      return hoursPastStart > 0 && hoursPastStart <= 24;
    }
    return false;
  })();

  const getPlayerStatusBadge = () => {
    if (isDropped) {
      return { text: 'Dropped', bg: 'rgba(239, 68, 68, 0.2)', color: theme.colors.error.light };
    }
    if (isCheckedIn) {
      return { text: 'Checked In', bg: 'rgba(16, 185, 129, 0.2)', color: theme.colors.success.light };
    }
    if (isRegistered) {
      return { text: 'Registered', bg: 'rgba(59, 130, 246, 0.2)', color: theme.colors.info.light };
    }
    return null;
  };

  const playerStatus = getPlayerStatusBadge();

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
            {isLive && compact && (
              <View style={styles.liveDotSmall} />
            )}
            <Text style={[styles.eventName, muted && styles.eventNameMuted]} numberOfLines={compact ? 1 : 2}>
              {event.name}
            </Text>
          </View>
          <View style={[
            styles.statusBadge,
            isPast ? { backgroundColor: theme.colors.background.elevated } :
              isStartingSoon ? { backgroundColor: 'rgba(245, 158, 11, 0.2)' } :
                getStatusStyle(event.status)
          ]}>
            <Text style={[
              styles.statusText,
              isPast ? { color: theme.colors.text.tertiary } :
                isStartingSoon ? { color: theme.colors.warning.light } :
                  getStatusTextStyle(event.status)
            ]}>
              {isPast ? 'Past' : isStartingSoon ? 'Starting Soon' : formatStatus(event.status)}
            </Text>
          </View>
        </View>

        {/* Event Details */}
        <View style={styles.eventDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="game-controller-outline" size={14} color={theme.colors.text.secondary} />
            <Text style={styles.detailText}>{formatGameName(event.game)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={14} color={theme.colors.text.secondary} />
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
            <Ionicons name="people-outline" size={14} color={theme.colors.text.secondary} />
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
      </Animated.View>
    </Pressable>
  );
};

// Helper functions for styles
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'IN_PROGRESS':
      return { backgroundColor: 'rgba(16, 185, 129, 0.2)' };
    case 'SCHEDULED':
      return { backgroundColor: 'rgba(59, 130, 246, 0.2)' };
    case 'COMPLETED':
      return { backgroundColor: theme.colors.background.elevated };
    case 'CANCELLED':
      return { backgroundColor: 'rgba(239, 68, 68, 0.2)' };
    default:
      return { backgroundColor: theme.colors.background.elevated };
  }
};

const getStatusTextStyle = (status: string) => {
  switch (status) {
    case 'IN_PROGRESS':
      return { color: theme.colors.success.light };
    case 'SCHEDULED':
      return { color: theme.colors.info.light };
    case 'COMPLETED':
      return { color: theme.colors.text.tertiary };
    case 'CANCELLED':
      return { color: theme.colors.error.light };
    default:
      return { color: theme.colors.text.tertiary };
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
    backgroundColor: theme.colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.text.secondary,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: theme.colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  logo: {
    width: 40,
    height: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginLeft: 8,
  },
  sectionTitleMuted: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    marginLeft: 8,
  },
  countBadge: {
    backgroundColor: theme.colors.background.elevated,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  countBadgeMuted: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    backgroundColor: theme.colors.background.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  cardList: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  eventCardLive: {
    borderColor: theme.colors.success.light,
    borderWidth: 1,
    shadowColor: theme.colors.success.main,
    shadowOpacity: 0.1,
  },
  eventCardCompact: {
    padding: 12,
  },
  eventCardMuted: {
    opacity: 0.7,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success.main,
    marginRight: 6,
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success.main,
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.success.main,
    letterSpacing: 0.5,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  eventNameMuted: {
    color: theme.colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  eventDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  playerStatusBadge: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  playerStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  collapsibleHeader: {
    marginBottom: 12,
  },
  moreText: {
    textAlign: 'center',
    color: theme.colors.text.tertiary,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
  },

  // Active Match Banner Styles
  activeMatchContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: theme.colors.success.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  activeMatchGradient: {
    padding: 24,
  },
  liveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  liveIndicatorLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(163, 230, 53, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(163, 230, 53, 0.3)',
  },
  liveDotAnimated: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A3E635',
    marginRight: 6,
  },
  liveTextLarge: {
    color: '#A3E635',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  roundText: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  activeMatchTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    lineHeight: 30,
  },
  activeMatchMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  metaChipText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  goToMatchButton: {
    marginBottom: 20,
    shadowColor: theme.colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  goToMatchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  goToMatchText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  quickActionDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  quickActionText: {
    color: theme.colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  quickActionTextDark: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
  },
  quickActionTextDanger: {
    color: theme.colors.error.light,
  },
});
