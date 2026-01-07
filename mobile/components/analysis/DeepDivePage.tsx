import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { MessageCircle, TrendingUp, TrendingDown, Minus, Target } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { GlassCard } from '../GlassCard';
import { BlurredContent } from '../BlurredContent';
import { DarkTheme, getScoreColor } from '../../lib/theme';
import { AnalysisPageProps, getFeatureScore } from './types';

interface DeepDivePageProps extends AnalysisPageProps {}

export function DeepDivePage({
  analysis,
  metrics,
  strengths,
  weaknesses,
  previousAnalysis,
  navigation,
  isUnblurred,
  isActive,
}: DeepDivePageProps) {
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      contentOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    }
  }, [isActive]);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  // Calculate changes from previous analysis
  const getMetricChange = (metricKey: string): number | null => {
    if (!previousAnalysis?.breakdown) return null;

    const currentMetric = metrics.find(m => m.key === metricKey);
    if (!currentMetric) return null;

    const prevBreakdown = previousAnalysis.breakdown as any;
    const prevValue = getFeatureScore(prevBreakdown[metricKey]);

    return currentMetric.value - prevValue;
  };

  const daysSinceLastScan = previousAnalysis
    ? Math.floor(
        (new Date(analysis.created_at).getTime() -
          new Date(previousAnalysis.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  // Focus areas - lowest scores that are most improvable
  const focusAreas = [...metrics]
    .sort((a, b) => a.value - b.value)
    .slice(0, 3);

  return (
    <Animated.View style={[styles.container, contentAnimatedStyle]}>
      <BlurredContent isBlurred={!isUnblurred}>
        {/* Change Tracker */}
        {previousAnalysis && (
          <GlassCard variant="subtle" style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Progress Since Last Scan</Text>
              <Text style={styles.sectionSubtitle}>
                {daysSinceLastScan} days ago
              </Text>
            </View>
            <View style={styles.changesGrid}>
              {metrics.map((metric) => {
                const change = getMetricChange(metric.key);
                if (change === null) return null;

                return (
                  <View key={metric.key} style={styles.changeItem}>
                    <Text style={styles.changeLabel}>{metric.label}</Text>
                    <View style={styles.changeValue}>
                      {change > 0 ? (
                        <TrendingUp size={14} color={DarkTheme.colors.success} />
                      ) : change < 0 ? (
                        <TrendingDown size={14} color={DarkTheme.colors.error} />
                      ) : (
                        <Minus size={14} color={DarkTheme.colors.textTertiary} />
                      )}
                      <Text
                        style={[
                          styles.changeText,
                          {
                            color:
                              change > 0
                                ? DarkTheme.colors.success
                                : change < 0
                                ? DarkTheme.colors.error
                                : DarkTheme.colors.textTertiary,
                          },
                        ]}
                      >
                        {change > 0 ? '+' : ''}
                        {change.toFixed(1)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </GlassCard>
        )}

        {/* Strengths Section */}
        <GlassCard variant="elevated" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Strengths</Text>
            <Text style={styles.sectionSubtitle}>Top performing areas</Text>
          </View>
          {strengths.map((metric, index) => (
            <View key={metric.key} style={styles.metricItem}>
              <View style={styles.metricRank}>
                <Text style={styles.metricRankText}>#{index + 1}</Text>
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricDescription}>{metric.description}</Text>
              </View>
              <Text style={[styles.metricScore, { color: getScoreColor(metric.value) }]}>
                {metric.value.toFixed(1)}
              </Text>
            </View>
          ))}
        </GlassCard>

        {/* Weaknesses Section */}
        <GlassCard variant="subtle" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Areas to Improve</Text>
            <Text style={styles.sectionSubtitle}>Focus here for maximum gains</Text>
          </View>
          {weaknesses.map((metric) => (
            <View key={metric.key} style={styles.metricItem}>
              <View style={styles.metricContent}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricDescription}>{metric.description}</Text>
              </View>
              <View style={styles.metricActions}>
                <Text style={[styles.metricScore, { color: getScoreColor(metric.value) }]}>
                  {metric.value.toFixed(1)}
                </Text>
                <TouchableOpacity
                  style={styles.askAIButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    (navigation as any).navigate('AICoach', { metric: metric.key });
                  }}
                >
                  <MessageCircle size={14} color={DarkTheme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </GlassCard>

        {/* Focus Areas */}
        <GlassCard variant="subtle" style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.focusHeader}>
              <Target size={18} color={DarkTheme.colors.primary} />
              <Text style={[styles.sectionTitle, styles.focusTitle]}>Priority Focus</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              AI-recommended areas with highest improvement potential
            </Text>
          </View>
          {focusAreas.map((metric, index) => (
            <TouchableOpacity
              key={metric.key}
              style={styles.focusItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                (navigation as any).navigate('AICoach', {
                  metric: metric.key,
                  prompt: `Help me improve my ${metric.label.toLowerCase()}. Current score: ${metric.value.toFixed(1)}/10.`,
                });
              }}
            >
              <View style={styles.focusPriority}>
                <Text style={styles.focusPriorityText}>{index + 1}</Text>
              </View>
              <View style={styles.focusContent}>
                <Text style={styles.focusLabel}>{metric.label}</Text>
                <Text style={styles.focusScore}>
                  {metric.value.toFixed(1)} / 10
                </Text>
              </View>
              <MessageCircle size={16} color={DarkTheme.colors.primary} />
            </TouchableOpacity>
          ))}
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
    marginBottom: DarkTheme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  // Change tracker
  changesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  changeItem: {
    width: '50%',
    paddingVertical: DarkTheme.spacing.sm,
    paddingRight: DarkTheme.spacing.sm,
  },
  changeLabel: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: 4,
  },
  changeValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  // Metrics
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DarkTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DarkTheme.colors.borderSubtle,
  },
  metricRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DarkTheme.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DarkTheme.spacing.md,
  },
  metricRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: 2,
  },
  metricDescription: {
    fontSize: 12,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  metricScore: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  metricActions: {
    alignItems: 'center',
  },
  askAIButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: DarkTheme.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  // Focus areas
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.sm,
  },
  focusTitle: {
    marginBottom: 0,
  },
  focusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DarkTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DarkTheme.colors.borderSubtle,
  },
  focusPriority: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: DarkTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DarkTheme.spacing.md,
  },
  focusPriorityText: {
    fontSize: 14,
    fontWeight: '700',
    color: DarkTheme.colors.background,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  focusContent: {
    flex: 1,
  },
  focusLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  focusScore: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
});

export default DeepDivePage;
