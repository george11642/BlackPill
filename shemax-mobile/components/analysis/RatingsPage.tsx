import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import ViewShot from 'react-native-view-shot';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Share2 } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';

import { ProfileAvatar } from '../ProfileAvatar';
import { ScoreMetric } from '../ScoreBar';
import { PrimaryButton } from '../PrimaryButton';
import { DarkTheme, getScoreColor } from '../../lib/theme';
import { AnalysisPageProps, getRatingCategory, getCategoryColor } from './types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RatingsPageProps extends AnalysisPageProps {
  onShare?: () => void;
}

export function RatingsPage({
  analysis,
  metrics,
  navigation,
  isUnblurred,
  isActive,
  onShare,
}: RatingsPageProps) {
  const viewShotRef = useRef<ViewShot>(null);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const scoreScale = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      startAnimations();
    }
  }, [isActive]);

  const startAnimations = () => {
    headerOpacity.value = withTiming(1, { duration: 400 });
    scoreScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 100 }));
    contentOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const scoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const handleShareScreenshot = async () => {
    if (!viewShotRef.current) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const uri = await viewShotRef.current.capture?.();
      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your results',
        });
      }
    } catch (error) {
      console.error('Failed to share screenshot:', error);
      // Fallback to text share
      onShare?.();
    }
  };

  const potentialScore = analysis.potential_score || Math.min(10, analysis.score + 1.5);

  return (
    <View style={styles.container}>
      <ViewShot
        ref={viewShotRef}
        options={{ format: 'png', quality: 0.9 }}
        style={styles.captureArea}
      >
        {/* Profile Photo with Watermark */}
        <Animated.View style={[styles.avatarContainer, headerAnimatedStyle]}>
          <ProfileAvatar
            imageUrl={analysis.image_url}
            size="lg"
            showGoldRing
          />
          <View style={styles.watermarkContainer}>
            <Text style={styles.watermarkText}>SheMax</Text>
          </View>
        </Animated.View>

        {/* Main Scores */}
        <Animated.View style={[styles.scoresContainer, scoreAnimatedStyle]}>
          <View style={styles.scoreColumn}>
            <Text style={styles.scoreLabel}>Overall</Text>
            <Text style={[styles.mainScore, { color: getScoreColor(analysis.score) }]}>
              {analysis.score.toFixed(1)}
            </Text>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(analysis.score) }]}>
              <Text style={styles.categoryText}>{getRatingCategory(analysis.score)}</Text>
            </View>
          </View>

          <View style={styles.scoreDivider} />

          <View style={styles.scoreColumn}>
            <Text style={styles.scoreLabel}>Potential</Text>
            <Text style={[styles.mainScore, { color: getScoreColor(potentialScore) }]}>
              {potentialScore.toFixed(1)}
            </Text>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(potentialScore) }]}>
              <Text style={styles.categoryText}>{getRatingCategory(potentialScore)}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Metrics Grid - 2x4 layout with expandable details */}
        <Animated.View style={[styles.metricsGrid, contentAnimatedStyle]}>
          {metrics.map((metric, index) => (
            <View key={metric.key} style={styles.metricWrapper}>
              <ScoreMetric
                label={metric.label}
                value={metric.value}
                delay={0}
                description={metric.description}
                tip={metric.improvement}
              />
            </View>
          ))}
        </Animated.View>
      </ViewShot>

      {/* Share Button - Outside capture area */}
      <Animated.View style={[styles.shareContainer, contentAnimatedStyle]}>
        <PrimaryButton
          title="Share Results"
          onPress={handleShareScreenshot}
          variant="primary"
          icon={<Share2 size={18} color={DarkTheme.colors.background} />}
          style={styles.shareButton}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: DarkTheme.spacing.lg,
  },
  captureArea: {
    backgroundColor: DarkTheme.colors.background,
    paddingVertical: DarkTheme.spacing.md,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.lg,
  },
  watermarkContainer: {
    marginTop: DarkTheme.spacing.sm,
    paddingHorizontal: DarkTheme.spacing.md,
    paddingVertical: DarkTheme.spacing.xs,
    backgroundColor: 'rgba(232, 160, 191, 0.15)',
    borderRadius: DarkTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 191, 0.3)',
  },
  watermarkText: {
    fontSize: 12,
    fontWeight: '600',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.lg,
    paddingHorizontal: DarkTheme.spacing.md,
  },
  scoreColumn: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: DarkTheme.spacing.xs,
  },
  mainScore: {
    fontSize: 56,
    fontWeight: '700',
    fontFamily: DarkTheme.typography.fontFamily,
    letterSpacing: -2,
  },
  scoreDivider: {
    width: 1,
    height: 70,
    backgroundColor: DarkTheme.colors.borderSubtle,
    marginHorizontal: DarkTheme.spacing.md,
  },
  categoryBadge: {
    paddingHorizontal: DarkTheme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: DarkTheme.spacing.xs,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricWrapper: {
    width: '48%',
    marginBottom: DarkTheme.spacing.sm,
  },
  shareContainer: {
    paddingVertical: DarkTheme.spacing.lg,
    alignItems: 'center',
  },
  shareButton: {
    minWidth: 200,
  },
});

export default RatingsPage;
