import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/api_service.dart';

/// Provider for routines list
final routinesProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  final routines = await apiService.getRoutines(activeOnly: true);
  
  // Cache for 5 minutes
  ref.keepAlive();
  final timer = Timer(const Duration(minutes: 5), () {
    ref.invalidateSelf();
  });
  
  ref.onDispose(() {
    timer.cancel();
  });
  
  return routines;
});

/// Provider for a specific routine
final routineProvider = FutureProvider.family.autoDispose<Map<String, dynamic>, String>((ref, routineId) async {
  final apiService = ref.watch(apiServiceProvider);
  final routines = await apiService.getRoutines();
  final routine = routines.firstWhere(
    (r) => r['id'] == routineId,
    orElse: () => throw Exception('Routine not found'),
  );
  return routine as Map<String, dynamic>;
});

/// Provider for today's tasks
final todayTasksProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  final tasks = await apiService.getTodayTasks();
  
  // Cache for 1 minute (tasks change frequently)
  ref.keepAlive();
  final timer = Timer(const Duration(minutes: 1), () {
    ref.invalidateSelf();
  });
  
  ref.onDispose(() {
    timer.cancel();
  });
  
  return tasks;
});

/// Provider for routine stats
final routineStatsProvider = FutureProvider.family.autoDispose<Map<String, dynamic>, String>((ref, routineId) async {
  final apiService = ref.watch(apiServiceProvider);
  return await apiService.getRoutineStats(routineId);
});

