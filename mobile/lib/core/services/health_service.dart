import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:health/health.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:fit_kit/fit_kit.dart' if (dart.library.io) 'package:fit_kit/fit_kit.dart';

final healthServiceProvider = Provider<HealthService>((ref) {
  return HealthService();
});

class HealthService {
  Health? _health;
  bool _isInitialized = false;

  /// Initialize health service
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      _health = Health();
      _isInitialized = true;
    } catch (e) {
      throw Exception('Failed to initialize health service: ${e.toString()}');
    }
  }

  /// Check if health data is available on this platform
  bool get isAvailable {
    return Platform.isIOS || Platform.isAndroid;
  }

  /// Check if Google Fit is available (Android only)
  bool get isGoogleFitAvailable {
    return Platform.isAndroid;
  }

  /// Check if Apple Health is available (iOS only)
  bool get isAppleHealthAvailable {
    return Platform.isIOS;
  }

  /// Request health permissions
  Future<bool> requestPermissions() async {
    if (!isAvailable) return false;
    
    await initialize();

    try {
      // Request permissions for health data types
      final types = [
        HealthDataType.SLEEP_IN_BED,
        HealthDataType.SLEEP_ASLEEP,
        HealthDataType.SLEEP_AWAKE,
        HealthDataType.WATER,
        HealthDataType.HEART_RATE_VARIABILITY_SDNN,
        HealthDataType.RESTING_HEART_RATE,
        HealthDataType.ACTIVE_ENERGY_BURNED,
        HealthDataType.WORKOUT,
        HealthDataType.STEPS,
      ];

      final permissions = await _health!.requestAuthorization(types);
      return permissions.every((p) => p == true);
    } catch (e) {
      return false;
    }
  }

  /// Check if permissions are granted
  Future<bool> hasPermissions() async {
    if (!isAvailable) return false;
    
    await initialize();

    try {
      final types = [
        HealthDataType.SLEEP_IN_BED,
        HealthDataType.WATER,
        HealthDataType.HEART_RATE_VARIABILITY_SDNN,
        HealthDataType.ACTIVE_ENERGY_BURNED,
      ];

      final permissions = await _health!.hasPermissions(types);
      return permissions.every((p) => p == true);
    } catch (e) {
      return false;
    }
  }

  /// Get sleep data for a date range
  Future<Map<String, dynamic>?> getSleepData(DateTime startDate, DateTime endDate) async {
    if (!isAvailable) return null;

    try {
      if (Platform.isIOS) {
        // Use Apple Health
        await initialize();
        
        final sleepData = await _health!.getHealthDataFromTypes(
          startDate,
          endDate,
          [HealthDataType.SLEEP_IN_BED, HealthDataType.SLEEP_ASLEEP],
        );

        if (sleepData.isEmpty) return null;

        // Calculate total sleep hours
        double totalHours = 0;
        for (final data in sleepData) {
          if (data.type == HealthDataType.SLEEP_ASLEEP || data.type == HealthDataType.SLEEP_IN_BED) {
            final duration = data.endDate.difference(data.dateFrom);
            totalHours += duration.inMinutes / 60.0;
          }
        }

        return {
          'sleepHours': totalHours,
          'sleepQuality': totalHours >= 7.5 ? 'good' : totalHours >= 6 ? 'fair' : 'poor',
          'sleepSource': 'apple_health',
        };
      } else if (Platform.isAndroid) {
        // Use Google Fit
        return await _getGoogleFitSleepData(startDate, endDate);
      }
    } catch (e) {
      return null;
    }
    
    return null;
  }

  /// Get sleep data from Google Fit (Android)
  Future<Map<String, dynamic>?> _getGoogleFitSleepData(DateTime startDate, DateTime endDate) async {
    try {
      final hasPermissions = await FitKit.requestPermissions([DataType.SLEEP]);
      if (!hasPermissions) return null;

      final sleepData = await FitKit.read(DataType.SLEEP, startDate, endDate);
      
      if (sleepData.isEmpty) return null;

      // Calculate total sleep hours
      double totalHours = 0;
      for (final data in sleepData) {
        final duration = data.endDate.difference(data.dateFrom);
        totalHours += duration.inMinutes / 60.0;
      }

      return {
        'sleepHours': totalHours,
        'sleepQuality': totalHours >= 7.5 ? 'good' : totalHours >= 6 ? 'fair' : 'poor',
        'sleepSource': 'google_fit',
      };
    } catch (e) {
      return null;
    }
  }

  /// Get hydration data for a date
  Future<Map<String, dynamic>?> getHydrationData(DateTime date) async {
    if (!isAvailable) return null;

    try {
      final startDate = DateTime(date.year, date.month, date.day);
      final endDate = startDate.add(const Duration(days: 1));

      if (Platform.isIOS) {
        // Use Apple Health
        await initialize();

        final hydrationData = await _health!.getHealthDataFromTypes(
          startDate,
          endDate,
          [HealthDataType.WATER],
        );

        if (hydrationData.isEmpty) return null;

        // Sum water intake (assuming milliliters, convert to ounces)
        double totalML = 0;
        for (final data in hydrationData) {
          totalML += (data.value as num).toDouble();
        }

        final ounces = totalML * 0.033814; // Convert ml to oz

        return {
          'hydrationOunces': ounces,
          'hydrationGoal': 64.0,
          'hydrationSource': 'apple_health',
        };
      } else if (Platform.isAndroid) {
        // Use Google Fit
        return await _getGoogleFitHydrationData(startDate, endDate);
      }
    } catch (e) {
      return null;
    }
    
    return null;
  }

  /// Get hydration data from Google Fit (Android)
  Future<Map<String, dynamic>?> _getGoogleFitHydrationData(DateTime startDate, DateTime endDate) async {
    try {
      final hasPermissions = await FitKit.requestPermissions([DataType.WATER]);
      if (!hasPermissions) return null;

      final hydrationData = await FitKit.read(DataType.WATER, startDate, endDate);
      
      if (hydrationData.isEmpty) return null;

      // Sum water intake (assuming milliliters, convert to ounces)
      double totalML = 0;
      for (final data in hydrationData) {
        totalML += (data.value as num).toDouble();
      }

      final ounces = totalML * 0.033814; // Convert ml to oz

      return {
        'hydrationOunces': ounces,
        'hydrationGoal': 64.0,
        'hydrationSource': 'google_fit',
      };
    } catch (e) {
      return null;
    }
  }

  /// Get heart rate variability and resting heart rate
  Future<Map<String, dynamic>?> getHeartRateData(DateTime date) async {
    if (!isAvailable) return null;

    try {
      final startDate = DateTime(date.year, date.month, date.day);
      final endDate = startDate.add(const Duration(days: 1));

      if (Platform.isIOS) {
        // Use Apple Health
        await initialize();

        final hrvData = await _health!.getHealthDataFromTypes(
          startDate,
          endDate,
          [HealthDataType.HEART_RATE_VARIABILITY_SDNN],
        );

        final restingHrData = await _health!.getHealthDataFromTypes(
          startDate,
          endDate,
          [HealthDataType.RESTING_HEART_RATE],
        );

        double? hrv;
        double? restingHr;

        if (hrvData.isNotEmpty) {
          final values = hrvData.map((d) => (d.value as num).toDouble()).toList();
          hrv = values.reduce((a, b) => a + b) / values.length;
        }

        if (restingHrData.isNotEmpty) {
          final values = restingHrData.map((d) => (d.value as num).toDouble()).toList();
          restingHr = values.reduce((a, b) => a + b) / values.length;
        }

        if (hrv == null && restingHr == null) return null;

        String stressLevel = 'medium';
        if (hrv != null) {
          if (hrv > 50) stressLevel = 'low';
          else if (hrv < 30) stressLevel = 'high';
        } else if (restingHr != null) {
          if (restingHr < 60) stressLevel = 'low';
          else if (restingHr > 80) stressLevel = 'high';
        }

        return {
          'hrv': hrv,
          'restingHr': restingHr,
          'stressLevel': stressLevel,
          'stressSource': 'apple_health',
        };
      } else if (Platform.isAndroid) {
        // Use Google Fit
        return await _getGoogleFitHeartRateData(startDate, endDate);
      }
    } catch (e) {
      return null;
    }
    
    return null;
  }

  /// Get heart rate data from Google Fit (Android)
  Future<Map<String, dynamic>?> _getGoogleFitHeartRateData(DateTime startDate, DateTime endDate) async {
    try {
      final hasPermissions = await FitKit.requestPermissions([DataType.HEART_RATE]);
      if (!hasPermissions) return null;

      final heartRateData = await FitKit.read(DataType.HEART_RATE, startDate, endDate);
      
      if (heartRateData.isEmpty) return null;

      // Get average heart rate
      final values = heartRateData.map((d) => (d.value as num).toDouble()).toList();
      final avgHr = values.reduce((a, b) => a + b) / values.length;

      // Estimate resting HR (lowest values)
      final sortedValues = [...values]..sort();
      final restingHr = sortedValues.take(5).reduce((a, b) => a + b) / 
                        (sortedValues.length >= 5 ? 5 : sortedValues.length);

      // Determine stress level
      String stressLevel = 'medium';
      if (avgHr < 60) stressLevel = 'low';
      else if (avgHr > 80) stressLevel = 'high';

      return {
        'hrv': null, // Google Fit doesn't provide HRV directly
        'restingHr': restingHr,
        'avgHr': avgHr,
        'stressLevel': stressLevel,
        'stressSource': 'google_fit',
      };
    } catch (e) {
      return null;
    }
  }

  /// Get exercise data for a date
  Future<Map<String, dynamic>?> getExerciseData(DateTime date) async {
    if (!isAvailable) return null;

    try {
      final startDate = DateTime(date.year, date.month, date.day);
      final endDate = startDate.add(const Duration(days: 1));

      if (Platform.isIOS) {
        // Use Apple Health
        return await _getAppleHealthExerciseData(startDate, endDate);
      } else if (Platform.isAndroid) {
        // Use Google Fit
        return await _getGoogleFitExerciseData(startDate, endDate);
      }
    } catch (e) {
      return null;
    }
    
    return null;
  }

  /// Get exercise data from Apple Health (iOS)
  Future<Map<String, dynamic>?> _getAppleHealthExerciseData(DateTime startDate, DateTime endDate) async {
    await initialize();

    try {
      // Use WORKOUT directly, fallback to steps if workouts not available
      List<HealthDataPoint> workoutData = [];
      try {
        workoutData = await _health!.getHealthDataFromTypes(
          startDate,
          endDate,
          [HealthDataType.WORKOUT],
        );
      } catch (e) {
        // Fallback: try to get workout data from steps
        try {
          final stepsData = await _health!.getHealthDataFromTypes(
            startDate,
            endDate,
            [HealthDataType.STEPS],
          );
          // Convert steps to approximate workout minutes (very rough estimate)
          if (stepsData.isNotEmpty) {
            final totalSteps = stepsData.fold<int>(
              0,
              (sum, data) => sum + ((data.value as num).toInt()),
            );
            // Rough estimate: 100 steps per minute of activity
            if (totalSteps > 1000) {
              workoutData = []; // We'll use steps-based calculation below
            }
          }
        } catch (_) {
          // Ignore errors, just continue without workout data
        }
      }

      final energyData = await _health!.getHealthDataFromTypes(
        startDate,
        endDate,
        [HealthDataType.ACTIVE_ENERGY_BURNED],
      );

      int totalMinutes = 0;
      int totalCalories = 0;
      List<String> exerciseTypes = [];

      for (final workout in workoutData) {
        final duration = workout.endDate.difference(workout.dateFrom);
        totalMinutes += duration.inMinutes;
        
        // Extract workout type if available
        final workoutType = workout.typeString ?? workout.unit ?? 'Workout';
        if (workoutType.isNotEmpty && workoutType != 'Workout') {
          exerciseTypes.add(workoutType);
        }
      }
      
      // If no workout data but we have steps, estimate exercise from steps
      if (totalMinutes == 0 && workoutData.isEmpty) {
        try {
          final stepsData = await _health!.getHealthDataFromTypes(
            startDate,
            endDate,
            [HealthDataType.STEPS],
          );
          if (stepsData.isNotEmpty) {
            final totalSteps = stepsData.fold<int>(
              0,
              (sum, data) => sum + ((data.value as num).toInt()),
            );
            // Estimate: 5000+ steps = light activity, 10000+ = moderate
            if (totalSteps >= 10000) {
              totalMinutes = 30; // Moderate activity
              exerciseTypes.add('Walking');
            } else if (totalSteps >= 5000) {
              totalMinutes = 15; // Light activity
            }
          }
        } catch (_) {
          // Ignore
        }
      }

      for (final energy in energyData) {
        totalCalories += (energy.value as num).toInt();
      }

      if (totalMinutes == 0 && totalCalories == 0) return null;

      String intensity = 'low';
      if (totalCalories > 400 || totalMinutes > 60) {
        intensity = 'high';
      } else if (totalCalories > 200 || totalMinutes > 30) {
        intensity = 'moderate';
      }

      return {
        'exerciseMinutes': totalMinutes,
        'exerciseIntensity': intensity,
        'exerciseType': exerciseTypes,
        'exerciseCalories': totalCalories,
        'exerciseSource': 'apple_health',
      };
    } catch (e) {
      return null;
    }
  }

  /// Get exercise data from Google Fit (Android)
  Future<Map<String, dynamic>?> _getGoogleFitExerciseData(DateTime startDate, DateTime endDate) async {
    try {
      final hasPermissions = await FitKit.requestPermissions([
        DataType.HEART_RATE,
        DataType.DISTANCE,
        DataType.STEPS,
      ]);
      if (!hasPermissions) return null;

      // Get steps and distance for exercise calculation
      final stepsData = await FitKit.read(DataType.STEPS, startDate, endDate);
      final distanceData = await FitKit.read(DataType.DISTANCE, startDate, endDate);
      final heartRateData = await FitKit.read(DataType.HEART_RATE, startDate, endDate);

      int totalMinutes = 0;
      int totalCalories = 0;
      List<String> exerciseTypes = [];

      // Estimate exercise from steps (rough: 10000+ steps = 30 min moderate activity)
      if (stepsData.isNotEmpty) {
        final totalSteps = stepsData.fold<int>(
          0,
          (sum, data) => sum + ((data.value as num).toInt()),
        );
        
        if (totalSteps >= 10000) {
          totalMinutes = 30;
          exerciseTypes.add('Walking');
          totalCalories = (totalSteps / 100).round(); // Rough estimate
        } else if (totalSteps >= 5000) {
          totalMinutes = 15;
          totalCalories = (totalSteps / 200).round();
        }
      }

      // Add distance-based estimates if available
      if (distanceData.isNotEmpty && totalMinutes == 0) {
        final totalDistance = distanceData.fold<double>(
          0,
          (sum, data) => sum + ((data.value as num).toDouble()),
        );
        // Rough estimate: 1km = 10 minutes moderate activity
        if (totalDistance >= 1000) { // meters
          totalMinutes = (totalDistance / 100).round();
          exerciseTypes.add('Walking');
        }
      }

      if (totalMinutes == 0 && totalCalories == 0) return null;

      String intensity = 'low';
      if (totalCalories > 400 || totalMinutes > 60) {
        intensity = 'high';
      } else if (totalCalories > 200 || totalMinutes > 30) {
        intensity = 'moderate';
      }

      return {
        'exerciseMinutes': totalMinutes,
        'exerciseIntensity': intensity,
        'exerciseType': exerciseTypes,
        'exerciseCalories': totalCalories,
        'exerciseSource': 'google_fit',
      };
    } catch (e) {
      return null;
    }
  }

  /// Sync all wellness data for today
  Future<Map<String, dynamic>> syncTodayData() async {
    final today = DateTime.now();
    final dateStr = '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';

    final results = <String, dynamic>{
      'date': dateStr,
    };

    // Get sleep data (yesterday's sleep affects today)
    final yesterday = today.subtract(const Duration(days: 1));
    final sleepData = await getSleepData(yesterday, today);
    if (sleepData != null) {
      results.addAll(sleepData);
    }

    // Get hydration
    final hydrationData = await getHydrationData(today);
    if (hydrationData != null) {
      results.addAll(hydrationData);
    }

    // Get heart rate data
    final heartRateData = await getHeartRateData(today);
    if (heartRateData != null) {
      results.addAll(heartRateData);
    }

    // Get exercise data
    final exerciseData = await getExerciseData(today);
    if (exerciseData != null) {
      results.addAll(exerciseData);
    }

    return results;
  }
}

