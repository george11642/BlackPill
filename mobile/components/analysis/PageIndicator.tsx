import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { DarkTheme } from '../../lib/theme';

interface PageIndicatorProps {
  count: number;
  activeIndex: number;
  labels?: string[];
  onPagePress?: (index: number) => void;
}

export function PageIndicator({
  count,
  activeIndex,
  labels,
  onPagePress,
}: PageIndicatorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.dotsContainer}>
        {Array.from({ length: count }).map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => onPagePress?.(index)}
            activeOpacity={0.7}
            disabled={!onPagePress}
          >
            <AnimatedDot isActive={index === activeIndex} />
          </TouchableOpacity>
        ))}
      </View>
      {labels && labels[activeIndex] && (
        <Text style={styles.label}>{labels[activeIndex]}</Text>
      )}
    </View>
  );
}

function AnimatedDot({ isActive }: { isActive: boolean }) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(isActive ? 24 : 8, { damping: 15, stiffness: 200 }),
      backgroundColor: isActive
        ? DarkTheme.colors.primary
        : DarkTheme.colors.border,
    };
  }, [isActive]);

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: DarkTheme.spacing.sm,
    paddingHorizontal: DarkTheme.spacing.lg,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.xs,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  label: {
    marginTop: DarkTheme.spacing.xs,
    fontSize: 12,
    fontWeight: '600',
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default PageIndicator;
