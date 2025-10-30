import 'package:dio/dio.dart' hide MultipartFile;
import 'package:dio/dio.dart' as dio_pkg;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../config/env_config.dart';

final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService();
});

class ApiService {
  late final Dio _dio;

  ApiService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: EnvConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
        },
      ),
    );

    // Add interceptor for auth token and retry logic
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final session = Supabase.instance.client.auth.currentSession;
          if (session != null) {
            options.headers['Authorization'] = 'Bearer ${session.accessToken}';
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          // Handle 401 errors
          if (error.response?.statusCode == 401) {
            // Token expired, try to refresh
            await Supabase.instance.client.auth.refreshSession();
            
            // Retry request
            final options = error.requestOptions;
            final session = Supabase.instance.client.auth.currentSession;
            if (session != null) {
              options.headers['Authorization'] = 'Bearer ${session.accessToken}';
            }
            
            try {
              final response = await _dio.fetch(options);
              return handler.resolve(response);
            } catch (e) {
              return handler.next(error);
            }
          }
          
          return handler.next(error);
        },
      ),
    );
  }

  Dio get dio => _dio;

  /// Analyze image
  Future<Map<String, dynamic>> analyzeImage(String imagePath) async {
    final formData = FormData.fromMap({
      'image': await dio_pkg.MultipartFile.fromFile(imagePath),
    });

    final response = await _dio.post(
      '/api/analyze',
      data: formData,
      options: Options(
        contentType: 'multipart/form-data',
      ),
    );

    return response.data;
  }

  /// Get user analyses
  Future<List<dynamic>> getAnalyses({
    int limit = 10,
    int offset = 0,
  }) async {
    final response = await _dio.get(
      '/api/analyses',
      queryParameters: {
        'limit': limit,
        'offset': offset,
      },
    );

    return (response.data['analyses'] as List<dynamic>?) ?? [];
  }

  /// Get analysis by ID
  Future<Map<String, dynamic>> getAnalysis(String id) async {
    final response = await _dio.get('/api/analyses/$id');
    return response.data;
  }

  /// Delete analysis
  Future<void> deleteAnalysis(String id) async {
    await _dio.delete('/api/analyses/$id');
  }

  /// Get subscription status
  Future<Map<String, dynamic>> getSubscriptionStatus() async {
    final response = await _dio.get('/api/subscription/status');
    return response.data;
  }

  /// Accept referral
  Future<Map<String, dynamic>> acceptReferral(String referralCode) async {
    final response = await _dio.post(
      '/api/referral/accept',
      data: {'referral_code': referralCode},
    );
    return response.data;
  }

  /// Get referral stats
  Future<Map<String, dynamic>> getReferralStats() async {
    final response = await _dio.get('/api/referral/stats');
    return response.data;
  }

  /// Send push token
  Future<void> sendPushToken({
    required String token,
    required String platform,
  }) async {
    await _dio.post(
      '/api/push-tokens',
      data: {'token': token, 'platform': platform},
    );
  }

  /// Get leaderboard
  Future<List<dynamic>> getLeaderboard({int limit = 50}) async {
    final response = await _dio.get(
      '/api/leaderboard',
      queryParameters: {'limit': limit},
    );
    return (response.data['leaderboard'] as List<dynamic>?) ?? [];
  }

  /// Get user progress
  Future<Map<String, dynamic>> getUserProgress() async {
    final response = await _dio.get('/api/progress');
    return response.data;
  }

  /// Get public analyses (for community feed)
  Future<List<dynamic>> getPublicAnalyses({int limit = 20}) async {
    final response = await _dio.get(
      '/api/community/public-analyses',
      queryParameters: {
        'limit': limit,
      },
    );
    return (response.data['analyses'] as List<dynamic>?) ?? [];
  }

  /// Get user profile
  Future<Map<String, dynamic>> getUserProfile() async {
    final response = await _dio.get('/api/auth/me');
    return response.data;
  }

  /// Generate share card
  Future<Map<String, dynamic>> generateShareCard(String analysisId) async {
    final response = await _dio.get(
      '/api/share/generate-card',
      queryParameters: {'analysis_id': analysisId},
    );
    return response.data;
  }

  /// Create Stripe checkout session
  Future<Map<String, dynamic>> createCheckoutSession({
    required String tier,
    required String interval,
    String? couponCode,
  }) async {
    final response = await _dio.post(
      '/api/subscriptions/create-checkout',
      data: {
        'tier': tier,
        'interval': interval,
        if (couponCode != null) 'coupon_code': couponCode,
      },
    );
    return response.data;
  }

  /// Cancel subscription
  Future<Map<String, dynamic>> cancelSubscription() async {
    final response = await _dio.post('/api/subscriptions/cancel');
    return response.data;
  }
}

