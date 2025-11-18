import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { formatGameName, formatEventFormat } from '../../lib/formatters';
import { theme } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';

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
  entries?: Array<{
    userId: string;
    checkedInAt?: string;
    paidAt?: string;
  }>;
}

export default function EventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load user data
      const userData = await api.getMe();
      setMyUserId(userData.user.id);

      // Load scheduled and in-progress events
      const scheduledEvents = await api.getEvents('SCHEDULED');
      const inProgressEvents = await api.getEvents('IN_PROGRESS');
      setEvents([...inProgressEvents, ...scheduledEvents]);
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

  const handleRegister = async (eventId: string) => {
    try {
      await api.registerForEvent(eventId);
      alert('Successfully registered!');
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to register');
    }
  };

  const handleCheckIn = async (eventId: string) => {
    setCheckingIn(eventId);
    try {
      await api.selfCheckIn(eventId);
      alert('Successfully checked in!');
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to check in');
    } finally {
      setCheckingIn(null);
    }
  };

  const getMyEntry = (event: Event) => {
    if (!myUserId || !event.entries) return null;
    return event.entries.find((entry) => entry.userId === myUserId);
  };

  const isRegistered = (event: Event) => {
    return getMyEntry(event) !== null;
  };

  const isCheckedIn = (event: Event) => {
    const entry = getMyEntry(event);
    return entry?.checkedInAt !== undefined && entry?.checkedInAt !== null;
  };

  const canCheckIn = (event: Event) => {
    const entry = getMyEntry(event);
    if (!entry || isCheckedIn(event)) return false;

    // If event has entry fee, must be paid first
    const requiresPayment = event.entryFeeCents && event.entryFeeCents > 0;
    if (requiresPayment && !entry.paidAt) return false;

    return true;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary.main}
        />
      }
    >
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/genki-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Upcoming Events</Text>
        <Text style={styles.subtitle}>
          Register for tournaments and track your matches
        </Text>
      </View>

      {events.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No upcoming events</Text>
        </View>
      ) : (
        <View style={styles.eventList}>
          {events.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventName}>{event.name}</Text>
                <View style={[styles.statusBadge, getStatusStyle(event.status)]}>
                  <Text style={styles.statusText}>
                    {event.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>

              <View style={styles.eventDetails}>
                <Text style={styles.detailText}>🎮 {formatGameName(event.game)}</Text>
                <Text style={styles.detailText}>📋 {formatEventFormat(event.format)}</Text>
                <Text style={styles.detailText}>
                  📅 {new Date(event.startAt).toLocaleDateString()}
                </Text>
                <Text style={styles.detailText}>
                  👥 {event._count.entries}
                  {event.maxPlayers && `/${event.maxPlayers}`} players
                </Text>
              </View>

              {isRegistered(event) ? (
                <View>
                  {/* Check-in Status */}
                  <View style={styles.statusRow}>
                    {isCheckedIn(event) ? (
                      <View style={styles.checkedInBadge}>
                        <Text style={styles.checkedInText}>✓ Checked In</Text>
                      </View>
                    ) : (
                      <>
                        {event.entryFeeCents && event.entryFeeCents > 0 ? (
                          getMyEntry(event)?.paidAt ? (
                            <View style={styles.paidBadge}>
                              <Text style={styles.paidText}>Paid - Ready to Check In</Text>
                            </View>
                          ) : (
                            <View style={styles.unpaidBadge}>
                              <Text style={styles.unpaidText}>
                                Payment Required (${(event.entryFeeCents / 100).toFixed(2)})
                              </Text>
                            </View>
                          )
                        ) : (
                          <View style={styles.registeredBadge}>
                            <Text style={styles.registeredText}>Registered - Not Checked In</Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>

                  {/* Check-in Button */}
                  {canCheckIn(event) && (
                    <TouchableOpacity
                      style={styles.checkInButton}
                      onPress={() => handleCheckIn(event.id)}
                      disabled={checkingIn === event.id}
                    >
                      <Text style={styles.checkInButtonText}>
                        {checkingIn === event.id ? 'Checking In...' : 'Check In Now'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() =>
                        router.push({
                          pathname: '/pairings',
                          params: { eventId: event.id },
                        })
                      }
                    >
                      <Text style={styles.actionButtonText}>View Pairings</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() =>
                        router.push({
                          pathname: '/standings',
                          params: { eventId: event.id },
                        })
                      }
                    >
                      <Text style={styles.actionButtonText}>View Standings</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={() => handleRegister(event.id)}
                >
                  <Text style={styles.registerButtonText}>Register</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'SCHEDULED':
      return { backgroundColor: '#DBEAFE' };
    case 'IN_PROGRESS':
      return { backgroundColor: '#D1FAE5' };
    default:
      return { backgroundColor: '#F3F4F6' };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 42,
    marginBottom: 16,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  eventList: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.base,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.md,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.info.dark,
  },
  eventDetails: {
    marginBottom: 16,
  },
  detailText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  registerButton: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: theme.borderRadius.base,
    paddingVertical: 12,
    alignItems: 'center',
  },
  registerButtonText: {
    color: theme.colors.primary.foreground,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  statusRow: {
    marginBottom: 12,
  },
  checkedInBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  checkedInText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
  },
  paidBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  paidText: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '600',
  },
  unpaidBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  unpaidText: {
    color: '#B45309',
    fontSize: 14,
    fontWeight: '600',
  },
  registeredBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  registeredText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  checkInButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  checkInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.background.elevated,
    borderRadius: theme.borderRadius.base,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  actionButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.tertiary,
  },
});
