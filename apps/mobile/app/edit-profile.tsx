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
  ActionSheetIOS,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../lib/theme';
import { shadows } from '../lib/shadows';
import { api } from '../lib/api';
import { logger } from '../lib/logger';
import { TIER_COLORS } from '../components/TierEmblem';
import { RankedAvatar } from '../components';

// Cloudinary configuration for image uploads
// Set these environment variables for image hosting:
// EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME - Your Cloudinary cloud name
// EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET - Unsigned upload preset name
const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

async function uploadImageToCloudinary(base64Image: string): Promise<string | null> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    logger.warn('Cloudinary not configured - image upload disabled');
    return null;
  }

  try {
    const formData = new FormData();
    formData.append('file', `data:image/jpeg;base64,${base64Image}`);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    }
    logger.error('Cloudinary upload failed:', data);
    return null;
  } catch (error) {
    logger.error('Failed to upload image to Cloudinary:', error);
    return null;
  }
}

// Storage key for border preference
export const BORDER_PREFERENCE_KEY = 'profile_border_game';

// Player Tier type
type PlayerTier =
  | 'BRONZE'
  | 'SILVER'
  | 'GOLD'
  | 'PLATINUM'
  | 'DIAMOND'
  | 'GENKI'
  | 'UNRANKED';

// Map rating to tier (synced with backend thresholds)
function mapRatingToTier(rating: number): PlayerTier {
  if (rating >= 2150) return 'GENKI';
  if (rating >= 1950) return 'DIAMOND';
  if (rating >= 1750) return 'PLATINUM';
  if (rating >= 1550) return 'GOLD';
  if (rating >= 1350) return 'SILVER';
  if (rating >= 1200) return 'BRONZE';
  return 'UNRANKED';
}

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

