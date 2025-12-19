import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';
import { DarkTheme } from '../lib/theme';
import { OnboardingSlide } from '../components/OnboardingSlide';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const WELCOME_SLIDES = [
  {
    title: 'Black Pill',
    subtitle: 'Welcome',
    emoji: '💊',
    description: 'Your AI-powered companion for facial analysis and self-improvement tracking.',
    accentColor: DarkTheme.colors.primary,
    useCustomIcon: true,
  },
  {
    title: 'AI Analysis',
    subtitle: 'Powered by Science',
    emoji: '🔬',
    description: 'Get detailed facial analysis using advanced AI that evaluates symmetry, proportions, and features.',
    accentColor: '#00FF94',
    useCustomIcon: false,
  },
  {
    title: 'Track Progress',
    subtitle: 'See Your Journey',
    emoji: '📈',
    description: 'Monitor changes over time, build healthy habits, and achieve your personal goals.',
    accentColor: '#FFB800',
    useCustomIcon: false,
  },
];

export function WelcomeScreen() {
  const navigation = useNavigation();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const progressWidth = useSharedValue((currentSlideIndex + 1) / WELCOME_SLIDES.length);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const goToSlide = (index: number) => {
    if (index < 0 || index >= WELCOME_SLIDES.length) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentSlideIndex(index);
    progressWidth.value = withTiming((index + 1) / WELCOME_SLIDES.length, { duration: 300 });
  };

  const handleNext = () => {
    if (currentSlideIndex < WELCOME_SLIDES.length - 1) {
      goToSlide(currentSlideIndex + 1);
    } else {
      // Last slide - go to Signup
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      navigation.navigate('Signup' as never);
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <OnboardingSlide
          {...WELCOME_SLIDES[currentSlideIndex]}
          isActive={true}
        />
      </View>

      {/* Navigation buttons */}
      <View style={styles.navigation}>
        <View style={styles.dots}>
          {WELCOME_SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentSlideIndex && styles.dotActive,
                index < currentSlideIndex && styles.dotCompleted,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.navButton, styles.navButtonNext]}
          onPress={handleNext}
        >
          <Text style={[styles.navButtonText, styles.navButtonTextNext]}>
            {currentSlideIndex === WELCOME_SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <ChevronRight
            size={24}
            color={DarkTheme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Guest IAP Link */}
      <TouchableOpacity
        style={styles.plansLink}
        onPress={() => navigation.navigate('Subscription' as never)}
      >
        <Text style={styles.plansText}>
          Want to see our plans? <Text style={styles.plansTextBold}>View Plans</Text>
        </Text>
      </TouchableOpacity>

      {/* Login Link */}
      <TouchableOpacity
        style={styles.loginLink}
        onPress={() => navigation.navigate('Login' as never)}
      >
        <Text style={styles.loginText}>
          Already have an account? <Text style={styles.loginTextBold}>Log in</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  progressContainer: {
    paddingHorizontal: DarkTheme.spacing.lg,
    paddingTop: DarkTheme.spacing.xl + 40,
    paddingBottom: DarkTheme.spacing.md,
  },
  progressTrack: {
    height: 4,
    backgroundColor: DarkTheme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: DarkTheme.colors.primary,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DarkTheme.spacing.lg,
    paddingBottom: DarkTheme.spacing.lg,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  navButtonNext: {
    justifyContent: 'flex-end',
    backgroundColor: `${DarkTheme.colors.primary}15`,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
  },
  navButtonText: {
    fontSize: 16,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  navButtonTextNext: {
    color: DarkTheme.colors.primary,
    fontWeight: '600',
    marginRight: 4,
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
    backgroundColor: DarkTheme.colors.primary,
    width: 24,
  },
  dotCompleted: {
    backgroundColor: `${DarkTheme.colors.primary}60`,
  },
  loginLink: {
    alignItems: 'center',
    paddingBottom: DarkTheme.spacing.xl + 20,
  },
  loginText: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  loginTextBold: {
    color: DarkTheme.colors.primary,
    fontWeight: '600',
  },
  plansLink: {
    alignItems: 'center',
    paddingBottom: DarkTheme.spacing.md,
  },
  plansText: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  plansTextBold: {
    color: DarkTheme.colors.primary,
    fontWeight: '600',
  },
});

