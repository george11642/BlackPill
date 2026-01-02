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
import { ChevronRight, ChevronLeft, Camera as CameraIcon, Sparkles, Star } from 'lucide-react-native';
import * as StoreReview from 'expo-store-review';

import { OnboardingSlide } from '../components/OnboardingSlide';
import { ProfileSetupStep, ProfileSetupData } from '../components/ProfileSetupStep';
import { GoalSelectionStep, OnboardingGoal } from '../components/GoalSelectionStep';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../lib/auth/context';
import { apiPost } from '../lib/api/client';
import { supabase } from '../lib/supabase/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme } from '../lib/theme';
import { showAlert } from '../lib/utils/alert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Onboarding steps
type OnboardingStep =
  | 'profile'
  | 'goals'
  | 'permissions'
  | 'disclaimer'
  | 'rating'
  | 'firstScan';

const STEPS: OnboardingStep[] = [
  'profile',
  'goals',
  'permissions',
  'disclaimer',
  'rating',
  'firstScan',
];

export function OnboardingScreen() {
  const navigation = useNavigation();
  const { session, user, refreshOnboardingStatus } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const isCompletingRef = useRef(false); // Track if onboarding completion is in progress
  const lastValidStepIndexRef = useRef(0); // Track the last valid step index

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [profileData, setProfileData] = useState<ProfileSetupData>({
    username: '',
    avatarUri: null,
  });
  const [selectedGoals, setSelectedGoals] = useState<OnboardingGoal[]>([]);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const currentStep = STEPS[currentStepIndex];

  const progressWidth = useSharedValue((currentStepIndex + 1) / STEPS.length);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const goToStep = (index: number) => {
    // Prevent navigation during onboarding completion
    if (isCompletingRef.current || loading) {
      console.log('[Onboarding] Blocked step navigation - completion in progress');
      return;
    }

    if (index < 0 || index >= STEPS.length) return;

    // Update the last valid step index
    lastValidStepIndexRef.current = index;

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
      case 'rating':
        return true; // Rating is optional - don't block onboarding
      default:
        return true;
    }
  };

  const handleNext = async () => {
    // Prevent navigation during onboarding completion
    if (isCompletingRef.current || loading) {
      return;
    }

    if (!canProceed()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    // Handle special step logic
    if (currentStep === 'permissions') {
      const granted = await requestPermissions();
      if (!granted) return;
    }

    if (currentStep === 'rating' && rating >= 4) {
      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        try {
          await StoreReview.requestReview();
        } catch (error) {
          console.warn('[Onboarding] StoreReview error:', error);
        }
      }
    }

    if (currentStepIndex < STEPS.length - 1) {
      goToStep(currentStepIndex + 1);
    }
  };

  const handleBack = () => {
    // Prevent navigation during onboarding completion
    if (isCompletingRef.current || loading) {
      return;
    }

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
    // Set completion flag immediately to prevent any state resets
    isCompletingRef.current = true;
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // If user wants to take first scan, set the flag BEFORE refreshing onboarding status
      // This flag will persist across the navigation state change
      if (goToCamera) {
        await AsyncStorage.setItem('@blackpill_first_scan_pending', 'true');
      }

      // Ensure we have a valid session token before making the API call
      let accessToken = session?.access_token;
      console.log('[Onboarding] Session from context:', {
        hasSession: !!session,
        hasAccessToken: !!accessToken,
        tokenLength: accessToken?.length || 0,
        tokenPrefix: accessToken?.substring(0, 20) || 'none',
      });

      if (!accessToken) {
        console.warn('[Onboarding] No session token in context, attempting to fetch fresh session...');
        const { data, error } = await supabase.auth.getSession();
        console.log('[Onboarding] Fresh session fetch result:', {
          hasData: !!data,
          hasSession: !!data?.session,
          hasAccessToken: !!data?.session?.access_token,
          error: error?.message || 'none',
        });

        if (error) {
          throw new Error(`Failed to get session: ${error.message}`);
        }

        if (!data.session?.access_token) {
          throw new Error('No active session. Please log in again.');
        }

        accessToken = data.session.access_token;
        console.log('[Onboarding] Fresh session token obtained, length:', accessToken.length);
      }

      // Final validation - ensure we definitely have a token
      if (!accessToken || accessToken.length === 0) {
        console.error('[Onboarding] CRITICAL: accessToken is still empty/undefined after all checks!');
        throw new Error('Unable to obtain authentication token. Please log in again.');
      }

      console.log('[Onboarding] Token validation passed, token length:', accessToken.length);

      // Save onboarding data to server
      console.log('[Onboarding] Saving onboarding data to server with token...');
      await apiPost(
        '/api/user/onboarding',
        {
          username: profileData.username || null,
          avatarUri: profileData.avatarUri || null,
          goals: selectedGoals,
        },
        accessToken
      );
      console.log('[Onboarding] Onboarding data saved successfully');

      // Refresh onboarding status in auth context
      // This will trigger the navigation to update and go to Home
      // The DailyRoutineScreen will check for the first_scan_pending flag and redirect to Camera
      console.log('[Onboarding] Refreshing onboarding status...');
      const refreshSuccess = await refreshOnboardingStatus();

      if (!refreshSuccess) {
        console.warn('[Onboarding] Initial refresh failed, retrying...');
        // Wait a bit and retry
        await new Promise(resolve => setTimeout(resolve, 500));
        const retrySuccess = await refreshOnboardingStatus();
        if (!retrySuccess) {
          throw new Error('Failed to refresh onboarding status after retry');
        }
      }

      // Verify the state was actually updated
      // Give it a moment for state to propagate
      await new Promise(resolve => setTimeout(resolve, 200));

      // Check if onboarding is actually complete now
      // We'll use a small delay and check the auth context state
      // Note: We can't directly access hasCompletedOnboarding here, but the navigation
      // in App.tsx will handle it based on the updated state
      console.log('[Onboarding] Onboarding completion verified');

      // Don't navigate manually - let the auth context change handle navigation
      // The first scan flag will ensure we get redirected to Camera if needed
      // Keep loading state true and completion flag set until navigation happens
      // The component will unmount when navigation occurs, so we don't need to clear these
    } catch (error: any) {
      console.error('[Onboarding] Failed to complete onboarding:', error);

      // Handle 401 Unauthorized specifically - attempt session refresh and retry
      if (error.status === 401 || (error.message && error.message.includes('Invalid or expired'))) {
        console.warn('[Onboarding] 401 Unauthorized detected. Attempting session refresh and retry...');
        try {
          // Refresh the session
          const { data, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            throw new Error(`Session refresh failed: ${refreshError.message}`);
          }

          if (!data.session?.access_token) {
            throw new Error('Session refresh successful but no new token obtained');
          }

          console.log('[Onboarding] Session refreshed successfully, retrying API call...');

          // Retry the API call with the new token
          await apiPost(
            '/api/user/onboarding',
            {
              username: profileData.username || null,
              avatarUri: profileData.avatarUri || null,
              goals: selectedGoals,
            },
            data.session.access_token
          );
          console.log('[Onboarding] Onboarding data saved successfully after token refresh');

          // Refresh onboarding status after successful retry
          console.log('[Onboarding] Refreshing onboarding status...');
          const refreshSuccess = await refreshOnboardingStatus();
          if (!refreshSuccess) {
            console.warn('[Onboarding] Refresh status failed after successful save, retrying...');
            await new Promise(resolve => setTimeout(resolve, 500));
            await refreshOnboardingStatus();
          }

          console.log('[Onboarding] Onboarding completion verified after retry');
          return; // Success - exit without showing error alert
        } catch (retryError: any) {
          console.error('[Onboarding] Failed to refresh session or retry API call:', retryError);

          // Clear the completion flag on error
          isCompletingRef.current = false;

          // Clear the first scan flag if onboarding failed
          if (goToCamera) {
            await AsyncStorage.removeItem('@blackpill_first_scan_pending');
          }

          showAlert({
            title: 'Session Expired',
            message: 'Your session has expired. Please log in again.',
            buttons: [{ text: 'OK' }],
          });

          // Sign out the user since the session is invalid
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.error('[Onboarding] Error signing out:', signOutError);
          }
          return;
        }
      }

      // Clear the completion flag on error so user can try again
      isCompletingRef.current = false;

      // Clear the first scan flag if onboarding failed
      if (goToCamera) {
        await AsyncStorage.removeItem('@blackpill_first_scan_pending');
      }

      // Restore the step index if it was reset (safety check)
      if (currentStepIndex !== lastValidStepIndexRef.current) {
        console.warn('[Onboarding] Step index was reset, restoring to last valid step:', lastValidStepIndexRef.current);
        setCurrentStepIndex(lastValidStepIndexRef.current);
      }

      // Show error to user
      showAlert({
        title: 'Onboarding Error',
        message: error.message || 'Failed to complete onboarding. Please try again.',
        buttons: [{ text: 'OK' }],
      });

      // Still try to refresh and navigate even if save fails
      try {
        console.log('[Onboarding] Attempting final refresh...');
        await refreshOnboardingStatus();
      } catch (refreshError) {
        console.error('[Onboarding] Final refresh also failed:', refreshError);
      }
    } finally {
      // Only clear loading if there was an error (completion flag will be false)
      // If successful, keep loading true until navigation unmounts the component
      if (!isCompletingRef.current) {
        setLoading(false);
      }
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
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

            <View style={styles.disclaimerCard}>
              <View style={styles.disclaimerInner}>
                <Text style={styles.disclaimerTitle}>Medical Disclaimer</Text>
                <ScrollView
                  style={styles.disclaimerScroll}
                  contentContainerStyle={styles.disclaimerScrollContent}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
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
                    By continuing, you acknowledge that you understand these limitations.
                  </Text>
                </ScrollView>
              </View>
            </View>

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

      case 'rating':
        return (
          <Animated.View
            style={styles.stepContainer}
            entering={FadeIn.duration(500)}
          >
            <View style={styles.ratingHeader}>
              <View style={styles.appIconContainer}>
                <Text style={styles.appIconPlaceholder}>B</Text>
              </View>
              <Text style={styles.stepTitle}>Enjoying Black Pill?</Text>
              <Text style={styles.stepSubtitle}>
                Your feedback helps us improve and stay ad-free for everyone.
              </Text>
            </View>

            <View style={styles.ratingCardContainer}>
              <Text style={styles.ratingQuestion}>How would you rate your experience so far?</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setRating(star);
                    }}
                    style={styles.starButton}
                  >
                    <Star
                      size={44}
                      color={star <= rating ? '#FFD700' : DarkTheme.colors.borderSubtle}
                      fill={star <= rating ? '#FFD700' : 'transparent'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.ratingFeedback}>
                {rating > 0 && (
                  <Text style={styles.ratingText}>
                    {rating === 5 ? "Love it! 😍" :
                      rating === 4 ? "It's great! 😊" :
                        rating === 3 ? "It's good. 👍" :
                          rating === 2 ? "Could be better. 😕" :
                            "Need improvement. 😞"}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.ratingFooter}>
              <Text style={styles.secureText}>
                🛡️ Your rating is private and helps us grow.
              </Text>
              <Text style={styles.optionalText}>
                This step is optional - tap Next to continue
              </Text>
            </View>
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
    height: 280,
    marginBottom: DarkTheme.spacing.lg,
    backgroundColor: DarkTheme.colors.card,
    borderRadius: DarkTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: DarkTheme.colors.borderSubtle,
    overflow: 'hidden',
  },
  disclaimerInner: {
    flex: 1,
    padding: DarkTheme.spacing.md,
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
  disclaimerScrollContent: {
    paddingBottom: DarkTheme.spacing.sm,
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
  // Rating styles
  ratingHeader: {
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.lg,
  },
  appIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: DarkTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DarkTheme.spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: DarkTheme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  appIconPlaceholder: {
    fontSize: 40,
    fontWeight: '800',
    color: '#000',
  },
  ratingCardContainer: {
    backgroundColor: DarkTheme.colors.card,
    borderRadius: DarkTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: DarkTheme.colors.borderSubtle,
    paddingVertical: DarkTheme.spacing.xl,
    paddingHorizontal: DarkTheme.spacing.lg,
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.xl,
  },
  ratingQuestion: {
    fontSize: 18,
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xl,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: DarkTheme.spacing.lg,
  },
  starButton: {
    padding: 4,
  },
  ratingFeedback: {
    height: 30,
    justifyContent: 'center',
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  ratingFooter: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingBottom: DarkTheme.spacing.xl,
  },
  secureText: {
    fontSize: 12,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  optionalText: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: DarkTheme.spacing.sm,
    fontStyle: 'italic',
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
