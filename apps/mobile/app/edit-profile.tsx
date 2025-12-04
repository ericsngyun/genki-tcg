import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import { shadows } from '../lib/shadows';
import { api } from '../lib/api';
import { logger } from '../lib/logger';
import { RankedAvatar, mapRatingToTier } from '../components/RankedAvatar';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  discordUsername?: string;
}

interface GameRank {
  gameType: string;
  rating: number;
  deviation: number;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ranks, setRanks] = useState<GameRank[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const [userResponse, ranksResponse] = await Promise.all([
        api.getMe(),
        api.getMyRanks().catch(() => ({ ranks: [] })),
      ]);
      const userData = userResponse.user || userResponse;
      setUser(userData);
      setName(userData.name || '');
      if (ranksResponse?.ranks) {
        setRanks(ranksResponse.ranks);
      }
    } catch (error) {
      logger.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      await api.updateProfile({ name: name.trim() });
      Alert.alert('Success', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      logger.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Profile Information</Text>

          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={theme.colors.text.tertiary}
              autoCapitalize="words"
              maxLength={50}
            />
            <Text style={styles.helperText}>This name will be displayed publicly</Text>
          </View>

          {/* Email (Read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.input, styles.inputReadonly]}>
              <Text style={styles.inputReadonlyText}>{user?.email}</Text>
            </View>
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>

          {/* Discord (Read-only) */}
          {user?.discordUsername && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Discord</Text>
              <View style={[styles.input, styles.inputReadonly]}>
                <Ionicons name="logo-discord" size={16} color="#5865F2" style={{ marginRight: 8 }} />
                <Text style={styles.inputReadonlyText}>{user.discordUsername}</Text>
              </View>
              <Text style={styles.helperText}>Manage Discord in Settings</Text>
            </View>
          )}
        </View>

        {/* Avatar Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Profile Picture</Text>
          <View style={styles.avatarSection}>
            <RankedAvatar
              avatarUrl={user?.avatarUrl}
              name={user?.name || 'Unknown'}
              tier={ranks.length > 0 ? mapRatingToTier(ranks[0].rating) : 'UNRANKED'}
              size={80}
              showTierBadge={true}
            />
            <View style={styles.avatarInfo}>
              <Text style={styles.avatarTitle}>Discord Avatar</Text>
              <Text style={styles.avatarSubtext}>
                {user?.discordUsername
                  ? 'Your Discord avatar will be used'
                  : 'Link Discord account to use avatar'}
              </Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={theme.colors.primary.foreground} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary.foreground} />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Danger Zone */}
        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>Account Management</Text>
          <Text style={styles.dangerSubtext}>
            For account deletion or other sensitive actions, please contact support.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    ...shadows.sm,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.background.elevated,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  inputReadonly: {
    backgroundColor: theme.colors.background.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputReadonlyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  helperText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginTop: 4,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarInfo: {
    flex: 1,
  },
  avatarTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  avatarSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary.main,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    marginBottom: 16,
    gap: 8,
    ...shadows.primary,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary.foreground,
  },
  dangerCard: {
    backgroundColor: theme.colors.error.main + '10',
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.error.main + '30',
  },
  dangerTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.error.main,
    marginBottom: 8,
  },
  dangerSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
});
