import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { TrendingUp, Users, Award } from 'lucide-react-native';

import { BellCurve } from '../BellCurve';
import { GlassCard } from '../GlassCard';
import { BlurredContent } from '../BlurredContent';
import { DarkTheme } from '../../lib/theme';
import { AnalysisPageProps, getRatingCategory, getCategoryColor } from './types';

// Progress level distribution data
const CATEGORY_DISTRIBUTION = [
  { name: 'Elite', range: '9.5+', percent: 0.1, color: '#AA44FF' },
  { name: 'Excellent', range: '8-9.4', percent: 2, color: '#44AAFF' },
  { name: 'Above Average', range: '7-7.9', percent: 8, color: '#44CC88' },
  { name: 'Average', range: '5.5-6.9', percent: 25, color: '#88CC44' },
  { name: 'Developing', range: '4.5-5.4', percent: 35, color: '#FFAA44' },
  { name: 'Foundation', range: '3-4.4', percent: 22, color: '#FF8844' },
  { name: 'Starting', range: '<3', percent: 7.9, color: '#FF4444' },
];

// Success stats based on score ranges (hardcoded motivational data)
const getSuccessStats = (score: number) => {
  if (score >= 7) {
    return {
      avgImprovement: '0.3-0.5',
      topFocusAreas: ['Skin Quality', 'Symmetry'],
      timeframe: '3 months',
    };
  } else if (score >= 5) {
    return {
      avgImprovement: '0.5-1.0',
      topFocusAreas: ['Jawline', 'Skin Quality', 'Hair'],
      timeframe: '3 months',
    };
  } else {
    return {
      avgImprovement: '1.0-1.5',
      topFocusAreas: ['Skin Quality', 'Hair', 'Jawline'],
      timeframe: '3-6 months',
    };
  }
};

interface RankingPageProps extends AnalysisPageProps {}

export function RankingPage({
  analysis,
  isUnblurred,
  isActive,
}: RankingPageProps) {
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      contentOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    }
  }, [isActive]);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const userCategory = getRatingCategory(analysis.score);
  const successStats = getSuccessStats(analysis.score);

  return (
    <Animated.View style={[styles.container, contentAnimatedStyle]}>
      <BlurredContent isBlurred={!isUnblurred}>
        {/* Bell Curve Distribution */}
        <GlassCard variant="subtle" style={styles.section}>
          <Text style={styles.sectionTitle}>Your Journey</Text>
          <BellCurve score={analysis.score} delay={isActive ? 200 : 0} />
        </GlassCard>

        {/* Progress Levels */}
        <GlassCard variant="subtle" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={18} color={DarkTheme.colors.primary} />
            <Text style={styles.sectionTitle}>Progress Levels</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Your position on the improvement scale
          </Text>

          <View style={styles.distributionContainer}>
            {CATEGORY_DISTRIBUTION.map((category) => {
              const isUserCategory = category.name === userCategory;
              return (
                <View
                  key={category.name}
                  style={[
                    styles.categoryRow,
                    isUserCategory && styles.categoryRowActive,
                  ]}
                >
                  <View style={styles.categoryInfo}>
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: category.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.categoryName,
                        isUserCategory && styles.categoryNameActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                    <Text style={styles.categoryRange}>({category.range})</Text>
                  </View>
                  <View style={styles.categoryBarContainer}>
                    <View
                      style={[
                        styles.categoryBar,
                        {
                          width: `${Math.min(category.percent * 2.5, 100)}%`,
                          backgroundColor: isUserCategory
                            ? category.color
                            : DarkTheme.colors.border,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.categoryPercent,
                        isUserCategory && { color: category.color },
                      ]}
                    >
                      {category.percent}%
                    </Text>
                  </View>
                  {isUserCategory && (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>YOU</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </GlassCard>

        {/* Success Stats */}
        <GlassCard variant="elevated" style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={18} color={DarkTheme.colors.success} />
            <Text style={styles.sectionTitle}>Users Like You</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{successStats.avgImprovement}</Text>
              <Text style={styles.statLabel}>
                Avg. improvement in {successStats.timeframe}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={styles.focusAreas}>
                {successStats.topFocusAreas.slice(0, 2).map((area, index) => (
                  <View key={area} style={styles.focusTag}>
                    <Text style={styles.focusTagText}>{area}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.statLabel}>Top focus areas for improvement</Text>
            </View>
          </View>

          <View style={styles.motivationBox}>
            <Award size={20} color={DarkTheme.colors.primary} />
            <Text style={styles.motivationText}>
              With consistent effort, users in your range typically see significant
              improvements within {successStats.timeframe}. Stay committed!
            </Text>
          </View>
        </GlassCard>
      </BlurredContent>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: DarkTheme.spacing.lg,
    paddingTop: DarkTheme.spacing.md,
  },
  section: {
    marginBottom: DarkTheme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.sm,
    marginBottom: DarkTheme.spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.md,
  },
  // Category distribution
  distributionContainer: {
    gap: DarkTheme.spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DarkTheme.spacing.xs,
    paddingHorizontal: DarkTheme.spacing.sm,
    borderRadius: DarkTheme.borderRadius.sm,
  },
  categoryRowActive: {
    backgroundColor: `${DarkTheme.colors.primary}15`,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 130,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: DarkTheme.spacing.sm,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  categoryNameActive: {
    color: DarkTheme.colors.text,
    fontWeight: '700',
  },
  categoryRange: {
    fontSize: 10,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginLeft: 4,
  },
  categoryBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.sm,
  },
  categoryBar: {
    height: 6,
    borderRadius: 3,
    minWidth: 4,
  },
  categoryPercent: {
    fontSize: 11,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    width: 35,
    textAlign: 'right',
  },
  youBadge: {
    backgroundColor: DarkTheme.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: DarkTheme.spacing.sm,
  },
  youBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: DarkTheme.colors.background,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  // Stats
  statsContainer: {
    flexDirection: 'row',
    marginBottom: DarkTheme.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: DarkTheme.colors.success,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: DarkTheme.colors.borderSubtle,
    marginHorizontal: DarkTheme.spacing.md,
  },
  focusAreas: {
    flexDirection: 'row',
    gap: DarkTheme.spacing.xs,
    marginBottom: 4,
  },
  focusTag: {
    backgroundColor: DarkTheme.colors.primaryDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: DarkTheme.borderRadius.sm,
  },
  focusTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  motivationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${DarkTheme.colors.primary}10`,
    padding: DarkTheme.spacing.md,
    borderRadius: DarkTheme.borderRadius.md,
    gap: DarkTheme.spacing.sm,
  },
  motivationText: {
    flex: 1,
    fontSize: 13,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    lineHeight: 18,
  },
});

export default RankingPage;