// Game options for border selection (clean design - no emojis)
const GAME_OPTIONS = [
  { value: 'HIGHEST', label: 'Highest Tier', color: '#FFD700' },
  { value: 'ONE_PIECE_TCG', label: 'One Piece TCG', color: '#DC2626' },
  { value: 'AZUKI_TCG', label: 'Azuki TCG', color: '#8B5CF6' },
  { value: 'RIFTBOUND', label: 'Riftbound', color: '#3B82F6' },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [ranks, setRanks] = useState<GameRank[]>([]);
  const [selectedBorderGame, setSelectedBorderGame] = useState('HIGHEST');

  useEffect(() => {
    loadProfile();
    loadBorderPreference();
  }, []);

  const loadProfile = async () => {
    try {
      const [userResponse, ratingsResponse] = await Promise.all([
        api.getMe(),
        api.getMyLifetimeRatings().catch(() => ({ categories: [] })),
      ]);
      const userData = userResponse.user || userResponse;
      setUser(userData);
      setName(userData.name || '');
      setAvatarUrl(userData.avatarUrl || undefined);

      // Map categories to ranks format (category -> gameType)
      if (ratingsResponse?.categories) {
        const mappedRanks = ratingsResponse.categories.map((cat: any) => ({
          gameType: cat.category,
          rating: cat.rating,
          deviation: cat.ratingDeviation || 350,
          matchesPlayed: cat.matchesPlayed || 0,
          wins: cat.matchWins || 0,
          losses: cat.matchLosses || 0,
          draws: cat.matchDraws || 0,
        }));
        setRanks(mappedRanks);
      }
    } catch (error) {
      logger.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadBorderPreference = async () => {
    try {
      const saved = await AsyncStorage.getItem(BORDER_PREFERENCE_KEY);
      if (saved) {
        setSelectedBorderGame(saved);
      }
    } catch (error) {
      logger.debug('Failed to load border preference:', error);
    }
  };

  const saveBorderPreference = async (game: string) => {
    try {
      await AsyncStorage.setItem(BORDER_PREFERENCE_KEY, game);
      setSelectedBorderGame(game);
    } catch (error) {
      logger.error('Failed to save border preference:', error);
    }
  };

  const pickImage = async (useCamera: boolean = false) => {
    try {
      // Request permissions
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Photo library permission is needed to select photos.');
          return;
        }
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true, // Enables cropping with circular guide
        aspect: [1, 1], // Square aspect ratio for profile pictures
        quality: 0.8,
        base64: true,
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // Use the local URI immediately for preview
        setAvatarUrl(asset.uri);

        // Upload to Cloudinary if configured
        if (asset.base64) {
          setUploadingImage(true);
          const uploadedUrl = await uploadImageToCloudinary(asset.base64);
          if (uploadedUrl) {
            setAvatarUrl(uploadedUrl);
            logger.debug('Image uploaded successfully:', uploadedUrl);
          } else {
            // Cloudinary not configured or upload failed
            // Keep local URI and show warning
            logger.warn('Image upload not available - Cloudinary not configured');
            Alert.alert(
              'Image Upload Not Available',
              'Profile picture upload requires Cloudinary configuration. You can still use the photo locally, but it won\'t be saved to your profile.',
              [{ text: 'OK' }]
            );
            // Reset to original avatar
            setAvatarUrl(user?.avatarUrl || undefined);
          }
          setUploadingImage(false);
        }
      }
    } catch (error) {
      logger.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
      setUploadingImage(false);
    }
  };

  const showImagePickerOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library', 'Remove Photo'],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            pickImage(true);
          } else if (buttonIndex === 2) {
            pickImage(false);
          } else if (buttonIndex === 3) {
            setAvatarUrl(undefined);
          }
        }
      );
    } else {
      Alert.alert(
        'Change Profile Photo',
        'Choose an option',
        [
          { text: 'Take Photo', onPress: () => pickImage(true) },
          { text: 'Choose from Library', onPress: () => pickImage(false) },
          { text: 'Remove Photo', onPress: () => setAvatarUrl(undefined), style: 'destructive' },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    if (uploadingImage) {
      Alert.alert('Please Wait', 'Image is still uploading...');
      return;
    }

    setSaving(true);
    try {
      // Build update payload
      const updates: { name: string; avatarUrl?: string } = { name: name.trim() };

      // Only include avatarUrl if it changed
      const originalAvatarUrl = user?.avatarUrl || undefined;
      if (avatarUrl !== originalAvatarUrl) {
        // Check if it's a valid URL (not a local file URI)
        if (avatarUrl && avatarUrl.startsWith('file://')) {
          Alert.alert('Error', 'Image upload failed. Please try selecting the image again.');
          setSaving(false);
          return;
        }
        updates.avatarUrl = avatarUrl || '';
      }

      await api.updateProfile(updates);
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

  // Get tier based on selection - use backend tier if available
  const getDisplayTier = (): PlayerTier => {
    if (selectedBorderGame === 'HIGHEST') {
      if (ranks.length === 0) return 'UNRANKED';
      const highestRank = ranks.reduce((highest, current) =>
        current.rating > highest.rating ? current : highest
      );
      return highestRank.tier || mapRatingToTier(highestRank.rating);
    }
    const gameRank = ranks.find(r => r.gameType === selectedBorderGame);
    if (!gameRank) return 'UNRANKED';
    return gameRank.tier || mapRatingToTier(gameRank.rating);
  };

  const displayTier = getDisplayTier();
  const tierColors = TIER_COLORS[displayTier];

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
        {/* Avatar Preview */}
        <View style={styles.avatarPreviewCard}>
          <Text style={styles.sectionTitle}>Profile Preview</Text>
          <View style={styles.avatarPreviewContainer}>
            <TouchableOpacity
              style={styles.avatarEditContainer}
              onPress={showImagePickerOptions}
              activeOpacity={0.8}
              disabled={uploadingImage}
            >
              <RankedAvatar
                avatarUrl={avatarUrl}
                name={user?.name || 'Unknown'}
                tier={displayTier}
                size={120}
              />
              <View style={styles.avatarEditOverlay}>
                {uploadingImage ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={20} color="#fff" />
                )}
              </View>
              <View style={styles.avatarEditBadge}>
                <Ionicons name="pencil" size={12} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to change photo</Text>
            <View style={styles.previewInfo}>
              <Text style={styles.previewName}>{name || user?.name}</Text>
              {displayTier !== 'UNRANKED' && (
                <View style={[styles.previewTierBadge, { backgroundColor: `${tierColors.primary}20` }]}>
                  <Text style={[styles.previewTierText, { color: tierColors.primary }]}>
                    {displayTier}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Border Selection */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Display Border</Text>
          <Text style={styles.sectionSubtext}>
            Choose which game's tier to display on your profile
          </Text>
          <View style={styles.borderOptions}>
            {GAME_OPTIONS.map((option) => {
              const isSelected = selectedBorderGame === option.value;
              const gameRank = option.value === 'HIGHEST'
                ? null
                : ranks.find(r => r.gameType === option.value);
              // Use tier from backend if available
              const optionTier = option.value === 'HIGHEST'
                ? (ranks.length > 0
                    ? (ranks.reduce((h, c) => c.rating > h.rating ? c : h).tier || mapRatingToTier(Math.max(...ranks.map(r => r.rating))))
                    : 'UNRANKED')
                : (gameRank ? (gameRank.tier || mapRatingToTier(gameRank.rating)) : 'UNRANKED');

              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.borderOption,
                    isSelected && styles.borderOptionSelected,
                    isSelected && { borderColor: tierColors.primary }
                  ]}
                  onPress={() => saveBorderPreference(option.value)}
                >
                  <View style={[styles.borderOptionDot, { backgroundColor: option.color }]} />
                  <View style={styles.borderOptionInfo}>
                    <Text style={[
                      styles.borderOptionLabel,
                      isSelected && { color: theme.colors.text.primary }
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={styles.borderOptionTier}>
                      {optionTier}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={tierColors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

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

  // Avatar Preview
  avatarPreviewCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...shadows.sm,
  },
  avatarPreviewContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatarEditContainer: {
    position: 'relative',
  },
  avatarEditOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background.card,
  },
  avatarHint: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginTop: 8,
  },
  previewInfo: {
    alignItems: 'center',
    marginTop: 12,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  previewTierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  previewTierText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Cards
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
    marginBottom: 4,
  },
  sectionSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: 16,
  },

  // Border Options
  borderOptions: {
    gap: 10,
  },
  borderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.elevated,
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  borderOptionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  borderOptionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  borderOptionInfo: {
    flex: 1,
  },
  borderOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  borderOptionTier: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Input styles
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

  // Save button
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

  // Danger zone
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
