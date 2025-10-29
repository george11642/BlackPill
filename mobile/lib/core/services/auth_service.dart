import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_sign_in/google_sign_in.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});

class AuthService {
  final _supabase = Supabase.instance.client;
  final _googleSignIn = GoogleSignIn();

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
      emailRedirectTo: 'blackpill://auth/callback',
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
    return await _supabase.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  /// Sign in with Google
  Future<AuthResponse> signInWithGoogle() async {
    try {
      final googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        throw Exception('Google sign-in cancelled');
      }

      final googleAuth = await googleUser.authentication;
      final accessToken = googleAuth.accessToken;
      final idToken = googleAuth.idToken;

      if (accessToken == null || idToken == null) {
        throw Exception('Missing Google auth tokens');
      }

      final response = await _supabase.auth.signInWithIdToken(
        provider: OAuthProvider.google,
        idToken: idToken,
        accessToken: accessToken,
      );
      
      if (response.user != null) {
        await _createUserProfile(response.user!);
      }
      
      return response;
    } catch (e) {
      rethrow;
    }
  }

  /// Sign out
  Future<void> signOut() async {
    await _googleSignIn.signOut();
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

