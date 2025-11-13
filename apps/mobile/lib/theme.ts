/**
 * Centralized Theme System for Genki TCG Mobile App
 *
 * This file contains all design tokens including colors, typography, spacing,
 * and shadows to ensure consistency across the application.
 */

// Color Palette
export const colors = {
  // Primary Brand Colors
  primary: {
    main: '#4F46E5',      // Indigo
    light: '#6366F1',
    lighter: '#818CF8',
    lightest: '#E0E7FF',
    dark: '#4338CA',
    foreground: '#FFFFFF',
  },

  // Semantic Colors
  success: {
    main: '#10B981',
    light: '#34D399',
    lightest: '#D1FAE5',
    dark: '#059669',
  },

  error: {
    main: '#EF4444',
    light: '#F87171',
    lightest: '#FEE2E2',
    dark: '#991B1B',
  },

  warning: {
    main: '#F59E0B',
    light: '#FBBF24',
    lightest: '#FEF3C7',
    dark: '#D97706',
  },

  info: {
    main: '#1E40AF',
    light: '#3B82F6',
    lightest: '#DBEAFE',
    dark: '#1E3A8A',
  },

  // Neutral Palette
  neutral: {
    white: '#FFFFFF',
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#374151',
    700: '#1F2937',
    800: '#111827',
    900: '#000000',
  },

  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
  },

  // Text Colors
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
    disabled: '#D1D5DB',
  },

  // Border Colors
  border: {
    light: '#E5E7EB',
    main: '#D1D5DB',
    dark: '#9CA3AF',
  },
};

// Typography Scale
export const typography = {
  // Font Sizes
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  // Font Weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing Scale (based on 4px grid)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

// Border Radius
export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 8,
  },
};

// Icon Sizes
export const iconSizes = {
  xs: 12,
  sm: 16,
  base: 20,
  md: 24,
  lg: 32,
  xl: 40,
};

// Status Badge Colors
export const statusColors = {
  scheduled: {
    background: colors.info.lightest,
    text: colors.info.dark,
  },
  inProgress: {
    background: colors.success.lightest,
    text: colors.success.main,
  },
  completed: {
    background: colors.neutral[100],
    text: colors.neutral[700],
  },
  cancelled: {
    background: colors.error.lightest,
    text: colors.error.main,
  },
  paid: {
    background: colors.success.lightest,
    text: colors.success.main,
  },
  unpaid: {
    background: colors.warning.lightest,
    text: colors.warning.main,
  },
  checkedIn: {
    background: colors.success.lightest,
    text: colors.success.main,
  },
  notCheckedIn: {
    background: colors.neutral[100],
    text: colors.neutral[600],
  },
};

// Theme object that can be used with Context API later
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  iconSizes,
  statusColors,
};

export type Theme = typeof theme;
