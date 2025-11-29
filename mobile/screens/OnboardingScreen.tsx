import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import { Camera } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, ChevronLeft, Camera as CameraIcon, Sparkles } from 'lucide-react-native';

import { OnboardingSlide } from '../components/OnboardingSlide';
import { ProfileSetupStep, ProfileSetupData } from '../components/ProfileSetupStep';
import { GoalSelectionStep, OnboardingGoal } from '../components/GoalSelectionStep';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../lib/auth/context';
import { apiPost } from '../lib/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme } from '../lib/theme';
import { showAlert } from '../lib/utils/alert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Onboarding steps
type OnboardingStep = 
  | 'welcome1'
  | 'welcome2'
  | 'welcome3'
  | 'profile'
  | 'goals'
  | 'permissions'
  | 'disclaimer'
  | 'firstScan';

const STEPS: OnboardingStep[] = [
  'welcome1',
  'welcome2',
  'welcome3',
  'profile',
  'goals',
  'permissions',
  'disclaimer',
  'firstScan',
];

const WELCOME_SLIDES = [
  {
    title: 'Black Pill',
    subtitle: 'Welcome',
    emoji: '💊',
    description: 'Your AI-powered companion for facial analysis and self-improvement tracking.',
    accentColor: DarkTheme.colors.primary,
  },
  {
    title: 'AI Analysis',
    subtitle: 'Powered by Science',
    emoji: '🔬',
    description: 'Get detailed facial analysis using advanced AI that evaluates symmetry, proportions, and features.',
    accentColor: '#00FF94',
  },
  {
    title: 'Track Progress',
    subtitle: 'See Your Journey',
    emoji: '📈',
    description: 'Monitor changes over time, build healthy habits, and achieve your personal goals.',
    accentColor: '#FFB800',
  },
];

