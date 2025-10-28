import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/user_model.dart';

/// Repository for authentication-related data operations
class AuthRepository {
  final SupabaseClient _supabase;

  AuthRepository(this._supabase);

  /// Get current user profile
  Future<UserModel?> getCurrentUserProfile() async {
    final user = _supabase.auth.currentUser;
    if (user == null) return null;

    try {
      final response = await _supabase
          .from('users')
          .select()
          .eq('id', user.id)
          .single();

      return UserModel.fromJson(response);
    } catch (e) {
      print('Error getting user profile: $e');
      return null;
    }
  }

  /// Update user profile
  Future<void> updateUserProfile({
    required String userId,
    String? username,
    String? bio,
    String? location,
    String? avatarUrl,
  }) async {
    final updates = <String, dynamic>{};
    
    if (username != null) updates['username'] = username;
    if (bio != null) updates['bio'] = bio;
    if (location != null) updates['location'] = location;
    if (avatarUrl != null) updates['avatar_url'] = avatarUrl;

    if (updates.isEmpty) return;

    await _supabase
        .from('users')
        .update(updates)
        .eq('id', userId);
  }

  /// Update last active timestamp
  Future<void> updateLastActive(String userId) async {
    await _supabase
        .from('users')
        .update({'last_active': DateTime.now().toIso8601String()})
        .eq('id', userId);
  }

  /// Check if username is available
  Future<bool> isUsernameAvailable(String username) async {
    final response = await _supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();

    return response == null;
  }
}


