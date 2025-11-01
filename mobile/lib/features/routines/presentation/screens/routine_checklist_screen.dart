import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../data/routine_provider.dart';
import '../widgets/streak_widget.dart';
import '../widgets/routine_task_item.dart';

class RoutineChecklistScreen extends ConsumerWidget {
  final String routineId;

  const RoutineChecklistScreen({
    super.key,
    required this.routineId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final routineAsync = ref.watch(routineProvider(routineId));

    return Scaffold(
      backgroundColor: AppColors.deepBlack,
      appBar: AppBar(
        title: routineAsync.when(
          data: (data) => Text(data['name'] ?? 'My Routine'),
          loading: () => const Text('My Routine'),
          error: (_, __) => const Text('My Routine'),
        ),
        backgroundColor: AppColors.darkGray,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () {
              // Navigate to edit routine
            },
          ),
        ],
      ),
      body: routineAsync.when(
        data: (data) {
          final tasks = (data['routine_tasks'] as List<dynamic>?) ?? [];
          final streak = (data['routine_streaks'] as List<dynamic>?)?.firstOrNull;

          return SingleChildScrollView(
            child: Column(
              children: [
                // Streak widget
                StreakWidget(
                  streakCount: streak?['current_streak'] ?? 0,
                  longestStreak: streak?['longest_streak'] ?? 0,
                ),

                // Morning tasks
                TaskSection(
                  title: 'Morning Routine',
                  tasks: tasks
                      .where((t) =>
                          (t['time_of_day'] as List<dynamic>?)?.contains('morning') == true)
                      .toList(),
                  routineId: routineId,
                ),

                // Evening tasks
                TaskSection(
                  title: 'Evening Routine',
                  tasks: tasks
                      .where((t) =>
                          (t['time_of_day'] as List<dynamic>?)?.contains('evening') == true)
                      .toList(),
                  routineId: routineId,
                ),

                // All-day tasks
                TaskSection(
                  title: 'Throughout the Day',
                  tasks: tasks
                      .where((t) {
                        final timeOfDay = t['time_of_day'] as List<dynamic>?;
                        return timeOfDay == null ||
                            timeOfDay.isEmpty ||
                            (!timeOfDay.contains('morning') &&
                                !timeOfDay.contains('evening'));
                      })
                      .toList(),
                  routineId: routineId,
                ),
              ],
            ),
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(),
        ),
        error: (error, stack) => Center(
          child: Text('Error: $error'),
        ),
      ),
    );
  }
}

class TaskSection extends StatelessWidget {
  final String title;
  final List<dynamic> tasks;
  final String routineId;

  const TaskSection({
    super.key,
    required this.title,
    required this.tasks,
    required this.routineId,
  });

  @override
  Widget build(BuildContext context) {
    if (tasks.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
          child: Text(
            title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.bold,
                ),
          ),
        ),
        ...tasks.map((task) => RoutineTaskItem(
              task: task as Map<String, dynamic>,
              routineId: routineId,
            )),
      ],
    );
  }
}

