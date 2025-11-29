import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Share,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Download, Share2, ChevronRight, ChevronDown, Clock, MessageCircle, Trophy, Lock, Crown, Target, Sparkles, Home } from 'lucide-react-native';

import { apiGet, apiPatch, apiPut } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { useSubscription } from '../lib/subscription/context';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton, IconButton } from '../components/PrimaryButton';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { ScoreMetric } from '../components/ScoreBar';
import { BellCurve } from '../components/BellCurve';
import { BackHeader } from '../components/BackHeader';
import { RoutineSuggestionCard } from '../components/RoutineSuggestionCard';
import { BlurredContent } from '../components/BlurredContent';
import { GuidedTour, hasTourBeenCompleted } from '../components/GuidedTour';
import { DarkTheme, getScoreColor } from '../lib/theme';
import { fetchRoutineSuggestion, type RoutineSuggestion } from '../lib/routines/routineSuggestionEngine';
import { showAlert } from '../lib/utils/alert';
import { UsernameModal } from '../components/UsernameModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Feature analysis with score and description
interface FeatureAnalysis {
  score: number;
  description: string;
  improvement?: string;
}

// API response shape - supports both old (number) and new (object) formats
interface AnalysisResponse {
  id: string;
  user_id: string;
  image_url: string;
  score: number;
  potential_score?: number;
  is_public?: boolean;
  breakdown: {
    masculinity?: FeatureAnalysis | number;
    skin: FeatureAnalysis | number;
    jawline: FeatureAnalysis | number;
    cheekbones?: FeatureAnalysis | number;
    eyes: FeatureAnalysis | number;
    symmetry: FeatureAnalysis | number;
    lips: FeatureAnalysis | number;
    hair: FeatureAnalysis | number;
    bone_structure?: FeatureAnalysis | number; // Legacy field
  };
  tips: Array<{
    title: string;
    description: string;
    timeframe: string;
  }>;
  created_at: string;
}

// Helper to extract score from either format
function getFeatureScore(feature: FeatureAnalysis | number | undefined): number {
  if (feature === undefined) return 5.0;
  if (typeof feature === 'number') return feature;
  return feature.score;
}

// Helper to extract description from either format
function getFeatureDescription(feature: FeatureAnalysis | number | undefined, fallback: string): string {
  if (feature === undefined) return fallback;
  if (typeof feature === 'number') return fallback;
  return feature.description || fallback;
}

// Helper to extract improvement tip from either format
function getFeatureImprovement(feature: FeatureAnalysis | number | undefined): string | undefined {
  if (feature === undefined) return undefined;
  if (typeof feature === 'number') return undefined;
  return feature.improvement;
}

