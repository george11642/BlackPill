import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/onboarding/presentation/splash_screen.dart';
import '../features/auth/presentation/screens/login_screen.dart';
import '../features/auth/presentation/screens/signup_screen.dart';
import '../features/auth/presentation/screens/password_reset_screen.dart';
import '../features/analysis/presentation/screens/camera_screen.dart';
import '../features/analysis/presentation/screens/analysis_loading_screen.dart';
import '../features/results/presentation/screens/results_screen.dart';
import '../features/subscription/presentation/screens/paywall_screen.dart';
import '../features/referral/presentation/referral_stats_screen.dart';
import '../features/leaderboard/presentation/screens/leaderboard_screen.dart';
import '../features/progress/presentation/screens/progress_screen.dart';
import '../features/community/presentation/screens/community_screen.dart';
import '../features/home/presentation/home_screen.dart';
import '../features/profile/presentation/profile_screen.dart';
import '../features/onboarding/presentation/permissions_screen.dart';
import '../core/services/auth_service.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authService = ref.watch(authServiceProvider);
  
  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final isAuthenticated = authService.currentUser != null;
      final isOnAuthScreen = state.matchedLocation.startsWith('/auth');
      final isOnSplash = state.matchedLocation == '/splash';
      
      // Allow splash screen
      if (isOnSplash) return null;
      
      // Redirect to login if not authenticated and not on auth screen
      if (!isAuthenticated && !isOnAuthScreen) {
        return '/auth/login';
      }
      
      // Redirect to home if authenticated and on auth screen
      if (isAuthenticated && isOnAuthScreen) {
        return '/home';
      }
      
      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/auth/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/auth/signup',
        builder: (context, state) => const SignupScreen(),
      ),
      GoRoute(
        path: '/auth/password-reset',
        builder: (context, state) => const PasswordResetScreen(),
      ),
      GoRoute(
        path: '/onboarding/permissions',
        builder: (context, state) => const PermissionsScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/camera',
        builder: (context, state) => const CameraScreen(),
      ),
      GoRoute(
        path: '/referral/stats',
        builder: (context, state) => const ReferralStatsScreen(),
      ),
      GoRoute(
        path: '/leaderboard',
        builder: (context, state) => const LeaderboardScreen(),
      ),
      GoRoute(
        path: '/progress',
        builder: (context, state) => const ProgressScreen(),
      ),
      GoRoute(
        path: '/community',
        builder: (context, state) => const CommunityScreen(),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/analysis/loading',
        builder: (context, state) {
          final imageUrl = state.uri.queryParameters['imageUrl'] ?? '';
          return AnalysisLoadingScreen(imageUrl: imageUrl);
        },
      ),
      GoRoute(
        path: '/results/:analysisId',
        builder: (context, state) {
          final analysisId = state.pathParameters['analysisId'] ?? '';
          return ResultsScreen(analysisId: analysisId);
        },
      ),
      GoRoute(
        path: '/paywall',
        builder: (context, state) => const PaywallScreen(),
      ),
      GoRoute(
        path: '/ref/:code',
        builder: (context, state) {
          final code = state.pathParameters['code'] ?? '';
          // Handle referral code
          return const SplashScreen(); // Will handle referral in splash
        },
      ),
    ],
  );
});