export function OnboardingScreen() {
  const navigation = useNavigation();
  const { session, user, refreshOnboardingStatus } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [profileData, setProfileData] = useState<ProfileSetupData>({
    username: '',
    avatarUri: null,
  });
  const [selectedGoals, setSelectedGoals] = useState<OnboardingGoal[]>([]);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentStep = STEPS[currentStepIndex];
  const isWelcomeSlide = currentStep.startsWith('welcome');
  const welcomeSlideIndex = isWelcomeSlide ? parseInt(currentStep.replace('welcome', '')) - 1 : -1;

  const progressWidth = useSharedValue((currentStepIndex + 1) / STEPS.length);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const goToStep = (index: number) => {
    if (index < 0 || index >= STEPS.length) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentStepIndex(index);
    progressWidth.value = withTiming((index + 1) / STEPS.length, { duration: 300 });
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'goals':
        return selectedGoals.length > 0;
      case 'permissions':
        return permissionsGranted;
      case 'disclaimer':
        return disclaimerAccepted;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!canProceed()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    // Handle special step logic
    if (currentStep === 'permissions') {
      const granted = await requestPermissions();
      if (!granted) return;
    }

    if (currentStepIndex < STEPS.length - 1) {
      goToStep(currentStepIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      // Request camera permission
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      if (!cameraStatus.granted) {
        showAlert({
          title: 'Camera Permission Required',
          message: 'Black Pill needs camera access to analyze your photos.',
          buttons: [{ text: 'OK' }],
        });
        return false;
      }

      // Request notification permission (optional)
      if (Platform.OS !== 'web') {
        await Notifications.requestPermissionsAsync();
      }

      setPermissionsGranted(true);
      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  };

  const completeOnboarding = async (goToCamera: boolean) => {
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Save onboarding data to server
      await apiPost(
        '/api/user/onboarding',
        {
          username: profileData.username || null,
          avatarUri: profileData.avatarUri || null,
          goals: selectedGoals,
        },
        session?.access_token
      );

      // Refresh onboarding status in auth context
      // This will trigger the navigation to update
      await refreshOnboardingStatus();

      // Navigate to appropriate screen
      if (goToCamera) {
        (navigation as any).reset({
          index: 1,
          routes: [
            { name: 'Home' },
            { name: 'Camera' },
          ],
        });
      } else {
        (navigation as any).reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // Still try to refresh and navigate even if save fails
      try {
        await refreshOnboardingStatus();
      } catch {}
      (navigation as any).reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome1':
      case 'welcome2':
      case 'welcome3':
        return (
          <OnboardingSlide
            {...WELCOME_SLIDES[welcomeSlideIndex]}
            isActive={true}
          />
        );

      case 'profile':
        return (
          <ProfileSetupStep
            data={profileData}
            onUpdate={setProfileData}
          />
        );

      case 'goals':
        return (
          <GoalSelectionStep
            selectedGoals={selectedGoals}
            onUpdate={setSelectedGoals}
          />
        );

      case 'permissions':
        return (
          <Animated.View 
            style={styles.stepContainer}
            entering={FadeIn.duration(500)}
          >
            <Text style={styles.stepTitle}>Enable Permissions</Text>
            <Text style={styles.stepSubtitle}>
              We need a few permissions to give you the best experience
            </Text>

            <GlassCard style={styles.permissionCard}>
              <View style={styles.permissionItem}>
                <View style={styles.permissionIcon}>
                  <CameraIcon size={24} color={DarkTheme.colors.primary} />
                </View>
                <View style={styles.permissionContent}>
                  <Text style={styles.permissionTitle}>Camera Access</Text>
                  <Text style={styles.permissionDesc}>
                    Required for taking photos for AI analysis
                  </Text>
                </View>
                <View style={[
                  styles.permissionStatus,
                  permissionsGranted && styles.permissionGranted
                ]}>
                  <Text style={styles.permissionStatusText}>
                    {permissionsGranted ? '✓' : 'Required'}
                  </Text>
                </View>
              </View>

              <View style={styles.permissionDivider} />

              <View style={styles.permissionItem}>
                <View style={styles.permissionIcon}>
                  <Sparkles size={24} color={DarkTheme.colors.primary} />
                </View>
                <View style={styles.permissionContent}>
                  <Text style={styles.permissionTitle}>Notifications</Text>
                  <Text style={styles.permissionDesc}>
                    Get reminders for routines and progress updates
                  </Text>
                </View>
                <View style={styles.permissionStatus}>
                  <Text style={styles.permissionStatusText}>Optional</Text>
                </View>
              </View>
            </GlassCard>

            {!permissionsGranted && (
              <PrimaryButton
                title="Grant Permissions"
                onPress={requestPermissions}
                style={styles.permissionButton}
              />
            )}
          </Animated.View>
        );

      case 'disclaimer':
        return (
          <Animated.View 
            style={styles.stepContainer}
            entering={FadeIn.duration(500)}
          >
            <Text style={styles.stepTitle}>Important Information</Text>
            <Text style={styles.stepSubtitle}>
              Please read and acknowledge the following
            </Text>

            <GlassCard style={styles.disclaimerCard}>
              <Text style={styles.disclaimerTitle}>Medical Disclaimer</Text>
              <ScrollView style={styles.disclaimerScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.disclaimerText}>
                  Black Pill provides AI-powered attractiveness analysis for
                  informational and entertainment purposes only.
                  {'\n\n'}
                  This app is NOT a substitute for professional medical,
                  psychological, or cosmetic advice. Results are based on AI
                  analysis and should not be considered definitive assessments
                  of attractiveness or self-worth.
                  {'\n\n'}
                  Your worth as a person is not determined by any score or
                  analysis. If you experience negative emotional impacts from
                  using this app, please seek professional support.
                  {'\n\n'}
                  By continuing, you acknowledge that you are 18 years or older
                  and understand these limitations.
                </Text>
              </ScrollView>
            </GlassCard>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDisclaimerAccepted(!disclaimerAccepted);
              }}
            >
              <View style={[
                styles.checkbox,
                disclaimerAccepted && styles.checkboxChecked
              ]}>
                {disclaimerAccepted && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                I understand and accept these terms
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );

      case 'firstScan':
        return (
          <Animated.View 
            style={styles.stepContainer}
            entering={FadeIn.duration(500)}
          >
            <View style={styles.firstScanEmoji}>
              <Text style={styles.emoji}>📸</Text>
            </View>
            <Text style={styles.stepTitle}>Ready for Your First Scan?</Text>
            <Text style={styles.stepSubtitle}>
              Take your first photo and get your AI-powered facial analysis
            </Text>

            <View style={styles.firstScanButtons}>
              <PrimaryButton
                title="Take My First Scan"
                onPress={() => completeOnboarding(true)}
                loading={loading}
                style={styles.firstScanButton}
              />
              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => completeOnboarding(false)}
                disabled={loading}
              >
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.firstScanHint}>
              <Text style={styles.hintText}>
                💡 Tip: Use good lighting and face the camera directly for best results
              </Text>
            </View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>
        <Text style={styles.progressText}>
          {currentStepIndex + 1} / {STEPS.length}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderStepContent()}
      </View>

      {/* Navigation buttons */}
      {currentStep !== 'firstScan' && (
        <View style={styles.navigation}>
          {currentStepIndex > 0 ? (
            <TouchableOpacity style={styles.navButton} onPress={handleBack}>
              <ChevronLeft size={24} color={DarkTheme.colors.textSecondary} />
              <Text style={styles.navButtonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.navButton} />
          )}

          <View style={styles.dots}>
            {STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentStepIndex && styles.dotActive,
                  index < currentStepIndex && styles.dotCompleted,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.navButton,
              styles.navButtonNext,
              !canProceed() && styles.navButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!canProceed()}
          >
            <Text style={[
              styles.navButtonText,
              styles.navButtonTextNext,
              !canProceed() && styles.navButtonTextDisabled,
            ]}>
              {currentStep === 'disclaimer' ? 'Accept' : 'Next'}
            </Text>
            <ChevronRight 
              size={24} 
              color={canProceed() ? DarkTheme.colors.primary : DarkTheme.colors.textTertiary} 
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DarkTheme.spacing.lg,
    paddingTop: DarkTheme.spacing.xl + 20,
    paddingBottom: DarkTheme.spacing.md,
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
    backgroundColor: DarkTheme.colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    minWidth: 40,
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DarkTheme.spacing.lg,
    paddingVertical: DarkTheme.spacing.lg,
    paddingBottom: DarkTheme.spacing.xl,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  navButtonNext: {
    justifyContent: 'flex-end',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  navButtonTextNext: {
    color: DarkTheme.colors.primary,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: DarkTheme.colors.textTertiary,
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
  // Step container styles
  stepContainer: {
    flex: 1,
    paddingHorizontal: DarkTheme.spacing.lg,
    paddingTop: DarkTheme.spacing.xl,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: DarkTheme.spacing.sm,
  },
  stepSubtitle: {
    fontSize: 16,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: DarkTheme.spacing.xl,
  },
  // Permission styles
  permissionCard: {
    marginBottom: DarkTheme.spacing.lg,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DarkTheme.spacing.sm,
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${DarkTheme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DarkTheme.spacing.md,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: 2,
  },
  permissionDesc: {
    fontSize: 13,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  permissionStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: DarkTheme.colors.card,
  },
  permissionGranted: {
    backgroundColor: `${DarkTheme.colors.success}20`,
  },
  permissionStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  permissionDivider: {
    height: 1,
    backgroundColor: DarkTheme.colors.border,
    marginVertical: DarkTheme.spacing.sm,
  },
  permissionButton: {
    marginTop: DarkTheme.spacing.md,
  },
  // Disclaimer styles
  disclaimerCard: {
    flex: 1,
    maxHeight: 300,
    marginBottom: DarkTheme.spacing.lg,
  },
  disclaimerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DarkTheme.colors.warning,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.md,
  },
  disclaimerScroll: {
    flex: 1,
  },
  disclaimerText: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    lineHeight: 22,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DarkTheme.spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: DarkTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DarkTheme.spacing.md,
  },
  checkboxChecked: {
    backgroundColor: DarkTheme.colors.primary,
    borderColor: DarkTheme.colors.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 15,
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    flex: 1,
  },
  // First scan styles
  firstScanEmoji: {
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.lg,
  },
  emoji: {
    fontSize: 80,
  },
  firstScanButtons: {
    marginTop: DarkTheme.spacing.xl,
    gap: DarkTheme.spacing.md,
  },
  firstScanButton: {
    marginBottom: 0,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: DarkTheme.spacing.md,
  },
  skipButtonText: {
    fontSize: 16,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  firstScanHint: {
    marginTop: DarkTheme.spacing.xl,
    padding: DarkTheme.spacing.md,
    backgroundColor: `${DarkTheme.colors.primary}10`,
    borderRadius: DarkTheme.borderRadius.md,
  },
  hintText: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    lineHeight: 20,
  },
});
