import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ChevronDown, Sparkles, Clock, MessageCircle } from 'lucide-react-native';
import { DarkTheme, getScoreColor } from '../lib/theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ScoreBarProps {
  label: string;
  value: number;
  maxValue?: number;
  delay?: number;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBar({
  label,
  value,
  maxValue = 10,
  delay = 0,
  showValue = true,
  size = 'md',
}: ScoreBarProps) {
  const progress = useSharedValue(0);
  const percentage = (value / maxValue) * 100;

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(percentage, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
  }, [value, percentage, delay]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value}%`,
    };
  });

  const barHeight = size === 'sm' ? 6 : size === 'lg' ? 12 : 8;
  const scoreColor = getScoreColor(value);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, size === 'sm' && styles.labelSmall]}>
          {label}
        </Text>
        {showValue && (
          <Text style={[styles.value, { color: scoreColor }]}>
            {value.toFixed(1)}
          </Text>
        )}
      </View>
      <View style={[styles.track, { height: barHeight }]}>
        <Animated.View style={[styles.fillContainer, animatedStyle]}>
          <LinearGradient
            colors={[DarkTheme.colors.primaryDark, DarkTheme.colors.primary, DarkTheme.colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.fill, { height: barHeight }]}
          />
        </Animated.View>
        {/* Glow effect */}
        <Animated.View 
          style={[
            styles.glow, 
            animatedStyle,
            { height: barHeight }
          ]} 
        />
      </View>
    </View>
  );
}

// Enhanced metric card with tap-to-expand details
interface ScoreMetricProps {
  label: string;
  value: number;
  delay?: number;
  description?: string;
  tip?: string;
  timeframe?: string;
  onAICoachPress?: () => void;
}

export function ScoreMetric({ 
  label, 
  value, 
  delay = 0,
  description,
  tip,
  timeframe,
  onAICoachPress
}: ScoreMetricProps) {
  const [expanded, setExpanded] = useState(false);
  const animatedValue = useSharedValue(0);
  const scoreColor = getScoreColor(value);
  const isHighScore = value >= 8;
  const isLowScore = value < 5;

  useEffect(() => {
    animatedValue.value = withDelay(
      delay,
      withTiming(value, {
        duration: 1000,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
  }, [value, delay]);

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(1, { duration: 300 }),
    };
  });

  const percentage = (value / 10) * 100;
  const progress = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const chevronRotation = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(percentage, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
    
    // Glow effect for high scores
    if (isHighScore) {
      glowOpacity.value = withDelay(
        delay + 800,
        withTiming(1, { duration: 500 })
      );
    }
  }, [percentage, delay, isHighScore]);

  useEffect(() => {
    chevronRotation.value = withSpring(expanded ? 180 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [expanded]);

  const animatedBarStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value}%`,
    };
  });

  const animatedGlowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value * 0.6,
    };
  });

  const animatedChevronStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${chevronRotation.value}deg` }],
    };
  });

  const handlePress = () => {
    if (description || tip) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpanded(!expanded);
    }
  };

  const hasDetails = description || tip;

  return (
    <TouchableOpacity 
      style={[
        styles.metricContainer,
        isHighScore && styles.metricContainerHighScore,
        isLowScore && styles.metricContainerLowScore,
      ]}
      onPress={handlePress}
      activeOpacity={hasDetails ? 0.7 : 1}
      disabled={!hasDetails}
    >
      {/* High score glow effect */}
      {isHighScore && (
        <Animated.View style={[styles.metricGlow, animatedGlowStyle]} />
      )}
      
      <View style={styles.metricHeader}>
        <Text style={styles.metricLabel}>{label}</Text>
        {hasDetails && (
          <Animated.View style={animatedChevronStyle}>
            <ChevronDown size={16} color={DarkTheme.colors.textTertiary} />
          </Animated.View>
        )}
      </View>
      
      <View style={styles.metricScoreRow}>
        <Animated.Text style={[styles.metricValue, { color: scoreColor }, animatedTextStyle]}>
          {value.toFixed(1)}
        </Animated.Text>
        {isHighScore && (
          <Sparkles size={20} color={DarkTheme.colors.primary} style={styles.sparkleIcon} />
        )}
      </View>
      
      <View style={styles.metricTrack}>
        <Animated.View style={[styles.metricFillContainer, animatedBarStyle]}>
          <LinearGradient
            colors={
              isHighScore 
                ? [DarkTheme.colors.primary, DarkTheme.colors.primaryLight]
                : isLowScore
                ? [DarkTheme.colors.error, DarkTheme.colors.warning]
                : [DarkTheme.colors.primaryDark, DarkTheme.colors.primary]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.metricFill}
          />
        </Animated.View>
      </View>

      {/* Expanded details section */}
      {expanded && (
        <View style={styles.expandedContent}>
          {description && (
            <Text style={styles.metricDescription}>{description}</Text>
          )}
          
          {tip && (
            <View style={styles.tipContainer}>
              <View style={styles.tipHeader}>
                <Sparkles size={14} color={DarkTheme.colors.primary} />
                <Text style={styles.tipLabel}>Improvement Tip</Text>
              </View>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          )}
          
          {timeframe && (
            <View style={styles.timeframeContainer}>
              <Clock size={12} color={DarkTheme.colors.textTertiary} />
              <Text style={styles.timeframeText}>Expected: {timeframe}</Text>
            </View>
          )}
          
          {onAICoachPress && isLowScore && (
            <TouchableOpacity style={styles.aiCoachButton} onPress={onAICoachPress}>
              <MessageCircle size={14} color={DarkTheme.colors.primary} />
              <Text style={styles.aiCoachText}>Ask AI Coach</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: DarkTheme.spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  labelSmall: {
    fontSize: 12,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  track: {
    backgroundColor: DarkTheme.colors.surface,
    borderRadius: DarkTheme.borderRadius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  fillContainer: {
    height: '100%',
    borderRadius: DarkTheme.borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
    borderRadius: DarkTheme.borderRadius.full,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: DarkTheme.colors.primary,
    opacity: 0.3,
    borderRadius: DarkTheme.borderRadius.full,
    shadowColor: DarkTheme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  // Metric styles (for grid layout)
  metricContainer: {
    flex: 1,
    minWidth: '45%',
    padding: DarkTheme.spacing.md,
    backgroundColor: DarkTheme.colors.card,
    borderRadius: DarkTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: DarkTheme.colors.borderSubtle,
    marginBottom: DarkTheme.spacing.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  metricContainerHighScore: {
    borderColor: DarkTheme.colors.primary,
    borderWidth: 1.5,
  },
  metricContainerLowScore: {
    borderColor: DarkTheme.colors.error,
    borderWidth: 1,
    opacity: 0.9,
  },
  metricGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: DarkTheme.colors.primary,
    borderRadius: DarkTheme.borderRadius.lg,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.xs,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 36,
    fontWeight: '700',
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.sm,
  },
  sparkleIcon: {
    marginLeft: DarkTheme.spacing.xs,
    marginBottom: DarkTheme.spacing.sm,
  },
  metricTrack: {
    height: 4,
    backgroundColor: DarkTheme.colors.surface,
    borderRadius: DarkTheme.borderRadius.full,
    overflow: 'hidden',
  },
  metricFillContainer: {
    height: '100%',
    borderRadius: DarkTheme.borderRadius.full,
    overflow: 'hidden',
  },
  metricFill: {
    flex: 1,
    height: '100%',
  },
  // Expanded content styles
  expandedContent: {
    marginTop: DarkTheme.spacing.md,
    paddingTop: DarkTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: DarkTheme.colors.borderSubtle,
  },
  metricDescription: {
    fontSize: 13,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    lineHeight: 18,
    marginBottom: DarkTheme.spacing.sm,
  },
  tipContainer: {
    backgroundColor: DarkTheme.colors.surface,
    borderRadius: DarkTheme.borderRadius.md,
    padding: DarkTheme.spacing.sm,
    marginBottom: DarkTheme.spacing.sm,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.xs,
  },
  tipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: DarkTheme.spacing.xs,
  },
  tipText: {
    fontSize: 12,
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    lineHeight: 16,
  },
  timeframeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeframeText: {
    fontSize: 11,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginLeft: DarkTheme.spacing.xs,
  },
  aiCoachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DarkTheme.colors.primaryDark,
    borderRadius: DarkTheme.borderRadius.md,
    paddingVertical: DarkTheme.spacing.sm,
    paddingHorizontal: DarkTheme.spacing.md,
    marginTop: DarkTheme.spacing.sm,
  },
  aiCoachText: {
    fontSize: 12,
    fontWeight: '600',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginLeft: DarkTheme.spacing.xs,
  },
});

export default ScoreBar;

