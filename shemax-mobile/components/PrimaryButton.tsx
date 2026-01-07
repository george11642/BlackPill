import React from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Pressable,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { DarkTheme } from '../lib/theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = false,
}: PrimaryButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
    opacity.value = withTiming(0.9, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    opacity.value = withTiming(1, { duration: 150 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: 10,
          paddingHorizontal: 20,
          minHeight: 40,
          fontSize: 14,
        };
      case 'lg':
        return {
          paddingVertical: 18,
          paddingHorizontal: 40,
          minHeight: 60,
          fontSize: 18,
        };
      default:
        return {
          paddingVertical: 14,
          paddingHorizontal: 32,
          minHeight: 52,
          fontSize: 16,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const renderContent = () => (
    <View style={styles.contentRow}>
      {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? DarkTheme.colors.primary : DarkTheme.colors.background} />
      ) : (
        <Text
          style={[
            styles.text,
            { fontSize: sizeStyles.fontSize },
            variant === 'outline' && styles.textOutline,
            variant === 'ghost' && styles.textGhost,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
      {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
    </View>
  );

  if (variant === 'outline') {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          animatedStyle,
          styles.outlineContainer,
          {
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            minHeight: sizeStyles.minHeight,
          },
          fullWidth && styles.fullWidth,
          disabled && styles.disabled,
          style,
        ]}
      >
        {renderContent()}
      </AnimatedPressable>
    );
  }

  if (variant === 'ghost') {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          animatedStyle,
          styles.ghostContainer,
          {
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            minHeight: sizeStyles.minHeight,
          },
          fullWidth && styles.fullWidth,
          disabled && styles.disabled,
          style,
        ]}
      >
        {renderContent()}
      </AnimatedPressable>
    );
  }

  // Primary and secondary variants with gradient
  const gradientColors =
    variant === 'primary'
      ? [DarkTheme.colors.primaryDark, DarkTheme.colors.primary, DarkTheme.colors.primaryLight]
      : [DarkTheme.colors.primary, DarkTheme.colors.accent];

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        animatedStyle,
        styles.container,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.gradient,
          {
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            minHeight: sizeStyles.minHeight,
          },
        ]}
      >
        {renderContent()}
      </LinearGradient>
      {/* Glow effect */}
      <View style={styles.glow} />
    </AnimatedPressable>
  );
}

// Icon button variant
interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  variant?: 'default' | 'gold' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export function IconButton({
  icon,
  onPress,
  variant = 'default',
  size = 'md',
  style,
}: IconButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const dimension = size === 'sm' ? 36 : size === 'lg' ? 56 : 44;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        animatedStyle,
        styles.iconButton,
        variant === 'gold' && styles.iconButtonGold,
        variant === 'ghost' && styles.iconButtonGhost,
        { width: dimension, height: dimension, borderRadius: dimension / 2 },
        style,
      ]}
    >
      {icon}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: DarkTheme.borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    bottom: -10,
    left: '20%',
    right: '20%',
    height: 20,
    backgroundColor: DarkTheme.colors.primary,
    opacity: 0.3,
    borderRadius: 100,
    transform: [{ scaleX: 1.5 }],
  },
  outlineContainer: {
    borderRadius: DarkTheme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: DarkTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  ghostContainer: {
    borderRadius: DarkTheme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: DarkTheme.spacing.sm,
  },
  iconRight: {
    marginLeft: DarkTheme.spacing.sm,
  },
  text: {
    color: DarkTheme.colors.background,
    fontWeight: '600',
    fontFamily: DarkTheme.typography.fontFamily,
    letterSpacing: 0.5,
  },
  textOutline: {
    color: DarkTheme.colors.primary,
  },
  textGhost: {
    color: DarkTheme.colors.primary,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  // Icon button styles
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DarkTheme.colors.card,
    borderWidth: 1,
    borderColor: DarkTheme.colors.borderSubtle,
  },
  iconButtonGold: {
    backgroundColor: DarkTheme.colors.primary,
    borderColor: DarkTheme.colors.primary,
  },
  iconButtonGhost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
});

export default PrimaryButton;
