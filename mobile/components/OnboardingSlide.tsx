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

// Custom BlackPill Icon Component - matches the app logo
function BlackPillIcon() {
  return (
    <View style={pillStyles.container}>
      {/* Outer glow effect */}
      <View style={pillStyles.glowOuter} />
      <View style={pillStyles.glowInner} />
      
      {/* The pill capsule - rotated 45 degrees */}
      <View style={pillStyles.pillWrapper}>
        {/* Gold half (top-left) */}
        <LinearGradient
          colors={['#FFD700', '#DAA520', '#B8860B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={pillStyles.pillHalfGold}
        >
          {/* Shine highlight */}
          <View style={pillStyles.shineGold} />
        </LinearGradient>
        
        {/* Black half (bottom-right) */}
        <LinearGradient
          colors={['#3a3a3a', '#1a1a1a', '#0a0a0a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={pillStyles.pillHalfBlack}
        >
          {/* Shine highlight */}
          <View style={pillStyles.shineBlack} />
        </LinearGradient>
        
        {/* Gold border/rim around the pill */}
        <View style={pillStyles.pillBorder} />
      </View>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  container: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  glowInner: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  pillWrapper: {
    width: 70,
    height: 28,
    flexDirection: 'row',
    transform: [{ rotate: '-45deg' }],
    borderRadius: 14,
    overflow: 'hidden',
    // Gold shadow/glow
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 12,
  },
  pillHalfGold: {
    flex: 1,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    position: 'relative',
  },
  pillHalfBlack: {
    flex: 1,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    position: 'relative',
  },
  shineGold: {
    position: 'absolute',
    top: 5,
    left: 6,
    width: 12,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  shineBlack: {
    position: 'absolute',
    top: 5,
    right: 6,
    width: 8,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  pillBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DAA520',
  },
});

export interface OnboardingSlideProps {
  title: string;
  subtitle: string;
  emoji: string;
  description: string;
  accentColor?: string;
  isActive: boolean;
  useCustomIcon?: boolean;
}

export function OnboardingSlide({
  title,
  subtitle,
  emoji,
  description,
  accentColor = DarkTheme.colors.primary,
  isActive,
  useCustomIcon = false,
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

      {/* Icon/Emoji */}
      <Animated.View style={[useCustomIcon ? styles.customIconContainer : styles.emojiContainer, emojiAnimatedStyle]}>
        {useCustomIcon ? <BlackPillIcon /> : <Text style={styles.emoji}>{emoji}</Text>}
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
  customIconContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DarkTheme.spacing.xl,
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

