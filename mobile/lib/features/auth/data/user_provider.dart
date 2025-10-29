import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/user_model.dart';
import 'auth_repository.dart';

/// Provider for authentication repository
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(Supabase.instance.client);
});

/// Provider for current user profile with 1-hour caching
final currentUserProfileProvider = FutureProvider.autoDispose<UserModel?>((ref) async {
  final authRepo = ref.watch(authRepositoryProvider);
  final profile = await authRepo.getCurrentUserProfile();
  
  // Keep alive for 1 hour as per PRD caching strategy
  ref.keepAlive();
  
  // Auto-dispose after 1 hour
  final timer = Timer(const Duration(hours: 1), () {
    ref.invalidateSelf();
  });
  
  ref.onDispose(() {
    timer.cancel();
  });
  
  return profile;
});

/// Provider for user analyses with 5-minute caching
final userAnalysesProvider = FutureProvider.autoDispose<List>((ref) async {
  // This would call the API service to get analyses
  // Cached for 5 minutes as per PRD
  ref.keepAlive();
  
  final timer = Timer(const Duration(minutes: 5), () {
    ref.invalidateSelf();
  });
  
  ref.onDispose(() {
    timer.cancel();
  });
  
  // Return empty for now - implement with API call
  return [];
});

/// Provider for leaderboard with 30-minute caching
final leaderboardProvider = FutureProvider.autoDispose<List>((ref) async {
  // This would call the API service to get leaderboard
  // Cached for 30 minutes as per PRD
  ref.keepAlive();
  
  final timer = Timer(const Duration(minutes: 30), () {
    ref.invalidateSelf();
  });
  
  ref.onDispose(() {
    timer.cancel();
  });
  
  // Return empty for now - implement with API call
  return [];
});

import 'dart:async';

