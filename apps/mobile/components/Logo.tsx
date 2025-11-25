import React, { memo } from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../lib/theme';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  showText?: boolean;
}

export const Logo = memo<LogoProps>(({
  size = 'medium',
  style,
  showText = true
}) => {
  const sizeConfig = {
    small: {
      mainFontSize: theme.typography.fontSize['2xl'],
      imageSize: 48,
      gap: theme.spacing.sm,
    },
    medium: {
      mainFontSize: theme.typography.fontSize['3xl'],
      imageSize: 64,
      gap: theme.spacing.md,
    },
    large: {
      mainFontSize: theme.typography.fontSize['4xl'],
      imageSize: 80,
      gap: theme.spacing.md,
    },
  };

  const config = sizeConfig[size];

  return (
    <View style={[styles.container, style]}>
      {showText && (
        <Text style={[styles.titleMain, { fontSize: config.mainFontSize }]}>
          GENKI
        </Text>
      )}
      <Image
        source={require('../assets/images/genki.avif')}
        style={[styles.logoImage, { width: config.imageSize, height: config.imageSize }]}
        resizeMode="contain"
        fadeDuration={0}
      />
    </View>
  );
});

Logo.displayName = 'Logo';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  titleMain: {
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.text.primary,
    letterSpacing: -1.5,
  },
  logoImage: {
    // Image will be sized based on config
  },
});

