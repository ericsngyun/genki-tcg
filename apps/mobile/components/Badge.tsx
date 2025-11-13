import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../lib/theme';

type BadgeVariant =
  | 'primary'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'neutral'
  | 'checkedIn'
  | 'notCheckedIn'
  | 'paid'
  | 'unpaid';

interface BadgeProps {
  children: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const variantStyles = getVariantStyles(variant);

  return (
    <View
      style={[
        styles.base,
        variantStyles.container,
        styles[`${size}Container`],
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel || `${children} badge`}
    >
      <Text
        style={[
          styles.text,
          variantStyles.text,
          styles[`${size}Text`],
          textStyle,
        ]}
      >
        {children}
      </Text>
    </View>
  );
};

const getVariantStyles = (variant: BadgeVariant) => {
  const variantMap = {
    primary: {
      container: { backgroundColor: theme.colors.primary.lightest },
      text: { color: theme.colors.primary.dark },
    },
    success: {
      container: { backgroundColor: theme.colors.success.lightest },
      text: { color: theme.colors.success.main },
    },
    error: {
      container: { backgroundColor: theme.colors.error.lightest },
      text: { color: theme.colors.error.main },
    },
    warning: {
      container: { backgroundColor: theme.colors.warning.lightest },
      text: { color: theme.colors.warning.main },
    },
    info: {
      container: { backgroundColor: theme.colors.info.lightest },
      text: { color: theme.colors.info.main },
    },
    neutral: {
      container: { backgroundColor: theme.colors.neutral[100] },
      text: { color: theme.colors.neutral[700] },
    },
    checkedIn: {
      container: { backgroundColor: theme.statusColors.checkedIn.background },
      text: { color: theme.statusColors.checkedIn.text },
    },
    notCheckedIn: {
      container: { backgroundColor: theme.statusColors.notCheckedIn.background },
      text: { color: theme.statusColors.notCheckedIn.text },
    },
    paid: {
      container: { backgroundColor: theme.statusColors.paid.background },
      text: { color: theme.statusColors.paid.text },
    },
    unpaid: {
      container: { backgroundColor: theme.statusColors.unpaid.background },
      text: { color: theme.statusColors.unpaid.text },
    },
  };

  return variantMap[variant];
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },

  smContainer: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },

  mdContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },

  text: {
    fontWeight: theme.typography.fontWeight.medium,
  },

  smText: {
    fontSize: theme.typography.fontSize.xs,
  },

  mdText: {
    fontSize: theme.typography.fontSize.sm,
  },
});
