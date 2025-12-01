/**
 * EventActionSheet - A bottom sheet modal for event actions
 *
 * Shows different options based on tournament status:
 * - SCHEDULED (Upcoming): Apply, Check In, View Details
 * - IN_PROGRESS (Live): Check Pairings, Standings, Drop, View Active Match
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../lib/theme';
import { formatGameName, formatEventFormat } from '../lib/formatters';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EventEntry {
  userId: string;
  checkedInAt?: string;
  paidAt?: string;
  droppedAt?: string;
}

interface Event {
  id: string;
  name: string;
  game: string;
  format: string;
  status: string;
  startAt: string;
  maxPlayers?: number;
  entryFeeCents?: number;
  _count: {
    entries: number;
  };
  entries?: EventEntry[];
}

interface EventActionSheetProps {
  visible: boolean;
  event: Event | null;
  myUserId: string | null;
  onClose: () => void;
  onApply: (eventId: string) => void;
  onCheckIn: (eventId: string) => void;
  onViewPairings: (eventId: string) => void;
  onViewStandings: (eventId: string) => void;
  onViewMatch: (event: Event) => void;
  onDrop: (eventId: string) => void;
}

export const EventActionSheet: React.FC<EventActionSheetProps> = ({
  visible,
  event,
  myUserId,
  onClose,
  onApply,
  onCheckIn,
  onViewPairings,
  onViewStandings,
  onViewMatch,
  onDrop,
}) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!event) return null;

  const getMyEntry = (): EventEntry | null => {
    if (!myUserId || !event.entries) return null;
    return event.entries.find((entry) => entry.userId === myUserId) || null;
  };

  const myEntry = getMyEntry();
  const isRegistered = myEntry !== null;
  const isCheckedIn = myEntry?.checkedInAt !== undefined && myEntry?.checkedInAt !== null;
  const isDropped = myEntry?.droppedAt !== undefined && myEntry?.droppedAt !== null;
  const isPaid = myEntry?.paidAt !== undefined && myEntry?.paidAt !== null;
  const requiresPayment = event.entryFeeCents && event.entryFeeCents > 0;
  const canCheckIn = isRegistered && !isCheckedIn && !isDropped && (!requiresPayment || isPaid);

  const isUpcoming = event.status === 'SCHEDULED' || event.status === 'REGISTRATION_CLOSED';
  const isLive = event.status === 'IN_PROGRESS';

  const handleHaptic = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAction = (action: () => void) => {
    handleHaptic();
    onClose();
    setTimeout(action, 150); // Small delay for smoother UX
  };

  const getStatusInfo = () => {
    if (isDropped) {
      return { text: 'Dropped', color: theme.colors.error.main, bgColor: theme.colors.error.lightest };
    }
    if (isCheckedIn) {
      return { text: 'Checked In', color: theme.colors.success.dark, bgColor: theme.colors.success.lightest };
    }
    if (isRegistered) {
      if (requiresPayment && !isPaid) {
        return { text: 'Payment Required', color: theme.colors.warning.dark, bgColor: theme.colors.warning.lightest };
      }
      return { text: 'Registered', color: theme.colors.info.main, bgColor: theme.colors.info.lightest };
    }
    return null;
  };

  const statusInfo = getStatusInfo();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sheetContainer,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.sheet}>
          {/* Handle Bar */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Event Header */}
          <View style={styles.eventHeader}>
            <View style={styles.eventTitleRow}>
              <Text style={styles.eventName} numberOfLines={2}>
                {event.name}
              </Text>
              <View style={[styles.statusBadge, getStatusBadgeStyle(event.status)]}>
                <Text style={[styles.statusBadgeText, getStatusTextStyle(event.status)]}>
                  {event.status === 'IN_PROGRESS' ? 'LIVE' : event.status.replace('_', ' ')}
                </Text>
              </View>
            </View>

            <View style={styles.eventMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="game-controller" size={14} color={theme.colors.text.secondary} />
                <Text style={styles.metaText}>{formatGameName(event.game)}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="calendar" size={14} color={theme.colors.text.secondary} />
                <Text style={styles.metaText}>
                  {new Date(event.startAt).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="people" size={14} color={theme.colors.text.secondary} />
                <Text style={styles.metaText}>
                  {event._count.entries}{event.maxPlayers ? `/${event.maxPlayers}` : ''} players
                </Text>
              </View>
            </View>

            {/* Player Status Badge */}
            {statusInfo && (
              <View style={[styles.playerStatusBadge, { backgroundColor: statusInfo.bgColor }]}>
                <Ionicons
                  name={isCheckedIn ? 'checkmark-circle' : isDropped ? 'close-circle' : 'person'}
                  size={16}
                  color={statusInfo.color}
                />
                <Text style={[styles.playerStatusText, { color: statusInfo.color }]}>
                  {statusInfo.text}
                </Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {/* UPCOMING EVENT ACTIONS */}
            {isUpcoming && (
              <>
                {!isRegistered && event.status === 'SCHEDULED' && (
                  <ActionButton
                    icon="add-circle"
                    label="Apply for Event"
                    description="Register your spot in this tournament"
                    onPress={() => handleAction(() => onApply(event.id))}
                    variant="primary"
                  />
                )}

                {canCheckIn && (
                  <ActionButton
                    icon="checkmark-circle"
                    label="Check In"
                    description="Confirm your attendance"
                    onPress={() => handleAction(() => onCheckIn(event.id))}
                    variant="success"
                  />
                )}

                {isRegistered && !isCheckedIn && !isDropped && event.status === 'SCHEDULED' && (
                  <ActionButton
                    icon="remove-circle"
                    label="Withdraw Application"
                    description="Cancel your registration for this event"
                    onPress={() => handleAction(() => onDrop(event.id))}
                    variant="warning"
                  />
                )}

                {isRegistered && requiresPayment && !isPaid && (
                  <ActionButton
                    icon="card"
                    label="Payment Required"
                    description={`$${((event.entryFeeCents || 0) / 100).toFixed(2)} entry fee - Pay at venue`}
                    onPress={() => { }}
                    variant="warning"
                    disabled
                  />
                )}

                <ActionButton
                  icon="list"
                  label="View Pairings"
                  description="See tournament brackets when available"
                  onPress={() => handleAction(() => onViewPairings(event.id))}
                />

                <ActionButton
                  icon="trophy"
                  label="View Standings"
                  description="Check current rankings"
                  onPress={() => handleAction(() => onViewStandings(event.id))}
                />
              </>
            )}

            {/* LIVE EVENT ACTIONS */}
            {isLive && (
              <>
                {isCheckedIn && (
                  <ActionButton
                    icon="flash"
                    label="View Active Match"
                    description="Go to your current match"
                    onPress={() => handleAction(() => onViewMatch(event))}
                    variant="primary"
                  />
                )}

                {canCheckIn && (
                  <ActionButton
                    icon="checkmark-circle"
                    label="Check In"
                    description="You must check in to participate"
                    onPress={() => handleAction(() => onCheckIn(event.id))}
                    variant="success"
                  />
                )}

                <ActionButton
                  icon="grid"
                  label="Check Pairings"
                  description="See current round matchups"
                  onPress={() => handleAction(() => onViewPairings(event.id))}
                />

                <ActionButton
                  icon="podium"
                  label="Standings"
                  description="View current tournament standings"
                  onPress={() => handleAction(() => onViewStandings(event.id))}
                />

                {isCheckedIn && !isDropped && (
                  <ActionButton
                    icon="exit"
                    label="Drop from Tournament"
                    description="Withdraw from the event"
                    onPress={() => handleAction(() => onDrop(event.id))}
                    variant="danger"
                  />
                )}
              </>
            )}
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              handleHaptic();
              onClose();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

// Action Button Component
interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  description,
  onPress,
  variant = 'default',
  disabled = false,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: { backgroundColor: theme.colors.primary.main },
          icon: theme.colors.primary.foreground,
          label: { color: theme.colors.primary.foreground },
          description: { color: 'rgba(255,255,255,0.8)' },
        };
      case 'success':
        return {
          container: { backgroundColor: theme.colors.success.main },
          icon: theme.colors.neutral.white,
          label: { color: theme.colors.neutral.white },
          description: { color: 'rgba(255,255,255,0.8)' },
        };
      case 'warning':
        return {
          container: { backgroundColor: theme.colors.warning.lightest, borderColor: theme.colors.warning.main, borderWidth: 1 },
          icon: theme.colors.warning.dark,
          label: { color: theme.colors.warning.dark },
          description: { color: theme.colors.warning.main },
        };
      case 'danger':
        return {
          container: { backgroundColor: 'transparent', borderColor: theme.colors.error.main, borderWidth: 1 },
          icon: theme.colors.error.main,
          label: { color: theme.colors.error.main },
          description: { color: theme.colors.error.light },
        };
      default:
        return {
          container: { backgroundColor: theme.colors.background.elevated },
          icon: theme.colors.text.secondary,
          label: { color: theme.colors.text.primary },
          description: { color: theme.colors.text.tertiary },
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <TouchableOpacity
      style={[styles.actionButton, variantStyles.container, disabled && styles.actionButtonDisabled]}
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <View style={styles.actionButtonIcon}>
        <Ionicons name={icon} size={24} color={variantStyles.icon} />
      </View>
      <View style={styles.actionButtonContent}>
        <Text style={[styles.actionButtonLabel, variantStyles.label]}>{label}</Text>
        <Text style={[styles.actionButtonDescription, variantStyles.description]} numberOfLines={1}>
          {description}
        </Text>
      </View>
      {!disabled && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={variant === 'default' ? theme.colors.text.tertiary : variantStyles.icon}
        />
      )}
    </TouchableOpacity>
  );
};

// Helper functions for status badge styling
function getStatusBadgeStyle(status: string) {
  switch (status) {
    case 'SCHEDULED':
      return { backgroundColor: theme.colors.info.lightest };
    case 'IN_PROGRESS':
      return { backgroundColor: theme.colors.success.lightest };
    case 'REGISTRATION_CLOSED':
      return { backgroundColor: theme.colors.warning.lightest };
    default:
      return { backgroundColor: theme.colors.neutral[100] };
  }
}

function getStatusTextStyle(status: string) {
  switch (status) {
    case 'SCHEDULED':
      return { color: theme.colors.info.dark };
    case 'IN_PROGRESS':
      return { color: theme.colors.success.dark };
    case 'REGISTRATION_CLOSED':
      return { color: theme.colors.warning.dark };
    default:
      return { color: theme.colors.neutral[600] };
  }
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: theme.colors.background.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.neutral[500],
    borderRadius: 2,
  },
  eventHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  eventTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  eventName: {
    flex: 1,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  playerStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  playerStatusText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.light,
    marginHorizontal: 20,
  },
  actionsContainer: {
    padding: 16,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 14,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  actionButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonContent: {
    flex: 1,
  },
  actionButtonLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: 2,
  },
  actionButtonDescription: {
    fontSize: theme.typography.fontSize.sm,
  },
  cancelButton: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.background.elevated,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
});
