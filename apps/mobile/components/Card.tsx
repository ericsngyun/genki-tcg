import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../lib/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient';
  padding?: keyof typeof theme.spacing;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityRole?: 'none' | 'button' | 'header' | 'summary' | 'text';
  withGradient?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'base',
  style,
  accessibilityLabel,
  accessibilityRole = 'none',
  withGradient = false,
}) => {
  // If gradient variant or withGradient is true, use LinearGradient
  if (variant === 'gradient' || withGradient) {
    return (
      <LinearGradient
        colors={[theme.colors.background.card, theme.colors.background.elevated]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.base,
          styles.elevated,
          { padding: theme.spacing[padding] },
          style,
        ]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
      >
        {children as any}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.base,
        styles[variant],
        { padding: theme.spacing[padding] },
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
    >
      {children as any}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },

  default: {
    ...theme.shadows.base,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },

  elevated: {
    ...theme.shadows.lg,
    backgroundColor: theme.colors.background.elevated,
  },

  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    shadowOpacity: 0,
    elevation: 0,
  },

  gradient: {
    ...theme.shadows.md,
  },
});
