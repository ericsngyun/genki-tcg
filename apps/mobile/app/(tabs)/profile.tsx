import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { Logo } from '../../components';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  discordUsername?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await api.getMe();
      setUser(response.user || response);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Logo size="medium" />
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          {user?.avatarUrl ? (
            <Image
              source={{ uri: user.avatarUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={48} color={theme.colors.text.secondary} />
            </View>
          )}
        </View>

        <Text style={styles.playerName}>{user?.name || 'Unknown Player'}</Text>
        <Text style={styles.playerEmail}>{user?.email || 'No email'}</Text>
        {user?.discordUsername && (
          <View style={styles.discordBadge}>
            <Ionicons name="logo-discord" size={16} color="#5865F2" />
            <Text style={styles.discordUsername}>{user.discordUsername}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.editProfileButton}>
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Events Played</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0%</Text>
          <Text style={styles.statLabel}>Win Rate</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Achievements</Text>
        </View>
      </View>

      {/* Coming Soon Notice */}
      <View style={styles.comingSoonCard}>
        <Ionicons name="construct" size={40} color={theme.colors.primary.main} />
        <Text style={styles.comingSoonTitle}>Profile Features Coming Soon</Text>
        <Text style={styles.comingSoonText}>
          Player statistics, match history, achievements, and more will be available in a future update.
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: theme.colors.background.card,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: theme.colors.background.card,
    margin: 16,
    borderRadius: theme.borderRadius.lg,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: theme.colors.border.main,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border.main,
  },
  playerName: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  playerEmail: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  discordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(88, 101, 242, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    marginBottom: 16,
  },
  discordUsername: {
    fontSize: theme.typography.fontSize.sm,
    color: '#5865F2',
    marginLeft: 6,
    fontWeight: theme.typography.fontWeight.medium,
  },
  editProfileButton: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.base,
  },
  editProfileText: {
    color: theme.colors.primary.foreground,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  statValue: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.main,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  comingSoonCard: {
    backgroundColor: theme.colors.background.card,
    margin: 16,
    borderRadius: theme.borderRadius.lg,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  comingSoonTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