export function AnalysisResultScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { session } = useAuth();
  const { tier, unblurCredits, spendUnblurCredit, refreshSubscription, analysesUsedThisMonth, features } = useSubscription();
  const { analysisId, isFirstScan } = route.params as { analysisId: string; isFirstScan?: boolean };
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [routineSuggestion, setRoutineSuggestion] = useState<RoutineSuggestion | null>(null);
  const [showAllTips, setShowAllTips] = useState(false);
  const [isOnLeaderboard, setIsOnLeaderboard] = useState(false);
  const [joiningLeaderboard, setJoiningLeaderboard] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  
  // Unblur state
  const [isUnblurred, setIsUnblurred] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  
  // Guided tour state
  const [showTour, setShowTour] = useState(false);
  const [isFirstAnalysis, setIsFirstAnalysis] = useState(false);

  const confettiRef = useRef<any>(null);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const scoreScale = useSharedValue(0);
  const scoreValue = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const chevronRotation = useSharedValue(0);

  useEffect(() => {
    loadAnalysis();
    checkUnblurStatus();
    checkIfFirstAnalysisAndShowTour();
  }, []);

  const checkIfFirstAnalysisAndShowTour = async () => {
    try {
      // Check if tour has already been completed
      const tourCompleted = await hasTourBeenCompleted();
      if (tourCompleted) {
        return;
      }

      // If this is coming from onboarding first scan, always show the tour
      if (isFirstScan) {
        setIsFirstAnalysis(true);
        // Show tour after a delay to let animations complete
        setTimeout(() => {
          setShowTour(true);
        }, 2500);
        return;
      }

      // Check if this is the user's first analysis by fetching history count
      const historyData = await apiGet<{ analyses: any[] }>(
        '/api/analyses?limit=2',
        session?.access_token
      );

      // If there's only 1 analysis (the current one), it's their first
      if (historyData.analyses && historyData.analyses.length <= 1) {
        setIsFirstAnalysis(true);
        // Show tour after a delay to let animations complete
        setTimeout(() => {
          setShowTour(true);
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to check first analysis status:', error);
    }
  };

  const checkUnblurStatus = () => {
    // Logic to determine if this specific analysis is already unblurred
    // For simplicity, if user is Elite or Pro (within quota), we can unblur.
    // Or if they own the analysis and used a credit.
    // Ideally, backend should tell us if it's unblurred.
    // For now, let's rely on local state + subscription checks.
    
    if (tier === 'elite') {
        setIsUnblurred(true);
        return;
    }
    
    if (tier === 'pro' && analysesUsedThisMonth < features.analyses.unblurredCount) {
        setIsUnblurred(true);
        return;
    }

    // If free or quota exceeded, it's blurred by default (unless unlocked previously - needing backend flag)
    // Assuming default blurred for now.
    setIsUnblurred(false);
  };

  const handleUnlock = async () => {
    if (unlocking) return;
    
    if (tier === 'free' && unblurCredits > 0) {
        Alert.alert(
            'Unlock Results',
            `Spend 1 referral credit to unlock this analysis? You have ${unblurCredits} credits.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Unlock', 
                    onPress: async () => {
                        setUnlocking(true);
                        const success = await spendUnblurCredit();
                        if (success) {
                            setIsUnblurred(true);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } else {
                            Alert.alert('Error', 'Failed to use credit');
                        }
                        setUnlocking(false);
                    }
                }
            ]
        );
    } else {
        // Direct to subscription
        navigation.navigate('Subscription' as never);
    }
  };

  const loadAnalysis = async () => {
    try {
      const data = await apiGet<AnalysisResponse>(
        `/api/analyses/${analysisId}`,
        session?.access_token
      );
      setAnalysis(data);
      setIsOnLeaderboard(data.is_public || false);
      startAnimations(data.score);
      
      // Load routine suggestion
      const suggestion = await fetchRoutineSuggestion(
        session?.access_token,
        analysisId
      );
      if (suggestion) {
        setRoutineSuggestion(suggestion);
      }
    } catch (error) {
      console.error('Failed to load analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetUsername = async (username: string) => {
    if (!session?.access_token || !analysis) return;

    try {
      // Update username
      await apiPut(
        '/api/user/profile',
        { username },
        session.access_token
      );

      // Now try to join the leaderboard with the newly set username
      await apiPatch(
        `/api/analyses/${analysis.id}/visibility`,
        { is_public: true },
        session.access_token
      );
      setIsOnLeaderboard(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert({
        title: 'Success!',
        message: 'Username set and your score is now on the leaderboard!'
      });
      setShowUsernameModal(false);
    } catch (error: any) {
      console.error('Failed to set username:', error);
      throw new Error(error.data?.message || error.message || 'Failed to set username');
    }
  };

  const startAnimations = (score: number) => {
    // Header fade in
    headerOpacity.value = withTiming(1, { duration: 500 });

    // Score scale and count up
    scoreScale.value = withDelay(
      300,
      withSpring(1, { damping: 12, stiffness: 100 })
    );

    scoreValue.value = withDelay(
      400,
      withTiming(score, {
        duration: 1500,
        easing: Easing.out(Easing.cubic),
      })
    );

    // Content fade in
    contentOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));

    // Trigger confetti for high scores
    if (score >= 7.5) {
      setTimeout(() => {
        setShowConfetti(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 1200);
    }
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

  // Animate chevron rotation when showAllTips changes
  useEffect(() => {
    chevronRotation.value = withTiming(showAllTips ? 180 : 0, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
  }, [showAllTips]);

  const chevronAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const appUrl = process.env.EXPO_PUBLIC_APP_URL || 'https://black-pill.app';
    try {
      await Share.share({
        message: `I just got a ${analysis?.score.toFixed(1)}/10 on BlackPill! Check out your score: ${appUrl}`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Implement save to gallery
  };

  const handleJoinLeaderboard = async () => {
    console.log('handleJoinLeaderboard called', { analysisId: analysis?.id, isOnLeaderboard, hasToken: !!session?.access_token });
    if (!analysis || !session?.access_token) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isOnLeaderboard) {
      // Already on leaderboard - offer to remove
      showAlert({
        title: 'Leave Leaderboard?',
        message: 'Your score will no longer appear in the rankings.',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: async () => {
              setJoiningLeaderboard(true);
              try {
                await apiPatch(
                  `/api/analyses/${analysis.id}/visibility`,
                  { is_public: false },
                  session.access_token
                );
                setIsOnLeaderboard(false);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch (error: any) {
                showAlert({
                  title: 'Error',
                  message: error.message || 'Failed to update visibility'
                });
              } finally {
                setJoiningLeaderboard(false);
              }
            }
          }
        ]
      });
    } else {
      // Not on leaderboard - confirm to join with picture warning
      showAlert({
        title: 'Join Leaderboard',
        message: `Share your best score (${analysis.score.toFixed(1)})? Your photo and score will be visible to other users on the leaderboard.`,
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share',
            onPress: async () => {
              setJoiningLeaderboard(true);
              try {
                await apiPatch(
                  `/api/analyses/${analysis.id}/visibility`,
                  { is_public: true },
                  session.access_token
                );
                setIsOnLeaderboard(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                showAlert({
                  title: 'Success!',
                  message: 'Your best score is now on the leaderboard!'
                });
              } catch (error: any) {
                if (error.data?.message) {
                  // Username required - show username modal
                  setShowUsernameModal(true);
                } else {
                  showAlert({
                    title: 'Error',
                    message: error.message || 'Failed to join leaderboard'
                  });
                }
              } finally {
                setJoiningLeaderboard(false);
              }
            }
          }
        ]
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <BackHeader title="Analysis" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DarkTheme.colors.primary} />
          <Text style={styles.loadingText}>Analyzing your features...</Text>
        </View>
      </View>
    );
  }

  if (!analysis) {
    return (
      <View style={styles.container}>
        <BackHeader title="Analysis" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load analysis</Text>
          <PrimaryButton
            title="Try Again"
            onPress={loadAnalysis}
            variant="outline"
            style={{ marginTop: DarkTheme.spacing.lg }}
          />
        </View>
      </View>
    );
  }

  // Calculate potential score (if not provided by API, estimate it)
  const potentialScore = analysis.potential_score || Math.min(10, analysis.score + 1.5);
  const potentialGain = potentialScore - analysis.score;

  // All 8 metrics for the grid (better than Umax's 6)
  // Use masculinity if available, otherwise fall back to jawline for legacy data
  const masculinityFeature = analysis.breakdown.masculinity || analysis.breakdown.jawline;
  const cheekbonesFeature = analysis.breakdown.cheekbones || analysis.breakdown.bone_structure;
  
  const metrics = [
    { 
      label: 'Masculinity', 
      value: getFeatureScore(masculinityFeature), 
      key: 'masculinity',
      description: getFeatureDescription(
        analysis.breakdown.masculinity,
        'Overall facial structure strength and masculine features'
      ),
      improvement: getFeatureImprovement(analysis.breakdown.masculinity),
    },
    { 
      label: 'Skin Quality', 
      value: getFeatureScore(analysis.breakdown.skin), 
      key: 'skin',
      description: getFeatureDescription(
        analysis.breakdown.skin,
        'Texture, clarity, tone, and overall skin health'
      ),
      improvement: getFeatureImprovement(analysis.breakdown.skin),
    },
    { 
      label: 'Jawline', 
      value: getFeatureScore(analysis.breakdown.jawline), 
      key: 'jawline',
      description: getFeatureDescription(
        analysis.breakdown.jawline,
        'Definition, angularity, and sharpness of the jaw'
      ),
      improvement: getFeatureImprovement(analysis.breakdown.jawline),
    },
    { 
      label: 'Cheekbones', 
      value: getFeatureScore(cheekbonesFeature), 
      key: 'cheekbones',
      description: getFeatureDescription(
        analysis.breakdown.cheekbones || analysis.breakdown.bone_structure,
        'Prominence and structure of cheekbone area'
      ),
      improvement: getFeatureImprovement(analysis.breakdown.cheekbones || analysis.breakdown.bone_structure),
    },
    { 
      label: 'Eyes', 
      value: getFeatureScore(analysis.breakdown.eyes), 
      key: 'eyes',
      description: getFeatureDescription(
        analysis.breakdown.eyes,
        'Shape, symmetry, and overall eye appeal'
      ),
      improvement: getFeatureImprovement(analysis.breakdown.eyes),
    },
    { 
      label: 'Symmetry', 
      value: getFeatureScore(analysis.breakdown.symmetry), 
      key: 'symmetry',
      description: getFeatureDescription(
        analysis.breakdown.symmetry,
        'Overall facial balance and proportional harmony'
      ),
      improvement: getFeatureImprovement(analysis.breakdown.symmetry),
    },
    { 
      label: 'Lips', 
      value: getFeatureScore(analysis.breakdown.lips), 
      key: 'lips',
      description: getFeatureDescription(
        analysis.breakdown.lips,
        'Fullness, shape, and proportion of the lips'
      ),
      improvement: getFeatureImprovement(analysis.breakdown.lips),
    },
    { 
      label: 'Hair Quality', 
      value: getFeatureScore(analysis.breakdown.hair), 
      key: 'hair',
      description: getFeatureDescription(
        analysis.breakdown.hair,
        'Texture, thickness, hairline, and styling'
      ),
      improvement: getFeatureImprovement(analysis.breakdown.hair),
    },
  ];

  // Sort metrics to find strengths and weaknesses
  const sortedMetrics = [...metrics].sort((a, b) => b.value - a.value);
  const strengths = sortedMetrics.slice(0, 2);
  const weaknesses = sortedMetrics.slice(-2).reverse();

  const UnlockOverlay = (
    <View style={styles.unlockContainer}>
      <Lock size={32} color={DarkTheme.colors.primary} style={styles.lockIcon} />
      <Text style={styles.unlockTitle}>Unlock Full Analysis</Text>
      <Text style={styles.unlockSubtitle}>
        See detailed breakdown and personalized tips
      </Text>
      <PrimaryButton
        title={unblurCredits > 0 ? `Unlock (Use Credit: ${unblurCredits})` : "Upgrade to Unlock"}
        onPress={handleUnlock}
        style={styles.unlockButton}
        icon={unblurCredits > 0 ? <Sparkles size={16} color="#000" /> : <Crown size={16} color="#000" />}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <BackHeader title="Your Ratings" />
      {showConfetti && (
        <ConfettiCannon
          ref={confettiRef}
          count={100}
          origin={{ x: SCREEN_WIDTH / 2, y: -10 }}
          fadeOut
          colors={[DarkTheme.colors.primary, DarkTheme.colors.primaryLight, DarkTheme.colors.accent]}
        />
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* Profile Photo with Gold Ring */}
        <Animated.View style={[styles.avatarContainer, headerAnimatedStyle]}>
          <ProfileAvatar
            imageUrl={analysis.image_url}
            size="xl"
            showGoldRing
          />
        </Animated.View>

        {/* Main Scores - Overall and Potential (ALWAYS VISIBLE) */}
        <Animated.View style={[styles.mainScoresContainer, scoreAnimatedStyle]}>
          <View style={styles.scoreColumn}>
            <Text style={styles.scoreLabel}>Overall</Text>
            <AnimatedScore value={analysis.score} />
            <TouchableOpacity 
              onPress={() => (navigation as any).navigate('Methodology')}
              style={styles.methodologyLink}
            >
              <Text style={styles.methodologyText}>How is this calculated?</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreColumn}>
            <Text style={styles.scoreLabel}>Potential</Text>
            <View style={styles.potentialRow}>
              <AnimatedScore value={potentialScore} />
              <View style={styles.potentialBadge}>
                <Text style={styles.potentialBadgeText}>
                  +{potentialGain.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* BLURRED CONTENT SECTION */}
        <BlurredContent isBlurred={!isUnblurred} overlay={!isUnblurred ? UnlockOverlay : undefined}>
            {/* Metrics Grid - 6 detailed metrics (more than Umax's 4 in grid) */}
            <Animated.View style={[styles.metricsGrid, contentAnimatedStyle]}>
            {metrics.map((metric, index) => (
                <ScoreMetric
                key={metric.key}
                label={metric.label}
                value={metric.value}
                delay={index * 100}
                description={metric.description}
                tip={metric.improvement}
                onAICoachPress={() => (navigation as any).navigate('AICoach', { metric: metric.key })}
                />
            ))}
            </Animated.View>

            {/* Your Strengths Section */}
            <Animated.View style={[styles.strengthsSection, contentAnimatedStyle]}>
            <GlassCard variant="elevated">
                <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>💪 Your Strengths</Text>
                <Text style={styles.sectionSubtitle}>Top performing areas</Text>
                </View>
                {strengths.map((metric, index) => (
                <View key={metric.key} style={styles.strengthItem}>
                    <View style={styles.strengthRank}>
                    <Text style={styles.strengthRankText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.strengthContent}>
                    <Text style={styles.strengthLabel}>{metric.label}</Text>
                    <Text style={styles.strengthDescription}>{metric.description}</Text>
                    </View>
                    <Text style={[styles.strengthScore, { color: getScoreColor(metric.value) }]}>
                    {metric.value.toFixed(1)}
                    </Text>
                </View>
                ))}
            </GlassCard>
            </Animated.View>

            {/* Areas to Improve Section */}
            <Animated.View style={[styles.weaknessesSection, contentAnimatedStyle]}>
            <GlassCard variant="subtle">
                <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🎯 Areas to Improve</Text>
                <Text style={styles.sectionSubtitle}>Focus here for maximum gains</Text>
                </View>
                {weaknesses.map((metric, index) => (
                <View key={metric.key} style={styles.weaknessItem}>
                    <View style={styles.weaknessContent}>
                    <Text style={styles.weaknessLabel}>{metric.label}</Text>
                    <Text style={styles.weaknessDescription}>{metric.description}</Text>
                    </View>
                    <View style={styles.weaknessScoreContainer}>
                    <Text style={[styles.weaknessScore, { color: getScoreColor(metric.value) }]}>
                        {metric.value.toFixed(1)}
                    </Text>
                    <TouchableOpacity 
                        style={styles.askAIButton}
                        onPress={() => (navigation as any).navigate('AICoach', { metric: metric.key })}
                    >
                        <MessageCircle size={14} color={DarkTheme.colors.primary} />
                    </TouchableOpacity>
                    </View>
                </View>
                ))}
            </GlassCard>
            </Animated.View>

            {/* Bell Curve Distribution */}
            <Animated.View style={[styles.bellCurveContainer, contentAnimatedStyle]}>
            <GlassCard variant="subtle">
                <Text style={styles.sectionTitle}>Your Ranking</Text>
                <BellCurve score={analysis.score} delay={500} />
            </GlassCard>
            </Animated.View>

            {/* Routine Suggestion Card */}
            {routineSuggestion && (
            <Animated.View style={[styles.suggestionSection, contentAnimatedStyle]}>
                <Text style={styles.sectionTitle}>Your Routine</Text>
                <RoutineSuggestionCard suggestion={routineSuggestion} />
            </Animated.View>
            )}

            {/* Tips Section */}
            {analysis.tips && analysis.tips.length > 0 && (() => {
            const displayedTips = showAllTips ? analysis.tips : analysis.tips.slice(0, 2);
            const hasMoreTips = analysis.tips.length > 2;
            
            return (
                <Animated.View style={[styles.tipsSection, contentAnimatedStyle]}>
                <Text style={styles.sectionTitle}>How to Reach Your Potential</Text>
                {displayedTips.map((tip, index) => (
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
                        <Text style={styles.tipDescription}>{tip.description}</Text>
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
                        {showAllTips ? 'See less' : 'See more'}
                    </Text>
                    <Animated.View style={chevronAnimatedStyle}>
                        <ChevronDown size={18} color={DarkTheme.colors.primary} />
                    </Animated.View>
                    </TouchableOpacity>
                )}
                </Animated.View>
            );
            })()}

            {/* Take Action CTA - Create Custom Routine */}
            <Animated.View style={[styles.takeActionSection, contentAnimatedStyle]}>
              <LinearGradient
                colors={[`${DarkTheme.colors.primary}15`, `${DarkTheme.colors.primaryDark}25`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.takeActionCard}
              >
                <View style={styles.takeActionIconContainer}>
                  <Target size={28} color={DarkTheme.colors.primary} />
                </View>
                <Text style={styles.takeActionTitle}>Take Action on Your Results</Text>
                <Text style={styles.takeActionSubtitle}>
                  Create a personalized routine based on your analysis to improve your weak areas
                </Text>
                <TouchableOpacity
                  style={styles.takeActionButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    (navigation as any).navigate('CreateRoutine', {
                      analysisId: analysis.id,
                      weakAreas: weaknesses.map(w => w.label),
                      tips: analysis.tips,
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
            </Animated.View>
        </BlurredContent>

        {/* Action Buttons - Always accessible even if blurred, though actions might trigger upsell */}
        <Animated.View style={[styles.actionButtons, contentAnimatedStyle]}>
          <PrimaryButton
            title="Home"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              (navigation as any).navigate('Home');
            }}
            variant="outline"
            icon={<Home size={18} color={DarkTheme.colors.primary} />}
            style={styles.actionButton}
          />
          <PrimaryButton
            title={isOnLeaderboard ? 'On Board' : 'Leaderboard'}
            onPress={handleJoinLeaderboard}
            variant={isOnLeaderboard ? 'secondary' : 'outline'}
            icon={<Trophy size={18} color={isOnLeaderboard ? DarkTheme.colors.background : DarkTheme.colors.primary} />}
            style={styles.actionButton}
            disabled={joiningLeaderboard}
          />
          <PrimaryButton
            title="Share"
            onPress={handleShare}
            variant="primary"
            icon={<Share2 size={18} color={DarkTheme.colors.background} />}
            style={styles.actionButton}
          />
        </Animated.View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <UsernameModal
        visible={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        onSubmit={handleSetUsername}
      />

      {/* Guided Tour - shows after first analysis */}
      <GuidedTour
        visible={showTour}
        onComplete={() => setShowTour(false)}
      />
    </View>
  );
}

// Animated score counter component
function AnimatedScore({ value }: { value: number }) {
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    animatedValue.value = withDelay(
      400,
      withTiming(value, {
        duration: 1500,
        easing: Easing.out(Easing.cubic),
      })
    );

    // Update display value
    const interval = setInterval(() => {
      const currentValue = animatedValue.value;
      setDisplayValue(Math.round(currentValue * 10) / 10);
    }, 50);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setDisplayValue(value);
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [value]);

  const scoreColor = getScoreColor(displayValue);

  return (
    <Text style={[styles.mainScore, { color: scoreColor }]}>
      {displayValue.toFixed(1)}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: DarkTheme.spacing.lg,
    paddingTop: DarkTheme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: DarkTheme.spacing.md,
    color: DarkTheme.colors.textSecondary,
    fontSize: 16,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DarkTheme.spacing.lg,
  },
  errorText: {
    color: DarkTheme.colors.error,
    fontSize: 18,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.xl,
  },
  mainScoresContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.xl,
    paddingHorizontal: DarkTheme.spacing.lg,
  },
  scoreColumn: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: DarkTheme.spacing.xs,
  },
  methodologyLink: {
    marginTop: 8,
  },
  methodologyText: {
    fontSize: 12,
    color: DarkTheme.colors.primary,
    textDecorationLine: 'underline',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  mainScore: {
    fontSize: 72,
    fontWeight: '700',
    fontFamily: DarkTheme.typography.fontFamily,
    letterSpacing: -2,
  },
  scoreDivider: {
    width: 1,
    height: 80,
    backgroundColor: DarkTheme.colors.borderSubtle,
    marginHorizontal: DarkTheme.spacing.lg,
  },
  potentialRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  potentialBadge: {
    backgroundColor: DarkTheme.colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: DarkTheme.borderRadius.sm,
    marginLeft: 4,
    marginTop: 8,
  },
  potentialBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: DarkTheme.colors.background,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: DarkTheme.spacing.lg,
  },
  bellCurveContainer: {
    marginBottom: DarkTheme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  sectionHeader: {
    marginBottom: DarkTheme.spacing.md,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  // Strengths Section
  strengthsSection: {
    marginBottom: DarkTheme.spacing.lg,
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DarkTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DarkTheme.colors.borderSubtle,
  },
  strengthRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DarkTheme.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DarkTheme.spacing.md,
  },
  strengthRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  strengthContent: {
    flex: 1,
  },
  strengthLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: 2,
  },
  strengthDescription: {
    fontSize: 12,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  strengthScore: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  // Weaknesses Section
  weaknessesSection: {
    marginBottom: DarkTheme.spacing.lg,
  },
  weaknessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DarkTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DarkTheme.colors.borderSubtle,
  },
  weaknessContent: {
    flex: 1,
  },
  weaknessLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: 4,
  },
  weaknessTip: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: 4,
  },
  weaknessDescription: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: 4,
  },
  weaknessTimeframe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weaknessTimeframeText: {
    fontSize: 11,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginLeft: 4,
  },
  weaknessScoreContainer: {
    alignItems: 'center',
  },
  weaknessScore: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: 4,
  },
  askAIButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: DarkTheme.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: DarkTheme.spacing.md,
    marginBottom: DarkTheme.spacing.xl,
  },
  actionButton: {
    flex: 1,
    maxWidth: 160,
  },
  suggestionSection: {
    marginBottom: DarkTheme.spacing.lg,
  },
  tipsSection: {
    marginBottom: DarkTheme.spacing.lg,
  },
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
    paddingHorizontal: DarkTheme.spacing.md,
    marginTop: DarkTheme.spacing.sm,
    gap: DarkTheme.spacing.xs,
  },
  seeMoreText: {
    fontSize: 15,
    fontWeight: '600',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  // Take Action CTA styles
  takeActionSection: {
    marginBottom: DarkTheme.spacing.lg,
    marginTop: DarkTheme.spacing.md,
  },
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
    lineHeight: 20,
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
  bottomSpacer: {
    height: 40,
  },
  unlockContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  lockIcon: {
    marginBottom: 16,
  },
  unlockTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  unlockSubtitle: {
    fontSize: 16,
    color: DarkTheme.colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  unlockButton: {
    width: 240,
  },
});

export default AnalysisResultScreen;
