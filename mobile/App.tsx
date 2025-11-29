import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import { NavigationContainer, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet, useColorScheme, Platform, LogBox } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AchievementToast } from './components/AchievementToast';
import { AuthProvider, useAuth } from './lib/auth/context';
import { SubscriptionProvider } from './lib/subscription/context';
import { DarkTheme } from './lib/theme';

// Ignore warnings from third-party libraries
LogBox.ignoreLogs([
  'Unknown event handler property `onResponderTerminate`', // react-native-chart-kit warning
]);

// Screens
import { SplashScreen } from './screens/SplashScreen';
import { LoginScreen } from './screens/LoginScreen';
import { SignupScreen } from './screens/SignupScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { CameraScreen } from './screens/CameraScreen';
import { AnalysisResultScreen } from './screens/AnalysisResultScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { ComparisonScreen } from './screens/ComparisonScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { RoutinesScreen } from './screens/RoutinesScreen';
import { RoutineDetailScreen } from './screens/RoutineDetailScreen';
import { TasksScreen } from './screens/TasksScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { AchievementsScreen } from './screens/AchievementsScreen';
import { ShareScreen } from './screens/ShareScreen';
import { ChallengesScreen } from './screens/ChallengesScreen';
import { ChallengeDetailScreen } from './screens/ChallengeDetailScreen';
import { WellnessScreen } from './screens/WellnessScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { SubscriptionScreen } from './screens/SubscriptionScreen';
import { EthicalSettingsScreen } from './screens/EthicalSettingsScreen';
import { AICoachScreen } from './screens/AICoachScreen';
import { AITransformScreen } from './screens/AITransformScreen';
import { DailyRoutineScreen } from './screens/DailyRoutineScreen';
import { ProgressPicturesScreen } from './screens/ProgressPicturesScreen';
import { CreateRoutineScreen } from './screens/CreateRoutineScreen';
import AffiliateDashboardScreen from './screens/AffiliateDashboardScreen';
import { ReferralsScreen } from './screens/ReferralsScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { HelpAndSupportScreen } from './screens/HelpAndSupportScreen';
import { TimelapseSelectionScreen } from './screens/TimelapseSelectionScreen';
import { TimelapseGenerationScreen } from './screens/TimelapseGenerationScreen';
import { CreateGoalScreen } from './screens/CreateGoalScreen';
import { MethodologyScreen } from './screens/MethodologyScreen';
import { MarketplaceScreen } from './screens/MarketplaceScreen';
import * as Sentry from '@sentry/react-native';
import { initializeRevenueCat } from './lib/revenuecat/client';

