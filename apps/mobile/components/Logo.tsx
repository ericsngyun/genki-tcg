import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../lib/theme';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  style 
}) => {
  const sizeConfig = {
    small: {
      mainFontSize: theme.typography.fontSize['3xl'],
      imageSize: 56,
      gap: theme.spacing.sm,
    },
    medium: {
      mainFontSize: theme.typography.fontSize['4xl'],
      imageSize: 72,
      gap: theme.spacing.md,
    },
    large: {
      mainFontSize: theme.typography.fontSize['5xl'],
      imageSize: 88,
      gap: theme.spacing.md,
    },
  };

  const config = sizeConfig[size];

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.titleMain, { fontSize: config.mainFontSize }]}>
        GENKI
      </Text>
      <Image
        source={require('../assets/images/genki-head.png')}
        style={[styles.logoImage, { width: config.imageSize, height: config.imageSize }]}
        resizeMode="contain"
      />
    </View>
  );
};

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

