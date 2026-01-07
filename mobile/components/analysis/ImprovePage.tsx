import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronRight,
  ChevronDown,
  MessageCircle,
  ShoppingBag,
  TrendingUp,
  Target,
  Sparkles,
  Home,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { GlassCard } from '../GlassCard';
import { PrimaryButton } from '../PrimaryButton';
import { RoutineSuggestionCard } from '../RoutineSuggestionCard';
import { BlurredContent } from '../BlurredContent';
import { DarkTheme } from '../../lib/theme';
import { AnalysisPageProps } from './types';

interface ImprovePageProps extends AnalysisPageProps {
  tips?: Array<{
    title: string;
    description: string;
    timeframe: string;
  }>;
}

const QUICK_ACTIONS = [
  {
    icon: MessageCircle,
    label: 'AI Coach',
    screen: 'AICoach',
    color: DarkTheme.colors.primary,
  },
  {
    icon: ShoppingBag,
    label: 'Shop',
    screen: 'Shop',
    color: '#44AAFF',
  },
  {
    icon: TrendingUp,
    label: 'Progress',
    screen: 'Progress',
    color: DarkTheme.colors.success,
  },
  {
    icon: Target,
    label: 'Goals',
    screen: 'Goals',
    color: '#FFAA44',
  },
];

export function ImprovePage({
  analysis,
  tips,
  routineSuggestion,
  weaknesses,
  navigation,
  isUnblurred,
  isActive,
}: ImprovePageProps) {
  const contentOpacity = useSharedValue(0);
  const [showAllTips, setShowAllTips] = useState(false);
  const chevronRotation = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      contentOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    }
  }, [isActive]);

  useEffect(() => {
    chevronRotation.value = withTiming(showAllTips ? 180 : 0, { duration: 200 });
  }, [showAllTips]);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const chevronAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const displayedTips = showAllTips ? tips : tips?.slice(0, 3);
  const hasMoreTips = (tips?.length || 0) > 3;

  return (
    <Animated.View style={[styles.container, contentAnimatedStyle]}>
      <BlurredContent isBlurred={!isUnblurred}>
        {/* Routine Suggestion */}
        {routineSuggestion && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended Routine</Text>
            <RoutineSuggestionCard suggestion={routineSuggestion} />
          </View>
        )}

        {/* Tips Section */}
        {tips && tips.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How to Reach Your Potential</Text>
            {displayedTips?.map((tip, index) => (
              <GlassCard
                key={index}
                variant="elevated"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  (navigation as any).navigate('AICoach', {
                    tip: tip.title,
                    tipDescription: tip.description,
                    tipTimeframe: tip.timeframe,
                  });
                }}
                style={styles.tipCard}
              >
                <View style={styles.tipContent}>
                  <View style={styles.tipTextContainer}>
                    <Text style={styles.tipTitle}>{tip.title}</Text>
                    <Text style={styles.tipDescription} numberOfLines={2}>
                      {tip.description}
                    </Text>
                    <Text style={styles.tipTimeframe}>{tip.timeframe}</Text>
                  </View>
                  <ChevronRight size={24} color={DarkTheme.colors.textTertiary} />
                </View>
              </GlassCard>
            ))}
            {hasMoreTips && (
              <TouchableOpacity
                style={styles.seeMoreButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAllTips(!showAllTips);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.seeMoreText}>
                  {showAllTips ? 'See less' : `See ${(tips?.length || 0) - 3} more`}
                </Text>
                <Animated.View style={chevronAnimatedStyle}>
                  <ChevronDown size={18} color={DarkTheme.colors.primary} />
                </Animated.View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Take Action CTA */}
        <View style={styles.section}>
          <LinearGradient
            colors={[`${DarkTheme.colors.primary}15`, `${DarkTheme.colors.primaryDark}25`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.takeActionCard}
          >
            <View style={styles.takeActionIconContainer}>
              <Target size={28} color={DarkTheme.colors.primary} />
            </View>
            <Text style={styles.takeActionTitle}>Take Action</Text>
            <Text style={styles.takeActionSubtitle}>
              Create a personalized routine based on your analysis
            </Text>
            <TouchableOpacity
              style={styles.takeActionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                (navigation as any).navigate('CreateRoutine', {
                  analysisId: analysis.id,
                  weakAreas: weaknesses.map((w) => w.label),
                  tips: tips,
                });
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[DarkTheme.colors.primary, DarkTheme.colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.takeActionButtonGradient}
              >
                <Sparkles size={18} color="#fff" />
                <Text style={styles.takeActionButtonText}>Create Custom Routine</Text>
                <ChevronRight size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.actionButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  (navigation as any).navigate(action.screen);
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: `${action.color}20` },
                  ]}
                >
                  <action.icon size={22} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </BlurredContent>

      {/* Home Button - Always visible */}
      <View style={styles.homeButtonContainer}>
        <PrimaryButton
          title="Back to Home"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            (navigation as any).navigate('Home');
          }}
          variant="outline"
          icon={<Home size={18} color={DarkTheme.colors.primary} />}
        />
      </View>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.md,
  },
  // Tips
  tipCard: {
    marginBottom: DarkTheme.spacing.sm,
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipTextContainer: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  tipDescription: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  tipTimeframe: {
    fontSize: 12,
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
    fontWeight: '500',
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DarkTheme.spacing.md,
    gap: DarkTheme.spacing.xs,
  },
  seeMoreText: {
    fontSize: 15,
    fontWeight: '600',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  // Take Action CTA
  takeActionCard: {
    borderRadius: DarkTheme.borderRadius.lg,
    padding: DarkTheme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${DarkTheme.colors.primary}30`,
  },
  takeActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${DarkTheme.colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DarkTheme.spacing.md,
  },
  takeActionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: DarkTheme.spacing.xs,
  },
  takeActionSubtitle: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: DarkTheme.spacing.lg,
  },
  takeActionButton: {
    borderRadius: DarkTheme.borderRadius.md,
    overflow: 'hidden',
    width: '100%',
  },
  takeActionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DarkTheme.spacing.sm,
    paddingVertical: DarkTheme.spacing.md,
    paddingHorizontal: DarkTheme.spacing.lg,
  },
  takeActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  // Quick Actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DarkTheme.spacing.md,
  },
  actionButton: {
    width: '47%',
    backgroundColor: DarkTheme.colors.surface,
    borderRadius: DarkTheme.borderRadius.md,
    padding: DarkTheme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DarkTheme.colors.borderSubtle,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DarkTheme.spacing.sm,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  // Home button
  homeButtonContainer: {
    paddingVertical: DarkTheme.spacing.lg,
    paddingBottom: DarkTheme.spacing.xl,
  },
});

export default ImprovePage;
