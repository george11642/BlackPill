import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/referral_model.dart';

/// Repository for referral-related data operations
class ReferralRepository {
  final SupabaseClient _supabase;

  ReferralRepository(this._supabase);

  /// Get user's referrals
  Future<List<ReferralModel>> getUserReferrals(String userId) async {
    try {
      final response = await _supabase
          .from('referrals')
          .select()
          .eq('from_user_id', userId)
          .order('created_at', ascending: false);

      return (response as List)
          .map((json) => ReferralModel.fromJson(json))
          .toList();
    } catch (e) {
      print('Error getting referrals: $e');
      return [];
    }
  }

  /// Check if user has accepted a referral
  Future<bool> hasAcceptedReferral(String userId) async {
    try {
      final response = await _supabase
          .from('users')
          .select('referred_by')
          .eq('id', userId)
          .single();

      return response['referred_by'] != null;
    } catch (e) {
      return false;
    }
  }

  /// Get referral by code
  Future<ReferralModel?> getReferralByCode(String code) async {
    try {
      final response = await _supabase
          .from('referrals')
          .select()
          .eq('referral_code', code)
          .maybeSingle();

      if (response == null) return null;
      
      return ReferralModel.fromJson(response);
    } catch (e) {
      print('Error getting referral by code: $e');
      return null;
    }
  }
}


