/**
 * Centralized Theme System for Genki TCG Mobile App
 *
 * Design Philosophy: Clean, sharp, minimal dark theme with red accent
 * No gradients - solid colors, clear hierarchy, sharp edges
 */

import { Platform } from 'react-native';

// Color Palette
export const colors = {
  // Primary Brand Colors (Genki Red)
  primary: {
    main: '#DC2626',
    light: '#EF4444',
    lighter: '#F87171',
    lightest: '#FEE2E2',
    dark: '#B91C1C',
    darker: '#991B1B',
    foreground: '#FFFFFF',
  },

  // Semantic Colors
  success: {
    main: '#10B981',
    light: '#34D399',
    lighter: '#6EE7B7',
    lightest: '#D1FAE5',
    dark: '#059669',
    darker: '#047857',
  },

  error: {
    main: '#EF4444',
    light: '#F87171',
    lightest: '#FEE2E2',
    dark: '#DC2626',
    darker: '#991B1B',
  },

  warning: {
    main: '#F59E0B',
    light: '#FBBF24',
    lightest: '#FEF3C7',
    dark: '#D97706',
    darker: '#B45309',
  },

  info: {
    main: '#3B82F6',
    light: '#60A5FA',
    lightest: '#DBEAFE',
    dark: '#2563EB',
    darker: '#1E40AF',
  },

  // Neutral Palette
  neutral: {
    white: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#09090B',
    black: '#000000',
  },

  // Background Colors (Dark Theme)
  background: {
    primary: '#09090B',
    secondary: '#0C0C0E',
    tertiary: '#111113',
    card: '#18181B',
    elevated: '#1F1F23',
    highlight: '#27272A',
  },

  // Text Colors (Dark Theme)
  text: {
    primary: '#FAFAFA',
    secondary: '#A1A1AA',
    tertiary: '#71717A',
    inverse: '#09090B',
    disabled: '#52525B',
    muted: '#71717A',
  },

  // Border Colors (Dark Theme)
  border: {
    light: '#27272A',
    main: '#3F3F46',
    dark: '#52525B',
    subtle: 'rgba(255, 255, 255, 0.06)',
    highlight: 'rgba(255, 255, 255, 0.1)',
  },

  // Rank Colors
  rank: {
    gold: '#FFD700',
    silver: '#C0C0C0',
    bronze: '#CD7F32',
  },
};

// Typography Scale
export const typography = {
  fontSize: {
    '2xs': 9,
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
    '6xl': 60,
  },

  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
  },

  lineHeight: {
    none: 1,
    tight: 1.2,
    snug: 1.35,
    normal: 1.5,
    relaxed: 1.65,
    loose: 1.8,
  },

  letterSpacing: {
    tighter: -1,
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
  },
};

// Spacing Scale (based on 4px grid)
export const spacing = {
  '2xs': 2,
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
  '6xl': 80,
};

// Border Radius
export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 6,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// Shadows
export const shadows = {
  none: Platform.select({
    web: { boxShadow: 'none' },
    default: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
  }),
  sm: Platform.select({
    web: { boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.3)' },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 1,
    },
  }),
  base: Platform.select({
    web: { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.4)' },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 2,
    },
  }),
  md: Platform.select({
    web: { boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.5)' },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 4,
    },
  }),
  lg: Platform.select({
    web: { boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.5)' },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 6,
    },
  }),
  xl: Platform.select({
    web: { boxShadow: '0px 12px 24px rgba(0, 0, 0, 0.6)' },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.6,
      shadowRadius: 24,
      elevation: 8,
    },
  }),
};

// Icon Sizes
export const iconSizes = {
  '2xs': 10,
  xs: 12,
  sm: 16,
  base: 20,
  md: 24,
  lg: 32,
  xl: 40,
  '2xl': 48,
};

// Animation Durations
export const animation = {
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 400,
};

// Status Badge Colors
export const statusColors = {
  scheduled: {
    background: 'rgba(59, 130, 246, 0.12)',
    text: colors.info.light,
  },
  inProgress: {
    background: 'rgba(16, 185, 129, 0.12)',
    text: colors.success.light,
  },
  completed: {
    background: 'rgba(113, 113, 122, 0.12)',
    text: colors.text.tertiary,
  },
  cancelled: {
    background: 'rgba(239, 68, 68, 0.12)',
    text: colors.error.light,
  },
  live: {
    background: 'rgba(16, 185, 129, 0.15)',
    text: colors.success.main,
  },
  pending: {
    background: 'rgba(245, 158, 11, 0.12)',
    text: colors.warning.light,
  },
  checkedIn: {
    background: 'rgba(16, 185, 129, 0.12)',
    text: colors.success.light,
  },
  notCheckedIn: {
    background: 'rgba(245, 158, 11, 0.12)',
    text: colors.warning.light,
  },
  paid: {
    background: 'rgba(59, 130, 246, 0.12)',
    text: colors.info.light,
  },
  unpaid: {
    background: 'rgba(239, 68, 68, 0.12)',
    text: colors.error.light,
  },
};

// Component-specific styles
export const componentStyles = {
  // Card Styles
  card: {
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
  },
  cardHighlight: {
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.primary.dark,
    borderRadius: borderRadius.lg,
  },
  cardElevated: {
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.main,
    borderRadius: borderRadius.lg,
  },

  // Button Styles
  buttonPrimary: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  buttonSecondary: {
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.main,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary.main,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },

  // Input Styles
  input: {
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
  },

  // Badge Styles
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
  },
  badgePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
};

// Header/Navigation Heights
export const layout = {
  headerHeight: Platform.select({ ios: 88, android: 64, default: 64 }),
  tabBarHeight: Platform.select({ ios: 84, android: 64, default: 64 }),
  statusBarHeight: Platform.select({ ios: 44, android: 24, default: 0 }),
  safeAreaTop: Platform.select({ ios: 44, android: 0, default: 0 }),
  safeAreaBottom: Platform.select({ ios: 34, android: 0, default: 0 }),
};

// Theme object
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  iconSizes,
  animation,
  statusColors,
  componentStyles,
  layout,
};

export type Theme = typeof theme;
