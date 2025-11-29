import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { DarkTheme } from '../lib/theme';

interface GlassCardProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'gold' | 'subtle';
  onPress?: () => void;
  noPadding?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlassCard({
  children,
  style,
  variant = 'default',
  onPress,
  noPadding = false,
}: GlassCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withTiming(0.98, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withTiming(1, { duration: 150 });
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          container: styles.containerElevated,
          border: DarkTheme.colors.borderSubtle,
        };
      case 'gold':
        return {
          container: styles.containerGold,
          border: DarkTheme.colors.borderGold,
        };
      case 'subtle':
        return {
          container: styles.containerSubtle,
          border: 'transparent',
        };
      default:
        return {
          container: styles.containerDefault,
          border: DarkTheme.colors.borderSubtle,
        };
    }
  };

  const variantStyles = getVariantStyles();

  const content = (
    <View style={[styles.container, variantStyles.container, { borderColor: variantStyles.border }, style]}>
      {variant === 'gold' && (
        <LinearGradient
          colors={['rgba(212, 175, 55, 0.1)', 'rgba(212, 175, 55, 0.02)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <BlurView intensity={15} tint="dark" style={styles.blur}>
        <View style={[styles.content, noPadding && styles.noPadding]}>
          {children}
        </View>
      </BlurView>
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return content;
}

// Specialized card for displaying scores
interface ScoreCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ScoreCard({ children, style }: ScoreCardProps) {
  return (
    <View style={[styles.scoreCard, style]}>
      <LinearGradient
        colors={[DarkTheme.colors.card, DarkTheme.colors.cardElevated]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.scoreCardBorder} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: DarkTheme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  containerDefault: {
    backgroundColor: DarkTheme.colors.glass,
  },
  containerElevated: {
    backgroundColor: DarkTheme.colors.cardElevated,
    ...DarkTheme.shadows.md,
  },
  containerGold: {
    backgroundColor: DarkTheme.colors.glass,
    ...DarkTheme.shadows.gold,
  },
  containerSubtle: {
    backgroundColor: DarkTheme.colors.card,
  },
  blur: {
    flex: 1,
  },
  content: {
    padding: DarkTheme.spacing.md,
  },
  noPadding: {
    padding: 0,
  },
  // Score card styles
  scoreCard: {
    borderRadius: DarkTheme.borderRadius.xl,
    overflow: 'hidden',
    padding: DarkTheme.spacing.lg,
    position: 'relative',
    ...DarkTheme.shadows.lg,
  },
  scoreCardBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: DarkTheme.borderRadius.xl,
    borderWidth: 1,
    borderColor: DarkTheme.colors.borderGold,
  },
});

export default GlassCard;
