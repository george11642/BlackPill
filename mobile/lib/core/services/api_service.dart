import 'package:dio/dio.dart';
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
          
          // Handle network errors with retry (exponential backoff: 1s, 2s, 4s)
          if (error.type == DioExceptionType.connectionTimeout ||
              error.type == DioExceptionType.receiveTimeout ||
              error.type == DioExceptionType.connectionError) {
            final retryCount = error.requestOptions.extra['retry_count'] as int? ?? 0;
            
            if (retryCount < 3) {
              // Exponential backoff: 1s, 2s, 4s
              final delaySeconds = (1 << retryCount); // 2^retryCount
              await Future.delayed(Duration(seconds: delaySeconds));
              
              // Retry request
              error.requestOptions.extra['retry_count'] = retryCount + 1;
              
              try {
                final response = await _dio.fetch(error.requestOptions);
                return handler.resolve(response);
              } catch (e) {
                return handler.next(error);
              }
            }
          }
          
          // Handle 5xx errors with retry
          if (error.response != null && 
              error.response!.statusCode != null &&
              error.response!.statusCode! >= 500) {
            final retryCount = error.requestOptions.extra['retry_count'] as int? ?? 0;
            
            if (retryCount < 3) {
              final delaySeconds = (1 << retryCount);
              await Future.delayed(Duration(seconds: delaySeconds));
              
              error.requestOptions.extra['retry_count'] = retryCount + 1;
              
              try {
                final response = await _dio.fetch(error.requestOptions);
                return handler.resolve(response);
              } catch (e) {
                return handler.next(error);
              }
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
      'image': await MultipartFile.fromFile(imagePath),
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

    return response.data['analyses'];
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

  /// Accept referral code
  Future<Map<String, dynamic>> acceptReferral(String code) async {
    final response = await _dio.post(
      '/api/referral/accept',
      data: {'referral_code': code},
    );
    return response.data;
  }

  /// Get referral stats
  Future<Map<String, dynamic>> getReferralStats() async {
    final response = await _dio.get('/api/referral/stats');
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

  /// Get subscription status
  Future<Map<String, dynamic>> getSubscriptionStatus() async {
    final response = await _dio.get('/api/subscriptions/status');
    return response.data;
  }

  /// Cancel subscription
  Future<Map<String, dynamic>> cancelSubscription() async {
    final response = await _dio.post('/api/subscriptions/cancel');
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

  /// Get user profile
  Future<Map<String, dynamic>> getUserProfile() async {
    final response = await _dio.get('/api/auth/me');
    return response.data;
  }

  /// Get leaderboard
  Future<List<dynamic>> getLeaderboard({
    int limit = 10,
    int offset = 0,
  }) async {
    final response = await _dio.get(
      '/api/leaderboard',
      queryParameters: {
        'limit': limit,
        'offset': offset,
      },
    );
    return response.data['leaderboard'];
  }

  /// Get referral leaderboard
  Future<List<dynamic>> getReferralLeaderboard({
    int limit = 10,
    int offset = 0,
  }) async {
    final response = await _dio.get(
      '/api/leaderboard/referrals',
      queryParameters: {
        'limit': limit,
        'offset': offset,
      },
    );
    return response.data['leaderboard'];
  }

  /// Send push notification token to backend
  Future<void> sendPushToken({
    required String token,
    required String platform,
  }) async {
    await _dio.post(
      '/api/user/push-token',
      data: {
        'token': token,
        'platform': platform,
      },
    );
  }

  /// Get public analyses for community feed
  Future<List<dynamic>> getPublicAnalyses({
    int limit = 20,
    int offset = 0,
  }) async {
    final response = await _dio.get(
      '/api/community/public-analyses',
      queryParameters: {
        'limit': limit,
        'offset': offset,
      },
    );
    return response.data['analyses'] || [];
  }
}

