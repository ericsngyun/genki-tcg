import { Platform, ViewStyle } from 'react-native';

/**
 * Professional shadow system for iOS and Android
 * Provides elevation-based shadows with proper platform handling
 */

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ViewStyle,

  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
  }) as ViewStyle,

  base: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
  }) as ViewStyle,

  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    android: {
      elevation: 5,
    },
  }) as ViewStyle,

  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: {
      elevation: 8,
    },
  }) as ViewStyle,

  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
    },
    android: {
      elevation: 12,
    },
  }) as ViewStyle,

  // Colored shadows for special elements
  primary: Platform.select({
    ios: {
      shadowColor: '#A3E635',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
    },
    android: {
      elevation: 6,
    },
  }) as ViewStyle,

  success: Platform.select({
    ios: {
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
    },
    android: {
      elevation: 5,
    },
  }) as ViewStyle,

  error: Platform.select({
    ios: {
      shadowColor: '#EF4444',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
    },
    android: {
      elevation: 5,
    },
  }) as ViewStyle,
};

/**
 * Inner shadow effect (simulated with borders and gradients)
 */
export const innerShadow = {
  sm: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  } as ViewStyle,

  md: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  } as ViewStyle,
};
