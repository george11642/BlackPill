import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { 
  ChevronRight, 
  ChevronLeft, 
  X,
  BarChart3,
  History,
  Calendar,
  Trophy,
} from 'lucide-react-native';
import { DarkTheme } from '../lib/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TOUR_STORAGE_KEY = '@blackpill_tour_completed';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: 'top' | 'center' | 'bottom';
  accentColor?: string;
}

const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    id: 'score',
    title: 'Your Score Explained',
    description: 'Your overall score is calculated from multiple facial features including symmetry, proportions, and skin quality. Track it over time to see improvements!',
    icon: <BarChart3 size={32} />,
    highlight: 'top',
    accentColor: DarkTheme.colors.primary,
  },
  {
    id: 'history',
    title: 'Track Your Progress',
    description: 'View all your past scans in History. Compare photos side-by-side to see how your face has changed over time.',
    icon: <History size={32} />,
    highlight: 'center',
    accentColor: '#00FF94',
  },
  {
    id: 'routines',
    title: 'Daily Routines',
    description: 'Get personalized skincare and grooming routines based on your analysis. Complete tasks daily to build healthy habits.',
    icon: <Calendar size={32} />,
    highlight: 'center',
    accentColor: '#FFB800',
  },
  {
    id: 'achievements',
    title: 'Earn Achievements',
    description: 'Unlock achievements as you use the app. Complete challenges, maintain streaks, and climb the leaderboard!',
    icon: <Trophy size={32} />,
    highlight: 'bottom',
    accentColor: '#B700FF',
  },
];

interface GuidedTourProps {
  visible: boolean;
  onComplete: () => void;
  steps?: TourStep[];
}

export function GuidedTour({ 
  visible, 
  onComplete, 
  steps = DEFAULT_TOUR_STEPS 
}: GuidedTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const progressWidth = useSharedValue(1 / steps.length);

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  useEffect(() => {
    if (visible) {
      setCurrentStepIndex(0);
      progressWidth.value = 1 / steps.length;
    }
  }, [visible]);

  useEffect(() => {
    progressWidth.value = withTiming((currentStepIndex + 1) / steps.length, { duration: 300 });
  }, [currentStepIndex]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(TOUR_STORAGE_KEY, 'true');
    } catch (error) {
      console.error('Failed to save tour completion:', error);
    }
    onComplete();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1}
          onPress={handleNext}
        />

        {/* Content Card */}
        <Animated.View 
          style={styles.card}
          entering={FadeIn.duration(300)}
        >
          {/* Skip button */}
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <X size={20} color={DarkTheme.colors.textTertiary} />
          </TouchableOpacity>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View 
                style={[
                  styles.progressFill, 
                  progressStyle,
                  { backgroundColor: currentStep.accentColor || DarkTheme.colors.primary }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {currentStepIndex + 1} / {steps.length}
            </Text>
          </View>

          {/* Icon */}
          <View style={[
            styles.iconContainer,
            { backgroundColor: `${currentStep.accentColor || DarkTheme.colors.primary}20` }
          ]}>
            {React.cloneElement(currentStep.icon as React.ReactElement, {
              color: currentStep.accentColor || DarkTheme.colors.primary,
            })}
          </View>

          {/* Title */}
          <Text style={[
            styles.title,
            { color: currentStep.accentColor || DarkTheme.colors.primary }
          ]}>
            {currentStep.title}
          </Text>

          {/* Description */}
          <Text style={styles.description}>
            {currentStep.description}
          </Text>

          {/* Navigation */}
          <View style={styles.navigation}>
            {!isFirstStep ? (
              <TouchableOpacity style={styles.navButton} onPress={handlePrev}>
                <ChevronLeft size={20} color={DarkTheme.colors.textSecondary} />
                <Text style={styles.navButtonText}>Back</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.navButton} />
            )}

            {/* Dots */}
            <View style={styles.dots}>
              {steps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentStepIndex && [
                      styles.dotActive,
                      { backgroundColor: currentStep.accentColor || DarkTheme.colors.primary }
                    ],
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity 
              style={[
                styles.navButton, 
                styles.navButtonNext,
                { backgroundColor: currentStep.accentColor || DarkTheme.colors.primary }
              ]} 
              onPress={handleNext}
            >
              <Text style={styles.navButtonTextNext}>
                {isLastStep ? 'Done' : 'Next'}
              </Text>
              {!isLastStep && <ChevronRight size={20} color="#fff" />}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Helper function to check if tour has been completed
export async function hasTourBeenCompleted(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(TOUR_STORAGE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

// Helper function to reset tour (for testing)
export async function resetTour(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TOUR_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to reset tour:', error);
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  card: {
    width: SCREEN_WIDTH - 48,
    backgroundColor: DarkTheme.colors.card,
    borderRadius: DarkTheme.borderRadius.xl,
    padding: DarkTheme.spacing.xl,
    borderWidth: 1,
    borderColor: DarkTheme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  skipButton: {
    position: 'absolute',
    top: DarkTheme.spacing.md,
    right: DarkTheme.spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DarkTheme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.xl,
    gap: DarkTheme.spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: DarkTheme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    minWidth: 40,
    textAlign: 'right',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: DarkTheme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: DarkTheme.spacing.md,
  },
  description: {
    fontSize: 16,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: DarkTheme.spacing.xl,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  navButtonText: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  navButtonNext: {
    paddingVertical: DarkTheme.spacing.sm,
    paddingHorizontal: DarkTheme.spacing.md,
    borderRadius: 20,
    justifyContent: 'center',
  },
  navButtonTextNext: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DarkTheme.colors.border,
  },
  dotActive: {
    width: 20,
  },
});

export default GuidedTour;

