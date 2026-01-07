import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Award, X, Share2, CheckCircle } from 'lucide-react-native';
import { DarkTheme } from '../lib/theme';
import { GlassCard } from './GlassCard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GoalCelebrationModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'goal' | 'milestone';
  title: string;
  description?: string;
  achievementEarned?: {
    name: string;
    emoji: string;
  };
  onShare?: () => void;
}

export function GoalCelebrationModal({
  visible,
  onClose,
  type,
  title,
  description,
  achievementEarned,
  onShare,
}: GoalCelebrationModalProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const confettiOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Animate confetti first
      confettiOpacity.value = withTiming(1, { duration: 300 });
      
      // Then animate main content
      scale.value = withDelay(
        200,
        withSequence(
          withSpring(1.1, { damping: 8, stiffness: 100 }),
          withSpring(1, { damping: 10, stiffness: 100 })
        )
      );
      opacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    } else {
      scale.value = 0;
      opacity.value = 0;
      confettiOpacity.value = 0;
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Confetti Effect */}
        <Animated.View style={[styles.confettiContainer, confettiStyle]}>
          {Array.from({ length: 30 }).map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.confetti,
                {
                  left: `${(i * 100) / 30}%`,
                  animationDelay: `${i * 0.1}s`,
                  backgroundColor: [
                    DarkTheme.colors.primary,
                    DarkTheme.colors.accent,
                    DarkTheme.colors.success,
                    DarkTheme.colors.warning,
                  ][i % 4],
                },
              ]}
            />
          ))}
        </Animated.View>

        <Animated.View style={[styles.container, containerStyle]}>
          <Animated.View style={[styles.content, contentStyle]}>
            <GlassCard variant="gold" style={styles.card}>
              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color={DarkTheme.colors.textSecondary} />
              </TouchableOpacity>

              {/* Icon */}
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={[DarkTheme.colors.primary, DarkTheme.colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconGradient}
                >
                  {type === 'goal' ? (
                    <Award size={48} color={DarkTheme.colors.background} />
                  ) : (
                    <CheckCircle size={48} color={DarkTheme.colors.background} />
                  )}
                </LinearGradient>
              </View>

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Description */}
              {description && (
                <Text style={styles.description}>{description}</Text>
              )}

              {/* Achievement Badge */}
              {achievementEarned && (
                <View style={styles.achievementBadge}>
                  <Text style={styles.achievementEmoji}>
                    {achievementEarned.emoji}
                  </Text>
                  <Text style={styles.achievementName}>
                    {achievementEarned.name}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actions}>
                {onShare && (
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onShare();
                    }}
                  >
                    <Share2 size={18} color={DarkTheme.colors.primary} />
                    <Text style={styles.shareButtonText}>Share</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onClose();
                  }}
                >
                  <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    top: -10,
  },
  container: {
    width: SCREEN_WIDTH - 64,
    maxWidth: 400,
  },
  content: {
    width: '100%',
  },
  card: {
    padding: DarkTheme.spacing.xl,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: DarkTheme.spacing.md,
    right: DarkTheme.spacing.md,
    zIndex: 10,
  },
  iconContainer: {
    marginBottom: DarkTheme.spacing.lg,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: DarkTheme.spacing.sm,
  },
  description: {
    fontSize: 16,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: DarkTheme.spacing.lg,
    lineHeight: 22,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${DarkTheme.colors.primary}20`,
    paddingHorizontal: DarkTheme.spacing.md,
    paddingVertical: DarkTheme.spacing.sm,
    borderRadius: DarkTheme.borderRadius.full,
    marginBottom: DarkTheme.spacing.lg,
    gap: DarkTheme.spacing.sm,
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '600',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  actions: {
    width: '100%',
    gap: DarkTheme.spacing.sm,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DarkTheme.spacing.md,
    paddingHorizontal: DarkTheme.spacing.lg,
    borderRadius: DarkTheme.borderRadius.md,
    backgroundColor: `${DarkTheme.colors.primary}15`,
    borderWidth: 1,
    borderColor: DarkTheme.colors.primary,
    gap: DarkTheme.spacing.sm,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  continueButton: {
    paddingVertical: DarkTheme.spacing.md,
    paddingHorizontal: DarkTheme.spacing.lg,
    borderRadius: DarkTheme.borderRadius.md,
    backgroundColor: DarkTheme.colors.primary,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.background,
    fontFamily: DarkTheme.typography.fontFamily,
  },
});