Sentry.init({
  dsn: 'https://19300b03c051d8d44647dd9b21725290@o4510410685612032.ingest.us.sentry.io/4510433262436352',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { user, loading, hasCompletedOnboarding, onboardingLoading, refreshOnboardingStatus } = useAuth();
  const navigationRef = useRef<any>(null);
  const hasCheckedFirstScan = useRef(false);
  const onboardingCheckAttempts = useRef(0);
  const lastOnboardingCheck = useRef<number>(0);

  // Initialize RevenueCat when user is available
  useEffect(() => {
    if (user?.id && !loading) {
      initializeRevenueCat(user.id);
    }
  }, [user?.id, loading]);

  // Safety check: If we're stuck showing onboarding but user has actually completed it,
  // force a refresh of the onboarding status
  useEffect(() => {
    // Only run safety check if:
    // - User is logged in
    // - Not loading
    // - Onboarding status says not completed
    // - We haven't checked too recently (avoid infinite loops)
    if (!user || loading || onboardingLoading || hasCompletedOnboarding) {
      return;
    }

    const now = Date.now();
    const timeSinceLastCheck = now - lastOnboardingCheck.current;
    
    // Only check if it's been at least 2 seconds since last check
    if (timeSinceLastCheck < 2000) {
      return;
    }

    // Limit the number of safety checks to prevent infinite loops
    if (onboardingCheckAttempts.current >= 3) {
      console.warn('[App] Max onboarding safety checks reached, stopping');
      return;
    }

    const performSafetyCheck = async () => {
      onboardingCheckAttempts.current += 1;
      lastOnboardingCheck.current = now;
      
      console.log(`[App] Performing onboarding safety check (attempt ${onboardingCheckAttempts.current})...`);
      
      try {
        const success = await refreshOnboardingStatus();
        if (success) {
          console.log('[App] Safety check: Onboarding status refreshed successfully');
          // Reset attempts counter on success
          onboardingCheckAttempts.current = 0;
        } else {
          console.warn('[App] Safety check: Failed to refresh onboarding status');
        }
      } catch (error) {
        console.error('[App] Safety check error:', error);
      }
    };

    // Delay the safety check slightly to avoid race conditions
    const timeoutId = setTimeout(performSafetyCheck, 1000);
    return () => clearTimeout(timeoutId);
  }, [user, loading, onboardingLoading, hasCompletedOnboarding, refreshOnboardingStatus]);

  // Check for first scan pending flag when onboarding completes
  // This handles navigation to Camera before tabs are shown
  useEffect(() => {
    // Only check if onboarding is complete and we haven't checked before
    if (!hasCompletedOnboarding || hasCheckedFirstScan.current || loading || onboardingLoading) {
      return;
    }

    const checkFirstScanPending = async () => {
      try {
        const pending = await AsyncStorage.getItem('@blackpill_first_scan_pending');
        if (pending === 'true') {
          // Mark as checked immediately
          hasCheckedFirstScan.current = true;
          // Clear the flag
          await AsyncStorage.removeItem('@blackpill_first_scan_pending');
          // Small delay to ensure navigation is ready, then navigate to Camera
          setTimeout(() => {
            if (navigationRef.current?.isReady()) {
              navigationRef.current.navigate('Camera', { firstScan: true });
            }
          }, 300);
        } else {
          // Mark as checked even if flag doesn't exist
          hasCheckedFirstScan.current = true;
        }
      } catch (error) {
        console.error('Error checking first scan flag:', error);
        hasCheckedFirstScan.current = true;
      }
    };

    checkFirstScanPending();
  }, [hasCompletedOnboarding, loading, onboardingLoading]);

  // Reset onboarding check attempts when onboarding completes
  useEffect(() => {
    if (hasCompletedOnboarding) {
      onboardingCheckAttempts.current = 0;
    }
  }, [hasCompletedOnboarding]);

  // Show splash while loading auth or onboarding status
  const isLoading = loading || (user && onboardingLoading);

  return (
    <NavigationContainer ref={navigationRef} theme={NavDarkTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoading ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : user ? (
          // User is logged in - check onboarding status
          hasCompletedOnboarding ? (
            // Onboarding complete - show main app
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Camera" component={CameraScreen} />
              <Stack.Screen name="AnalysisResult" component={AnalysisResultScreen} />
              <Stack.Screen name="History" component={HistoryScreen} />
              <Stack.Screen name="Comparison" component={ComparisonScreen} />
              <Stack.Screen name="Progress" component={ProgressScreen} />
              <Stack.Screen name="Routines" component={RoutinesScreen} />
              <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
              <Stack.Screen name="Tasks" component={TasksScreen} />
              <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
              <Stack.Screen name="Achievements" component={AchievementsScreen} />
              <Stack.Screen name="Share" component={ShareScreen} />
              <Stack.Screen name="Challenges" component={ChallengesScreen} />
              <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} />
              <Stack.Screen name="Wellness" component={WellnessScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="Subscription" component={SubscriptionScreen} />
              <Stack.Screen name="EthicalSettings" component={EthicalSettingsScreen} />
              <Stack.Screen name="AICoach" component={AICoachScreen} />
              <Stack.Screen name="AITransform" component={AITransformScreen} />
              <Stack.Screen name="DailyRoutine" component={DailyRoutineScreen} />
              <Stack.Screen name="ProgressPictures" component={ProgressPicturesScreen} />
              <Stack.Screen name="CreateRoutine" component={CreateRoutineScreen} />
              <Stack.Screen name="Affiliate" component={AffiliateDashboardScreen} />
              <Stack.Screen name="Referrals" component={ReferralsScreen} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} />
              <Stack.Screen name="HelpAndSupport" component={HelpAndSupportScreen} />
              <Stack.Screen name="TimelapseSelection" component={TimelapseSelectionScreen} />
              <Stack.Screen name="TimelapseGeneration" component={TimelapseGenerationScreen} />
              <Stack.Screen name="CreateGoal" component={CreateGoalScreen} />
              <Stack.Screen name="Methodology" component={MethodologyScreen} />
              <Stack.Screen name="Marketplace" component={MarketplaceScreen} />
            </>
          ) : (
            // Onboarding not complete - show onboarding flow
            // Include main screens so navigation.reset works after onboarding
            <>
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Camera" component={CameraScreen} />
              <Stack.Screen name="AnalysisResult" component={AnalysisResultScreen} />
              <Stack.Screen name="History" component={HistoryScreen} />
              <Stack.Screen name="Comparison" component={ComparisonScreen} />
              <Stack.Screen name="Progress" component={ProgressScreen} />
              <Stack.Screen name="Routines" component={RoutinesScreen} />
              <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
              <Stack.Screen name="Tasks" component={TasksScreen} />
              <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
              <Stack.Screen name="Achievements" component={AchievementsScreen} />
              <Stack.Screen name="Share" component={ShareScreen} />
              <Stack.Screen name="Challenges" component={ChallengesScreen} />
              <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} />
              <Stack.Screen name="Wellness" component={WellnessScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="Subscription" component={SubscriptionScreen} />
              <Stack.Screen name="EthicalSettings" component={EthicalSettingsScreen} />
              <Stack.Screen name="AICoach" component={AICoachScreen} />
              <Stack.Screen name="AITransform" component={AITransformScreen} />
              <Stack.Screen name="DailyRoutine" component={DailyRoutineScreen} />
              <Stack.Screen name="ProgressPictures" component={ProgressPicturesScreen} />
              <Stack.Screen name="CreateRoutine" component={CreateRoutineScreen} />
              <Stack.Screen name="Affiliate" component={AffiliateDashboardScreen} />
              <Stack.Screen name="Referrals" component={ReferralsScreen} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} />
              <Stack.Screen name="HelpAndSupport" component={HelpAndSupportScreen} />
              <Stack.Screen name="TimelapseSelection" component={TimelapseSelectionScreen} />
              <Stack.Screen name="TimelapseGeneration" component={TimelapseGenerationScreen} />
              <Stack.Screen name="CreateGoal" component={CreateGoalScreen} />
              <Stack.Screen name="Methodology" component={MethodologyScreen} />
              <Stack.Screen name="Marketplace" component={MarketplaceScreen} />
            </>
          )
        ) : (
          // Not logged in - show auth screens
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <StatusBar style="light" />
            <RootNavigator />
            <AchievementToast />
          </SubscriptionProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default Sentry.wrap(App);