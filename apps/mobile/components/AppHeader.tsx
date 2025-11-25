import React, { memo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, Animated } from 'react-native';
import { Logo } from './Logo';
import { theme } from '../lib/theme';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
  showLogo?: boolean;
  logoSize?: 'small' | 'medium' | 'large';
  animated?: boolean;
}

export const AppHeader = memo<AppHeaderProps>(({
  title,
  subtitle,
  style,
  showLogo = true,
  logoSize = 'small',
  animated = true
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animated, fadeAnim, slideAnim]);

  const animatedStyle = animated
    ? {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }
    : {};

  return (
    <Animated.View style={[styles.header, animatedStyle, style]}>
      {showLogo && (
        <View style={styles.logoContainer}>
          <Logo size={logoSize} />
        </View>
      )}
      {title && (
        <Text style={styles.title}>{title}</Text>
      )}
      {subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
    </Animated.View>
  );
});

AppHeader.displayName = 'AppHeader';

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginTop: 4,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
