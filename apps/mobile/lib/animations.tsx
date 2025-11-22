/**
 * Animation Utilities for Genki TCG Mobile App
 *
 * Reusable animated components for smooth, professional UI transitions.
 * All animations use React Native's Animated API for 60fps performance.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface AnimatedViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  duration?: number;
}

/**
 * FadeInView - Fades in content with opacity animation
 * @param delay - Delay before animation starts (ms)
 * @param duration - Animation duration (ms)
 */
export const FadeInView: React.FC<AnimatedViewProps> = ({
  children,
  style,
  delay = 0,
  duration = 400,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity }]}>
      {children as any}
    </Animated.View>
  );
};

/**
 * SlideUpView - Slides content up from bottom with fade
 * @param delay - Delay before animation starts (ms)
 * @param duration - Animation duration (ms)
 */
export const SlideUpView: React.FC<AnimatedViewProps> = ({
  children,
  style,
  delay = 0,
  duration = 500,
}) => {
  const translateY = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { transform: [{ translateY }], opacity }]}>
      {children as any}
    </Animated.View>
  );
};

/**
 * ScaleInView - Scales content from 95% to 100% with fade
 * @param delay - Delay before animation starts (ms)
 * @param duration - Animation duration (ms)
 */
export const ScaleInView: React.FC<AnimatedViewProps> = ({
  children,
  style,
  delay = 0,
  duration = 400,
}) => {
  const scale = useRef(new Animated.Value(0.95)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        delay,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration / 2,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { transform: [{ scale }], opacity }]}>
      {children as any}
    </Animated.View>
  );
};

/**
 * PulseView - Gentle pulse animation for loading states
 * Continuously pulses between 100% and 80% opacity
 */
export const PulseView: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
}> = ({ children, style }) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(opacity, {
        toValue: 0.8,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulse).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity }]}>
      {children as any}
    </Animated.View>
  );
};

/**
 * StaggeredListView - For animating list items with a stagger effect
 * Each child appears with a slight delay after the previous one
 */
interface StaggeredListViewProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  style?: ViewStyle;
}

export const StaggeredListView: React.FC<StaggeredListViewProps> = ({
  children,
  staggerDelay = 50,
  style,
}) => {
  return (
    <Animated.View style={style}>
      {React.Children.map(children, (child, index) => (
        <SlideUpView key={index} delay={index * staggerDelay}>
          {child}
        </SlideUpView>
      ))}
    </Animated.View>
  );
};

/**
 * ShimmerView - Skeleton loading shimmer effect
 * Used for loading states that mimic content structure
 */
export const ShimmerView: React.FC<{
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}> = ({ width, height, borderRadius = 8, style }) => {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.sequence([
      Animated.timing(shimmerValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(shimmerValue, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(shimmer).start();
  }, []);

  const opacity = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: '#27272A',
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * Hook for creating press animation
 * Returns animated value and handlers for TouchableOpacity
 */
export const usePressAnimation = () => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  return {
    scale,
    onPressIn,
    onPressOut,
    animatedStyle: { transform: [{ scale }] },
  };
};

/**
 * Shared transition values for consistent animations across the app
 */
export const transitions = {
  fast: 200,
  normal: 300,
  slow: 500,
  verySlow: 800,
};

/**
 * Easing presets
 */
export const easings = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};
