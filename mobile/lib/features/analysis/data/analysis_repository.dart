import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/analysis_model.dart';

/// Repository for analysis-related data operations
class AnalysisRepository {
  final SupabaseClient _supabase;

  AnalysisRepository(this._supabase);

  /// Get user's analyses
  Future<List<AnalysisModel>> getUserAnalyses({
    required String userId,
    int limit = 10,
    int offset = 0,
  }) async {
    try {
      final response = await _supabase
          .from('analyses')
          .select()
          .eq('user_id', userId)
          .is_('deleted_at', null)
          .order('created_at', ascending: false)
          .range(offset, offset + limit - 1);

      return (response as List)
          .map((json) => AnalysisModel.fromJson(json))
          .toList();
    } catch (e) {
      print('Error getting analyses: $e');
      return [];
    }
  }

  /// Get single analysis by ID
  Future<AnalysisModel?> getAnalysisById(String id) async {
    try {
      final response = await _supabase
          .from('analyses')
          .select()
          .eq('id', id)
          .is_('deleted_at', null)
          .single();

      return AnalysisModel.fromJson(response);
    } catch (e) {
      print('Error getting analysis: $e');
      return null;
    }
  }

  /// Delete analysis (soft delete)
  Future<void> deleteAnalysis(String id, String userId) async {
    await _supabase
        .from('analyses')
        .update({'deleted_at': DateTime.now().toIso8601String()})
        .eq('id', id)
        .eq('user_id', userId);
  }

  /// Toggle analysis public visibility
  Future<void> togglePublic(String id, String userId, bool isPublic) async {
    await _supabase
        .from('analyses')
        .update({'is_public': isPublic})
        .eq('id', id)
        .eq('user_id', userId);
  }

  /// Get public analyses (for community feed)
  Future<List<AnalysisModel>> getPublicAnalyses({
    int limit = 20,
    int offset = 0,
  }) async {
    try {
      final response = await _supabase
          .from('analyses')
          .select()
          .eq('is_public', true)
          .is_('deleted_at', null)
          .order('created_at', ascending: false)
          .range(offset, offset + limit - 1);

      return (response as List)
          .map((json) => AnalysisModel.fromJson(json))
          .toList();
    } catch (e) {
      print('Error getting public analyses: $e');
      return [];
    }
  }

  /// Increment view count
  Future<void> incrementViewCount(String id) async {
    await _supabase.rpc('increment_view_count', params: {'analysis_id': id});
  }

  /// Get user's best score
  Future<double> getUserBestScore(String userId) async {
    try {
      final response = await _supabase
          .from('analyses')
          .select('score')
          .eq('user_id', userId)
          .is_('deleted_at', null)
          .order('score', ascending: false)
          .limit(1)
          .single();

      return (response['score'] as num).toDouble();
    } catch (e) {
      return 0.0;
    }
  }

  /// Get user's average score
  Future<double> getUserAverageScore(String userId) async {
    try {
      final response = await _supabase
          .from('analyses')
          .select('score')
          .eq('user_id', userId)
          .is_('deleted_at', null);

      if (response.isEmpty) return 0.0;

      final scores = (response as List)
          .map((item) => (item['score'] as num).toDouble())
          .toList();

      return scores.reduce((a, b) => a + b) / scores.length;
    } catch (e) {
      return 0.0;
    }
  }
}


