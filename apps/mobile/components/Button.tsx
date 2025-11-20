import React from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Animated,
  Pressable,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../lib/theme';
import { usePressAnimation } from '../lib/animations';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const isDisabled = disabled || loading;
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation();

  const handlePress = () => {
    if (!isDisabled) {
      // Haptic feedback on press (iOS and Android only, not web)
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || children}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      <Animated.View
        style={[
          styles.base,
          styles[variant],
          styles[`${size}Container`],
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          animatedStyle,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={
              variant === 'outline' || variant === 'ghost'
                ? theme.colors.primary.main
                : theme.colors.neutral.white
            }
            size="small"
          />
        ) : (
          <Text
            style={[
              styles.text,
              styles[`${variant}Text`],
              styles[`${size}Text`],
              isDisabled && styles.disabledText,
              textStyle,
            ]}
          >
            {children}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.base,
    ...theme.shadows.sm,
  },

  // Variants
  primary: {
    backgroundColor: theme.colors.primary.main,
  },
  secondary: {
    backgroundColor: theme.colors.neutral[100],
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary.main,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: theme.colors.error.main,
  },

  // Sizes
  smContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 32,
  },
  mdContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 44,
  },
  lgContainer: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.base,
    minHeight: 52,
  },

  // Text Styles
  text: {
    fontWeight: theme.typography.fontWeight.semibold,
  },
  primaryText: {
    color: theme.colors.text.inverse,
  },
  secondaryText: {
    color: theme.colors.text.primary,
  },
  outlineText: {
    color: theme.colors.primary.main,
  },
  ghostText: {
    color: theme.colors.primary.main,
  },
  dangerText: {
    color: theme.colors.text.inverse,
  },

  smText: {
    fontSize: theme.typography.fontSize.sm,
  },
  mdText: {
    fontSize: theme.typography.fontSize.base,
  },
  lgText: {
    fontSize: theme.typography.fontSize.md,
  },

  // States
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: theme.colors.text.disabled,
  },
  fullWidth: {
    width: '100%',
  },
});
