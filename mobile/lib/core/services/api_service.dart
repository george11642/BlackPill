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
    final response = await _dio.get('/api/subscriptions/status');
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

  /// Generate routine
  Future<Map<String, dynamic>> generateRoutine({
    required String analysisId,
    required List<String> focusAreas,
    String timeCommitment = 'medium',
    Map<String, dynamic>? preferences,
  }) async {
    final response = await _dio.post(
      '/api/routines/generate',
      data: {
        'analysisId': analysisId,
        'focusAreas': focusAreas,
        'timeCommitment': timeCommitment,
        if (preferences != null) 'preferences': preferences,
      },
    );
    // Return full response including actionPlans
    return response.data;
  }

  /// Get user routines
  Future<List<dynamic>> getRoutines({bool activeOnly = false}) async {
    final response = await _dio.get(
      '/api/routines',
      queryParameters: {
        if (activeOnly) 'active_only': 'true',
      },
    );
    return (response.data['routines'] as List<dynamic>?) ?? [];
  }

  /// Get today's tasks
  Future<List<dynamic>> getTodayTasks() async {
    final response = await _dio.get('/api/routines/today');
    return (response.data['tasks'] as List<dynamic>?) ?? [];
  }

  /// Complete a task
  Future<Map<String, dynamic>> completeTask({
    required String taskId,
    required String routineId,
    bool skipped = false,
    String? notes,
  }) async {
    final response = await _dio.post(
      '/api/routines/complete-task',
      data: {
        'taskId': taskId,
        'routineId': routineId,
        'skipped': skipped,
        if (notes != null) 'notes': notes,
      },
    );
    return response.data;
  }

  /// Get routine stats
  Future<Map<String, dynamic>> getRoutineStats(String routineId) async {
    final response = await _dio.get(
      '/api/routines/stats',
      queryParameters: {'routine_id': routineId},
    );
    return response.data;
  }

  /// Get tasks for a routine
  Future<List<dynamic>> getRoutineTasks(String routineId) async {
    final response = await _dio.get(
      '/api/routines/tasks',
      queryParameters: {'routine_id': routineId},
    );
    return (response.data['tasks'] as List<dynamic>?) ?? [];
  }

  /// Update routine
  Future<Map<String, dynamic>> updateRoutine({
    required String routineId,
    String? name,
    String? goal,
    List<String>? focusCategories,
    bool? isActive,
  }) async {
    final response = await _dio.put(
      '/api/routines/update',
      data: {
        'routine_id': routineId,
        if (name != null) 'name': name,
        if (goal != null) 'goal': goal,
        if (focusCategories != null) 'focus_categories': focusCategories,
        if (isActive != null) 'is_active': isActive,
      },
    );
    return response.data['routine'];
  }

  /// Delete routine
  Future<void> deleteRoutine(String routineId) async {
    await _dio.delete(
      '/api/routines/delete',
      queryParameters: {'routine_id': routineId},
    );
  }

  /// Get scoring preferences
  Future<Map<String, dynamic>> getScoringPreferences() async {
    final response = await _dio.get('/api/scoring/preferences');
    return response.data;
  }

  /// Update scoring preferences
  Future<Map<String, dynamic>> updateScoringPreferences({
    int? symmetryWeight,
    int? skinWeight,
    int? jawlineWeight,
    int? eyesWeight,
    int? lipsWeight,
    int? boneStructureWeight,
  }) async {
    final response = await _dio.put(
      '/api/scoring/preferences',
      data: {
        if (symmetryWeight != null) 'symmetry_weight': symmetryWeight,
        if (skinWeight != null) 'skin_weight': skinWeight,
        if (jawlineWeight != null) 'jawline_weight': jawlineWeight,
        if (eyesWeight != null) 'eyes_weight': eyesWeight,
        if (lipsWeight != null) 'lips_weight': lipsWeight,
        if (boneStructureWeight != null) 'bone_structure_weight': boneStructureWeight,
      },
    );
    return response.data;
  }

  /// Recalculate score with custom weights
  Future<Map<String, dynamic>> recalculateScore({
    required String analysisId,
    Map<String, int>? customWeights,
  }) async {
    final response = await _dio.post(
      '/api/scoring/recalculate',
      data: {
        'analysisId': analysisId,
        if (customWeights != null) 'customWeights': customWeights,
      },
    );
    return response.data;
  }

  /// Get scoring methodology
  Future<Map<String, dynamic>> getScoringMethodology() async {
    final response = await _dio.get('/api/scoring/methodology');
    return response.data;
  }

  /// Get ethical settings
  Future<Map<String, dynamic>> getEthicalSettings() async {
    final response = await _dio.get('/api/ethical/settings');
    return response.data;
  }

  /// Update ethical settings
  Future<Map<String, dynamic>> updateEthicalSettings({
    bool? ageEstimation,
    bool? ethnicityDetection,
    bool? bodyTypeInferences,
    bool? advancedFeatures,
    bool? disclaimersAcknowledged,
    bool? enableWellnessChecks,
    String? checkFrequency,
    bool? showResourcesOnLowScores,
  }) async {
    final response = await _dio.put(
      '/api/ethical/settings',
      data: {
        if (ageEstimation != null) 'age_estimation': ageEstimation,
        if (ethnicityDetection != null) 'ethnicity_detection': ethnicityDetection,
        if (bodyTypeInferences != null) 'body_type_inferences': bodyTypeInferences,
        if (advancedFeatures != null) 'advanced_features': advancedFeatures,
        if (disclaimersAcknowledged != null) 'disclaimers_acknowledged': disclaimersAcknowledged,
        if (enableWellnessChecks != null) 'enable_wellness_checks': enableWellnessChecks,
        if (checkFrequency != null) 'check_frequency': checkFrequency,
        if (showResourcesOnLowScores != null) 'show_resources_on_low_scores': showResourcesOnLowScores,
      },
    );
    return response.data;
  }

  /// Check wellness status
  Future<Map<String, dynamic>> checkWellness() async {
    final response = await _dio.get('/api/ethical/wellness-check');
    return response.data;
  }

  /// Record wellness check response
  Future<Map<String, dynamic>> recordWellnessCheck({
    required String triggerReason,
    required String messageShown,
    bool? resourcesAccessed,
    String? userResponse,
  }) async {
    final response = await _dio.post(
      '/api/ethical/wellness-check',
      data: {
        'trigger_reason': triggerReason,
        'message_shown': messageShown,
        if (resourcesAccessed != null) 'resources_accessed': resourcesAccessed,
        if (userResponse != null) 'user_response': userResponse,
      },
    );
    return response.data;
  }

  /// Get mental health resources
  Future<Map<String, dynamic>> getMentalHealthResources() async {
    final response = await _dio.get('/api/ethical/resources');
    return response.data;
  }

  /// Get products
  Future<List<dynamic>> getProducts({
    String? category,
    String? recommendedFor,
    bool? featured,
    int limit = 50,
    int offset = 0,
  }) async {
    final response = await _dio.get(
      '/api/products',
      queryParameters: {
        if (category != null) 'category': category,
        if (recommendedFor != null) 'recommended_for': recommendedFor,
        if (featured != null) 'featured': featured.toString(),
        'limit': limit,
        'offset': offset,
      },
    );
    return (response.data['products'] as List<dynamic>?) ?? [];
  }

  /// Get product recommendations
  Future<List<dynamic>> getProductRecommendations(String analysisId) async {
    final response = await _dio.post(
      '/api/products/recommend',
      data: {'analysisId': analysisId},
    );
    return (response.data['recommendations'] as List<dynamic>?) ?? [];
  }

  /// Track product click
  Future<Map<String, dynamic>> trackProductClick({
    required String productId,
    String? analysisId,
  }) async {
    final response = await _dio.post(
      '/api/products/click',
      data: {
        'productId': productId,
        if (analysisId != null) 'analysisId': analysisId,
      },
    );
    return response.data;
  }

  /// Generate insights
  Future<List<dynamic>> generateInsights() async {
    final response = await _dio.post('/api/insights/generate');
    return (response.data['insights'] as List<dynamic>?) ?? [];
  }

  /// Get insights
  Future<List<dynamic>> getInsights({
    bool unviewedOnly = false,
    int limit = 10,
    int offset = 0,
  }) async {
    final response = await _dio.get(
      '/api/insights',
      queryParameters: {
        if (unviewedOnly) 'unviewed_only': 'true',
        'limit': limit,
        'offset': offset,
      },
    );
    return (response.data['insights'] as List<dynamic>?) ?? [];
  }

  /// Mark insight as viewed
  Future<Map<String, dynamic>> markInsightViewed(String insightId) async {
    final response = await _dio.put(
      '/api/insights/mark-viewed',
      data: {'insightId': insightId},
    );
    return response.data;
  }

  /// Get challenges
  Future<List<dynamic>> getChallenges({
    String? difficulty,
    String? focusArea,
  }) async {
    final response = await _dio.get(
      '/api/challenges',
      queryParameters: {
        if (difficulty != null) 'difficulty': difficulty,
        if (focusArea != null) 'focus_area': focusArea,
      },
    );
    return (response.data['challenges'] as List<dynamic>?) ?? [];
  }

  /// Join challenge
  Future<Map<String, dynamic>> joinChallenge({
    required String challengeId,
    String? calibrationPhotoUrl,
  }) async {
    final response = await _dio.post(
      '/api/challenges/join',
      data: {
        'challengeId': challengeId,
        if (calibrationPhotoUrl != null) 'calibrationPhotoUrl': calibrationPhotoUrl,
      },
    );
    return response.data;
  }

  /// Submit challenge check-in
  Future<Map<String, dynamic>> submitChallengeCheckin({
    required String participationId,
    required int day,
    required String photoUrl,
    Map<String, dynamic>? verificationData,
    String? notes,
  }) async {
    final response = await _dio.post(
      '/api/challenges/checkin',
      data: {
        'participationId': participationId,
        'day': day,
        'photoUrl': photoUrl,
        if (verificationData != null) 'verificationData': verificationData,
        if (notes != null) 'notes': notes,
      },
    );
    return response.data;
  }

  /// Get my challenges
  Future<List<dynamic>> getMyChallenges({String? status}) async {
    final response = await _dio.get(
      '/api/challenges/my-challenges',
      queryParameters: {
        if (status != null) 'status': status,
      },
    );
    return (response.data['participations'] as List<dynamic>?) ?? [];
  }

  /// Sync wellness data
  Future<Map<String, dynamic>> syncWellnessData({
    required String date,
    double? sleepHours,
    String? sleepQuality,
    String? sleepSource,
    double? hydrationOunces,
    double? hydrationGoal,
    String? hydrationSource,
    double? hrv,
    double? restingHr,
    String? stressLevel,
    String? stressSource,
    int? exerciseMinutes,
    String? exerciseIntensity,
    List<String>? exerciseType,
    int? exerciseCalories,
    String? exerciseSource,
    int? caloriesConsumed,
    double? proteinGrams,
    double? waterIntake,
    String? nutritionSource,
  }) async {
    final response = await _dio.post(
      '/api/wellness/sync',
      data: {
        'date': date,
        if (sleepHours != null) 'sleep_hours': sleepHours,
        if (sleepQuality != null) 'sleep_quality': sleepQuality,
        if (sleepSource != null) 'sleep_source': sleepSource,
        if (hydrationOunces != null) 'hydration_ounces': hydrationOunces,
        if (hydrationGoal != null) 'hydration_goal': hydrationGoal,
        if (hydrationSource != null) 'hydration_source': hydrationSource,
        if (hrv != null) 'hrv': hrv,
        if (restingHr != null) 'resting_hr': restingHr,
        if (stressLevel != null) 'stress_level': stressLevel,
        if (stressSource != null) 'stress_source': stressSource,
        if (exerciseMinutes != null) 'exercise_minutes': exerciseMinutes,
        if (exerciseIntensity != null) 'exercise_intensity': exerciseIntensity,
        if (exerciseType != null) 'exercise_type': exerciseType,
        if (exerciseCalories != null) 'exercise_calories': exerciseCalories,
        if (exerciseSource != null) 'exercise_source': exerciseSource,
        if (caloriesConsumed != null) 'calories_consumed': caloriesConsumed,
        if (proteinGrams != null) 'protein_grams': proteinGrams,
        if (waterIntake != null) 'water_intake': waterIntake,
        if (nutritionSource != null) 'nutrition_source': nutritionSource,
      },
    );
    return response.data;
  }

  /// Get wellness data
  Future<List<dynamic>> getWellnessData({
    String? startDate,
    String? endDate,
    int limit = 30,
  }) async {
    final response = await _dio.get(
      '/api/wellness/data',
      queryParameters: {
        if (startDate != null) 'start_date': startDate,
        if (endDate != null) 'end_date': endDate,
        'limit': limit,
      },
    );
    return (response.data['wellnessData'] as List<dynamic>?) ?? [];
  }

  /// Calculate wellness correlations
  Future<List<dynamic>> calculateWellnessCorrelations() async {
    final response = await _dio.post('/api/wellness/correlations');
    return (response.data['correlations'] as List<dynamic>?) ?? [];
  }

  /// Compare two analyses
  Future<Map<String, dynamic>> compareAnalyses({
    required String beforeId,
    required String afterId,
  }) async {
    final response = await _dio.get(
      '/api/comparisons/compare',
      queryParameters: {
        'beforeId': beforeId,
        'afterId': afterId,
      },
    );
    return response.data['comparison'];
  }

  /// Record daily check-in
  Future<Map<String, dynamic>> checkIn({List<String>? activities}) async {
    final response = await _dio.post(
      '/api/checkins/checkin',
      data: {
        if (activities != null) 'activities': activities,
      },
    );
    return response.data;
  }

  /// Get check-in status
  Future<Map<String, dynamic>> getCheckInStatus() async {
    final response = await _dio.get('/api/checkins/status');
    return response.data;
  }

  /// Get achievements
  Future<Map<String, dynamic>> getAchievements() async {
    final response = await _dio.get('/api/achievements');
    return response.data;
  }

  /// Unlock achievement
  Future<Map<String, dynamic>> unlockAchievement(String achievementKey) async {
    final response = await _dio.post(
      '/api/achievements/unlock',
      data: {'achievement_key': achievementKey},
    );
    return response.data;
  }

  /// Get photo history
  Future<Map<String, dynamic>> getPhotoHistory({
    int limit = 50,
    int offset = 0,
    String sortBy = 'created_at',
    String order = 'desc',
    String? startDate,
    String? endDate,
    double? minScore,
    double? maxScore,
  }) async {
    final response = await _dio.get(
      '/api/analyses/history',
      queryParameters: {
        'limit': limit,
        'offset': offset,
        'sort_by': sortBy,
        'order': order,
        if (startDate != null) 'start_date': startDate,
        if (endDate != null) 'end_date': endDate,
        if (minScore != null) 'min_score': minScore,
        if (maxScore != null) 'max_score': maxScore,
      },
    );
    return response.data;
  }

  /// Send message to AI coach
  Future<Map<String, dynamic>> sendAICoachMessage({
    String? conversationId,
    required String message,
  }) async {
    final response = await _dio.post(
      '/api/ai-coach/chat',
      data: {
        if (conversationId != null) 'conversationId': conversationId,
        'message': message,
      },
    );
    return response.data;
  }

  /// Get AI conversations
  Future<List<dynamic>> getAIConversations() async {
    final response = await _dio.get('/api/ai-coach/conversations');
    return (response.data['conversations'] as List<dynamic>?) ?? [];
  }

  /// Get AI conversation messages
  Future<List<dynamic>> getAIMessages(String conversationId) async {
    final response = await _dio.get(
      '/api/ai-coach/messages',
      queryParameters: {'conversationId': conversationId},
    );
    return (response.data['messages'] as List<dynamic>?) ?? [];
  }

  /// Create goal
  Future<Map<String, dynamic>> createGoal({
    required String goalType,
    required double targetValue,
    double? currentValue,
    required String deadline,
    String? category,
  }) async {
    final response = await _dio.post(
      '/api/goals/create',
      data: {
        'goal_type': goalType,
        'target_value': targetValue,
        if (currentValue != null) 'current_value': currentValue,
        'deadline': deadline,
        if (category != null) 'category': category,
      },
    );
    return response.data['goal'];
  }

  /// Get goals
  Future<List<dynamic>> getGoals({String? status}) async {
    final response = await _dio.get(
      '/api/goals',
      queryParameters: {
        if (status != null) 'status': status,
      },
    );
    return (response.data['goals'] as List<dynamic>?) ?? [];
  }

  /// Update goal progress
  Future<Map<String, dynamic>> updateGoalProgress({
    required String goalId,
    required double currentValue,
  }) async {
    final response = await _dio.post(
      '/api/goals/update-progress',
      data: {
        'goal_id': goalId,
        'current_value': currentValue,
      },
    );
    return response.data;
  }
}

