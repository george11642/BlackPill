import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { DarkTheme } from '../lib/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface OnboardingSlideProps {
  title: string;
  subtitle: string;
  emoji: string;
  description: string;
  accentColor?: string;
  isActive: boolean;
}

export function OnboardingSlide({
  title,
  subtitle,
  emoji,
  description,
  accentColor = DarkTheme.colors.primary,
  isActive,
}: OnboardingSlideProps) {
  const emojiScale = useSharedValue(0);
  const emojiRotate = useSharedValue(-30);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const descriptionOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      // Reset values
      emojiScale.value = 0;
      emojiRotate.value = -30;
      titleOpacity.value = 0;
      titleTranslateY.value = 30;
      subtitleOpacity.value = 0;
      descriptionOpacity.value = 0;
      glowOpacity.value = 0;

      // Animate in sequence
      emojiScale.value = withSpring(1, { damping: 8, stiffness: 100 });
      emojiRotate.value = withSpring(0, { damping: 10, stiffness: 80 });
      glowOpacity.value = withDelay(200, withTiming(0.6, { duration: 800 }));
      titleOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
      titleTranslateY.value = withDelay(300, withSpring(0, { damping: 12 }));
      subtitleOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
      descriptionOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    }
  }, [isActive]);

  const emojiAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: emojiScale.value },
      { rotate: `${emojiRotate.value}deg` },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const descriptionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: descriptionOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Background glow */}
      <Animated.View style={[styles.glowContainer, glowAnimatedStyle]}>
        <LinearGradient
          colors={[`${accentColor}30`, 'transparent']}
          style={styles.glow}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Emoji */}
      <Animated.View style={[styles.emojiContainer, emojiAnimatedStyle]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </Animated.View>

      {/* Title */}
      <Animated.View style={titleAnimatedStyle}>
        <Text style={[styles.title, { color: accentColor }]}>{title}</Text>
      </Animated.View>

      {/* Subtitle */}
      <Animated.View style={subtitleAnimatedStyle}>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Animated.View>

      {/* Description */}
      <Animated.View style={descriptionAnimatedStyle}>
        <Text style={styles.description}>{description}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DarkTheme.spacing.xl,
    paddingVertical: DarkTheme.spacing.xxl,
  },
  glowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.5,
  },
  glow: {
    flex: 1,
  },
  emojiContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${DarkTheme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DarkTheme.spacing.xl,
    borderWidth: 2,
    borderColor: `${DarkTheme.colors.primary}30`,
  },
  emoji: {
    fontSize: 56,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: DarkTheme.spacing.sm,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: DarkTheme.spacing.lg,
  },
  description: {
    fontSize: 16,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
});

export default OnboardingSlide;

