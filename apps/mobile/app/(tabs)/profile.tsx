import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/genki-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={48} color={theme.colors.text.secondary} />
          </View>
        </View>

        <Text style={styles.playerName}>Player Name</Text>
        <Text style={styles.playerEmail}>player@example.com</Text>

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
  header: {
    backgroundColor: theme.colors.background.card,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 42,
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
    marginBottom: 20,
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
