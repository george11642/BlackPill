import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Lock, Crown, Sparkles } from 'lucide-react-native';

import { apiGet } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { useSubscription } from '../lib/subscription/context';
import { PrimaryButton } from '../components/PrimaryButton';
import { BackHeader } from '../components/BackHeader';
import { GuidedTour, hasTourBeenCompleted } from '../components/GuidedTour';
import { DarkTheme } from '../lib/theme';
import { fetchRoutineSuggestion, type RoutineSuggestion } from '../lib/routines/routineSuggestionEngine';

import {
  PageIndicator,
  RatingsPage,
  DeepDivePage,
  RankingPage,
  ImprovePage,
  AnalysisResponse,
  MetricData,
  getFeatureScore,
  getFeatureDescription,
  getFeatureImprovement,
} from '../components/analysis';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PAGE_TITLES = ['Ratings', 'Deep Dive', 'Ranking', 'Improve'];

interface PageItem {
  key: string;
  Component: React.ComponentType<any>;
}

const PAGES: PageItem[] = [
  { key: 'ratings', Component: RatingsPage },
  { key: 'deepdive', Component: DeepDivePage },
  { key: 'ranking', Component: RankingPage },
  { key: 'improve', Component: ImprovePage },
];

export function AnalysisResultScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { session } = useAuth();
  const { tier, unblurCredits, spendUnblurCredit, analysesUsedThisMonth, features } = useSubscription();
  const { analysisId, isFirstScan } = route.params as { analysisId: string; isFirstScan?: boolean };

  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [previousAnalysis, setPreviousAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [routineSuggestion, setRoutineSuggestion] = useState<RoutineSuggestion | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Unblur state
  const [isUnblurred, setIsUnblurred] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  // Guided tour state
  const [showTour, setShowTour] = useState(false);

  const confettiRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadAnalysis();
    loadPreviousAnalysis();
    checkUnblurStatus();
    checkIfFirstAnalysisAndShowTour();
  }, []);

  const loadPreviousAnalysis = async () => {
    try {
      const historyData = await apiGet<{ analyses: AnalysisResponse[] }>(
        '/api/analyses?limit=2',
        session?.access_token
      );
      if (historyData.analyses && historyData.analyses.length > 1) {
        // Second item is the previous analysis
        setPreviousAnalysis(historyData.analyses[1]);
      }
    } catch (error) {
      console.error('Failed to load previous analysis:', error);
    }
  };

  const checkIfFirstAnalysisAndShowTour = async () => {
    try {
      const tourCompleted = await hasTourBeenCompleted();
      if (tourCompleted) return;

      if (isFirstScan) {
        setTimeout(() => setShowTour(true), 2500);
        return;
      }

      const historyData = await apiGet<{ analyses: any[] }>(
        '/api/analyses?limit=2',
        session?.access_token
      );

      if (historyData.analyses && historyData.analyses.length <= 1) {
        setTimeout(() => setShowTour(true), 3000);
      }
    } catch (error) {
      console.error('Failed to check first analysis status:', error);
    }
  };

  const checkUnblurStatus = () => {
    if (tier === 'premium') {
      if (analysesUsedThisMonth < features.analyses.unblurredCount) {
        setIsUnblurred(true);
        return;
      }
    }
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

      // Clear first scan pending flag
      try {
        await AsyncStorage.removeItem('@blackpill_first_scan_pending');
      } catch (storageError) {
        console.error('[AnalysisResult] Error clearing first scan flag:', storageError);
      }

      // Trigger confetti for high scores
      if (data.score >= 7.5) {
        setTimeout(() => {
          setShowConfetti(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 1200);
      }

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

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const appUrl = process.env.EXPO_PUBLIC_APP_URL || 'https://www.black-pill.app';
    try {
      await Share.share({
        message: `I just got a ${analysis?.score.toFixed(1)}/10 on BlackPill! Check out your score: ${appUrl}`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handlePageChange = useCallback((event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(index);
  }, []);

  const goToPage = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  }, []);

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

  // Calculate metrics - memoized to avoid recalculation on every render
  const { metrics, strengths, weaknesses } = useMemo(() => {
    const masculinityFeature = analysis.breakdown.masculinity || analysis.breakdown.jawline;
    const cheekbonesFeature = analysis.breakdown.cheekbones || analysis.breakdown.bone_structure;

    const metricsData: MetricData[] = [
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

    const sorted = [...metricsData].sort((a, b) => b.value - a.value);
    return {
      metrics: metricsData,
      strengths: sorted.slice(0, 2),
      weaknesses: sorted.slice(-2).reverse(),
    };
  }, [analysis.breakdown]);

  const renderPage = useCallback(({ item, index }: { item: PageItem; index: number }) => {
    const { Component } = item;
    return (
      <View style={styles.pageContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.pageContent}
        >
          <Component
            analysis={analysis}
            metrics={metrics}
            strengths={strengths}
            weaknesses={weaknesses}
            previousAnalysis={previousAnalysis}
            routineSuggestion={routineSuggestion}
            tips={analysis.tips}
            navigation={navigation}
            isUnblurred={isUnblurred}
            isActive={currentIndex === index}
            onShare={handleShare}
          />
        </ScrollView>
      </View>
    );
  }, [analysis, metrics, strengths, weaknesses, previousAnalysis, routineSuggestion, navigation, isUnblurred, currentIndex, handleShare]);

  return (
    <View style={styles.container}>
      <BackHeader title={PAGE_TITLES[currentIndex]} />

      {showConfetti && (
        <ConfettiCannon
          ref={confettiRef}
          count={100}
          origin={{ x: SCREEN_WIDTH / 2, y: -10 }}
          fadeOut
          colors={[DarkTheme.colors.primary, DarkTheme.colors.primaryLight, DarkTheme.colors.accent]}
        />
      )}

      <PageIndicator
        count={4}
        activeIndex={currentIndex}
        labels={PAGE_TITLES}
        onPagePress={goToPage}
      />

      <FlatList
        ref={flatListRef}
        horizontal
        pagingEnabled
        data={PAGES}
        renderItem={renderPage}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        snapToInterval={SCREEN_WIDTH}
        decelerationRate="fast"
        onMomentumScrollEnd={handlePageChange}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={3}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      <GuidedTour
        visible={showTour}
        onComplete={() => setShowTour(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
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
  pageContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  pageContent: {
    paddingBottom: DarkTheme.spacing.xl,
  },
});

export default AnalysisResultScreen;
