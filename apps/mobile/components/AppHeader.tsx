import React, { memo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, Animated, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from './Logo';
import { theme } from '../lib/theme';
import { shadows } from '../lib/shadows';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
  showLogo?: boolean;
  logoSize?: 'small' | 'medium' | 'large';
  animated?: boolean;
  showBackButton?: boolean;
}

export const AppHeader = memo<AppHeaderProps>(({
  title,
  subtitle,
  style,
  showLogo = true,
  logoSize = 'small',
  animated = true,
  showBackButton = false
}) => {
  const router = useRouter();
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
    <Animated.View style={[
      styles.header,
      !showLogo && styles.headerCompact,
      animatedStyle,
      style
    ]}>
      {showBackButton && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
      )}
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
    ...shadows.sm,
  },
  headerCompact: {
    paddingTop: 50,
    paddingBottom: 12,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 52,
    zIndex: 10,
    padding: 4,
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
    opacity: 0.8,
  },
});
