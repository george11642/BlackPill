import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../config/env_config.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});

class AuthService {
  final _supabase = Supabase.instance.client;

  User? get currentUser => _supabase.auth.currentUser;
  
  Stream<AuthState> get authStateChanges => _supabase.auth.onAuthStateChange;

  /// Sign up with email and password
  Future<AuthResponse> signUpWithEmail({
    required String email,
    required String password,
    required bool ageVerified,
    bool marketingOptIn = false,
  }) async {
    final response = await _supabase.auth.signUp(
      email: email,
      password: password,
      emailRedirectTo: '${EnvConfig.deepLinkScheme}://auth/callback',
      data: {
        'age_verified': ageVerified,
        'marketing_opt_in': marketingOptIn,
      },
    );
    
    if (response.user != null) {
      // Create user profile
      await _createUserProfile(response.user!);
    }
    
    return response;
  }

  /// Sign in with email and password
  Future<AuthResponse> signInWithEmail({
    required String email,
    required String password,
  }) async {
    final response = await _supabase.auth.signInWithPassword(
      email: email,
      password: password,
    );
    
    // Check email verification (enforce as per PRD)
    if (response.user != null && response.user!.emailConfirmedAt == null) {
      // User is signed in but email not verified
      // Sign them out and throw error
      await signOut();
      throw Exception('Please verify your email address before signing in. Check your inbox for the verification link.');
    }
    
    return response;
  }

  /// Sign in with Google using Supabase OAuth
  /// Uses Supabase's built-in OAuth flow - no Android/iOS client IDs needed!
  /// Only requires Web OAuth client ID configured in Supabase Dashboard
  Future<AuthResponse> signInWithGoogle() async {
    try {
      final response = await _supabase.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: '${EnvConfig.deepLinkScheme}://auth/callback',
        authScreenLaunchMode: LaunchMode.externalApplication,
      );
      
      // Note: The actual user creation happens automatically via Supabase
      // when the OAuth callback completes. We'll handle profile creation
      // in the auth state listener in the app initialization.
      
      // OAuth sign-in returns a bool (was redirected), not AuthResponse
      // Return a dummy AuthResponse - the actual auth happens via callback
      final user = _supabase.auth.currentUser;
      return AuthResponse(
        user: user,
        session: _supabase.auth.currentSession,
      );
    } catch (e) {
      throw Exception('Failed to initiate Google sign-in: $e');
    }
  }

  /// Sign out
  Future<void> signOut() async {
    await _supabase.auth.signOut();
  }

  /// Reset password
  Future<void> resetPassword(String email) async {
    await _supabase.auth.resetPasswordForEmail(email);
  }

  /// Delete account
  Future<void> deleteAccount() async {
    final userId = currentUser?.id;
    if (userId == null) return;
    
    // Soft delete by setting deleted_at
    await _supabase.from('users').update({
      'deleted_at': DateTime.now().toIso8601String(),
    }).eq('id', userId);
    
    await signOut();
  }

  /// Create user profile in database
  Future<void> _createUserProfile(User user) async {
    await createUserProfileIfNeeded(user);
  }

  /// Create user profile if it doesn't exist (public for OAuth callbacks)
  Future<void> createUserProfileIfNeeded(User user) async {
    try {
      // Check if profile already exists
      final existing = await _supabase
          .from('users')
          .select()
          .eq('id', user.id)
          .maybeSingle();
      
      if (existing != null) return;
      
      // Generate referral code
      final referralCode = _generateReferralCode();
      
      await _supabase.from('users').insert({
        'id': user.id,
        'email': user.email,
        'google_id': user.userMetadata?['sub'],
        'referral_code': referralCode,
        'scans_remaining': 1,
        'tier': 'free',
        'age_verified': user.userMetadata?['age_verified'] ?? false,
      });
    } catch (e) {
      // Profile might already exist
      print('Error creating user profile: $e');
    }
  }

  /// Generate unique referral code
  String _generateReferralCode() {
    final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
    final random = timestamp.substring(timestamp.length - 8);
    return 'INVITE-${random.substring(0, 4)}-${random.substring(4)}';
  }
}

