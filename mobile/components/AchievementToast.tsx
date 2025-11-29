import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Award } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { achievementEvents, AchievementEvent } from '../lib/achievements/events';
import { DarkTheme } from '../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_WIDTH = SCREEN_WIDTH - 40;

export function AchievementToast() {
  const [currentAchievement, setCurrentAchievement] = useState<AchievementEvent | null>(null);
  const [queue, setQueue] = useState<AchievementEvent[]>([]);
  
  const translateY = useSharedValue(-150);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const emojiScale = useSharedValue(0);

  useEffect(() => {
    const unsubscribe = achievementEvents.subscribe((achievement) => {
      setQueue(prev => [...prev, achievement]);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (queue.length > 0 && !currentAchievement) {
      const [next, ...rest] = queue;
      setQueue(rest);
      showAchievement(next);
    }
  }, [queue, currentAchievement]);

  const showAchievement = (achievement: AchievementEvent) => {
    setCurrentAchievement(achievement);
    
    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animate in
    translateY.value = withSpring(60, { damping: 15, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 300 });
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
    emojiScale.value = withDelay(
      200,
      withSequence(
        withSpring(1.3, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 10, stiffness: 150 })
      )
    );

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      hideAchievement();
    }, 4000);
  };

  const hideAchievement = () => {
    translateY.value = withTiming(-150, { duration: 300, easing: Easing.in(Easing.ease) });
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(setCurrentAchievement)(null);
    });
    scale.value = withTiming(0.8, { duration: 300 });
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }));

  if (!currentAchievement) return null;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <LinearGradient
        colors={[DarkTheme.colors.primaryDark, '#1a1a1a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.iconContainer}>
          <Animated.Text style={[styles.emoji, emojiStyle]}>
            {currentAchievement.emoji}
          </Animated.Text>
        </View>
        <View style={styles.content}>
          <View style={styles.header}>
            <Award size={14} color={DarkTheme.colors.primary} />
            <Text style={styles.headerText}>Achievement Unlocked!</Text>
          </View>
          <Text style={styles.title}>{currentAchievement.name}</Text>
          <Text style={styles.description} numberOfLines={1}>
            {currentAchievement.description}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    elevation: 9999,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DarkTheme.colors.borderGold,
    shadowColor: DarkTheme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${DarkTheme.colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  emoji: {
    fontSize: 28,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '600',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
});

export default AchievementToast;

