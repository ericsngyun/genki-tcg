/**
 * ConfirmationModal - A reusable confirmation dialog
 *
 * Used for confirming actions like:
 * - Applying for an event
 * - Dropping from a tournament
 * - Other destructive or important actions
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
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../lib/theme';

type ModalVariant = 'default' | 'success' | 'warning' | 'danger';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: ModalVariant;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  details?: { label: string; value: string }[];
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  icon = 'help-circle',
  variant = 'default',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
  details,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(style);
    }
  };

  const handleConfirm = () => {
    if (!loading) {
      handleHaptic(Haptics.ImpactFeedbackStyle.Medium);
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!loading) {
      handleHaptic();
      onCancel();
    }
  };

  const getVariantColors = () => {
    switch (variant) {
      case 'success':
        return {
          iconBg: theme.colors.success.lightest,
          iconColor: theme.colors.success.main,
          buttonBg: theme.colors.success.main,
          buttonText: theme.colors.neutral.white,
        };
      case 'warning':
        return {
          iconBg: theme.colors.warning.lightest,
          iconColor: theme.colors.warning.dark,
          buttonBg: theme.colors.warning.main,
          buttonText: theme.colors.neutral.white,
        };
      case 'danger':
        return {
          iconBg: theme.colors.error.lightest,
          iconColor: theme.colors.error.main,
          buttonBg: theme.colors.error.main,
          buttonText: theme.colors.neutral.white,
        };
      default:
        return {
          iconBg: theme.colors.primary.lightest,
          iconColor: theme.colors.primary.main,
          buttonBg: theme.colors.primary.main,
          buttonText: theme.colors.primary.foreground,
        };
    }
  };

  const colors = getVariantColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleCancel}
    >
      <TouchableWithoutFeedback onPress={handleCancel}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  opacity: opacityAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Icon */}
              <View style={[styles.iconContainer, { backgroundColor: colors.iconBg }]}>
                <Ionicons name={icon} size={32} color={colors.iconColor} />
              </View>

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Message */}
              <Text style={styles.message}>{message}</Text>

              {/* Details */}
              {details && details.length > 0 && (
                <View style={styles.detailsContainer}>
                  {details.map((detail, index) => (
                    <View key={index} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{detail.label}</Text>
                      <Text style={styles.detailValue}>{detail.value}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    { backgroundColor: colors.buttonBg },
                    loading && styles.buttonLoading,
                  ]}
                  onPress={handleConfirm}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.buttonText} size="small" />
                  ) : (
                    <Text style={[styles.confirmButtonText, { color: colors.buttonText }]}>
                      {confirmText}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: theme.colors.background.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...theme.shadows.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: theme.colors.background.elevated,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
  },
  detailValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  confirmButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  buttonLoading: {
    opacity: 0.8,
  },
});
