import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../lib/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: keyof typeof theme.spacing;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityRole?: 'none' | 'button' | 'header' | 'summary' | 'text';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'base',
  style,
  accessibilityLabel,
  accessibilityRole = 'none',
}) => {
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
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.base,
  },

  default: {
    ...theme.shadows.base,
  },

  elevated: {
    ...theme.shadows.md,
  },

  outlined: {
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    shadowOpacity: 0,
    elevation: 0,
  },
});
