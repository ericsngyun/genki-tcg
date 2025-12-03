import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { theme } from '../lib/theme';
import { shadows } from '../lib/shadows';
import { api } from '../lib/api';
import { AppHeader } from '../components';
import { logger } from '../lib/logger';

interface NotificationPreference {
  notificationType: string;
  enableInApp: boolean;
  enablePush: boolean;
  enableEmail: boolean;
}

const notificationTypeLabels: Record<string, { label: string; description: string }> = {
  EVENT_PUBLISHED: {
    label: 'Event Published',
    description: 'When a new event is created',
  },
  EVENT_UPDATED: {
    label: 'Event Updated',
    description: 'When event details change',
  },
  EVENT_CANCELLED: {
    label: 'Event Cancelled',
    description: 'When an event is cancelled',
  },
  PAIRINGS_POSTED: {
    label: 'Pairings Posted',
    description: 'When round pairings are available',
  },
  ROUND_STARTED: {
    label: 'Round Started',
    description: 'When a round begins',
  },
  MATCH_RESULT_REPORTED: {
    label: 'Match Result Reported',
    description: 'When your match result is reported',
  },
  MATCH_RESULT_CONFIRMED: {
    label: 'Match Result Confirmed',
    description: 'When your match result is confirmed',
  },
  TOURNAMENT_COMPLETED: {
    label: 'Tournament Completed',
    description: 'When a tournament ends',
  },
  PRIZES_DISTRIBUTED: {
    label: 'Prizes Distributed',
    description: 'When you win a prize',
  },
  PLAYER_REGISTERED: {
    label: 'Player Registered',
    description: 'When a player registers (admins only)',
  },
  PLAYER_DROPPED: {
    label: 'Player Dropped',
    description: 'When a player drops (admins only)',
  },
  EVENT_STARTING_SOON: {
    label: 'Event Starting Soon',
    description: 'Reminder before event starts',
  },
};

export default function NotificationPreferencesScreen() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const data = await api.getNotificationPreferences();
      setPreferences(data);
    } catch (error) {
      logger.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (
    notificationType: string,
    field: 'enableInApp' | 'enablePush' | 'enableEmail',
    value: boolean
  ) => {
    setUpdating(notificationType);
    try {
      await api.updateNotificationPreference(notificationType, { [field]: value });
      setPreferences(prev =>
        prev.map(pref =>
          pref.notificationType === notificationType ? { ...pref, [field]: value } : pref
        )
      );
    } catch (error) {
      logger.error('Error updating preference:', error);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Notification Preferences" subtitle="Manage your alerts" showBackButton />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Notification Preferences" subtitle="Choose how you get notified" showBackButton />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info Section */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Control which notifications you receive and how you receive them. Changes are saved automatically.
          </Text>
        </View>

        {/* Preferences List */}
        {preferences.map((pref) => {
          const typeInfo = notificationTypeLabels[pref.notificationType];
          if (!typeInfo) return null;

          const isUpdating = updating === pref.notificationType;

          return (
            <View key={pref.notificationType} style={styles.preferenceCard}>
              <View style={styles.preferenceHeader}>
                <Text style={styles.preferenceTitle}>{typeInfo.label}</Text>
                <Text style={styles.preferenceDescription}>{typeInfo.description}</Text>
              </View>

              <View style={styles.preferenceSwitches}>
                {/* In-App */}
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>In-App</Text>
                  <Switch
                    value={pref.enableInApp}
                    onValueChange={(value) =>
                      updatePreference(pref.notificationType, 'enableInApp', value)
                    }
                    trackColor={{
                      false: theme.colors.neutral[600],
                      true: theme.colors.primary.main + '60',
                    }}
                    thumbColor={pref.enableInApp ? theme.colors.primary.main : theme.colors.neutral[400]}
                    disabled={isUpdating}
                  />
                </View>

                {/* Push */}
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Push</Text>
                  <Switch
                    value={pref.enablePush}
                    onValueChange={(value) =>
                      updatePreference(pref.notificationType, 'enablePush', value)
                    }
                    trackColor={{
                      false: theme.colors.neutral[600],
                      true: theme.colors.primary.main + '60',
                    }}
                    thumbColor={pref.enablePush ? theme.colors.primary.main : theme.colors.neutral[400]}
                    disabled={isUpdating}
                  />
                </View>

                {/* Email - Currently disabled */}
                <View style={[styles.switchRow, styles.disabledRow]}>
                  <Text style={[styles.switchLabel, styles.disabledText]}>Email</Text>
                  <Switch
                    value={false}
                    disabled
                    trackColor={{
                      false: theme.colors.neutral[700],
                      true: theme.colors.neutral[600],
                    }}
                    thumbColor={theme.colors.neutral[500]}
                  />
                </View>
              </View>

              {isUpdating && (
                <View style={styles.updatingOverlay}>
                  <ActivityIndicator size="small" color={theme.colors.primary.main} />
                </View>
              )}
            </View>
          );
        })}

        {/* Email Coming Soon Notice */}
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Email Notifications</Text>
          <Text style={styles.noticeText}>
            Email notifications are coming soon. For now, you'll receive notifications via in-app and push only.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...shadows.sm,
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  preferenceCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...shadows.sm,
  },
  preferenceHeader: {
    marginBottom: 12,
  },
  preferenceTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  preferenceSwitches: {
    gap: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.background.elevated,
    borderRadius: theme.borderRadius.sm,
  },
  disabledRow: {
    opacity: 0.5,
  },
  switchLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  disabledText: {
    color: theme.colors.text.tertiary,
  },
  updatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.background.card + 'AA',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },
  noticeCard: {
    backgroundColor: theme.colors.info.main + '20',
    borderRadius: theme.borderRadius.md,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.info.main + '40',
  },
  noticeTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.info.main,
    marginBottom: 8,
  },
  noticeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
});
