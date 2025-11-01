import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../core/services/api_service.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../widgets/goal_card.dart';
import '../widgets/create_goal_dialog.dart';

/// Provider for goals
final goalsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final apiService = ref.read(apiServiceProvider);
  return await apiService.getGoals();
});

class GoalsScreen extends ConsumerStatefulWidget {
  const GoalsScreen({super.key});

  @override
  ConsumerState<GoalsScreen> createState() => _GoalsScreenState();
}

class _GoalsScreenState extends ConsumerState<GoalsScreen> {
  String _filter = 'all'; // 'all', 'active', 'completed', 'abandoned'

  @override
  Widget build(BuildContext context) {
    final goalsAsync = ref.watch(goalsProvider);

    return Scaffold(
      backgroundColor: AppColors.deepBlack,
      appBar: AppBar(
        title: const Text('My Goals'),
        backgroundColor: AppColors.darkGray,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showCreateGoalDialog(context),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter chips
          Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _buildFilterChip('all', 'All'),
                  const SizedBox(width: 8),
                  _buildFilterChip('active', 'Active'),
                  const SizedBox(width: 8),
                  _buildFilterChip('completed', 'Completed'),
                ],
              ),
            ),
          ),

          // Goals list
          Expanded(
            child: goalsAsync.when(
              data: (goals) {
                final filteredGoals = _filter == 'all'
                    ? goals
                    : goals.where((g) => g['status'] == _filter).toList();

                if (filteredGoals.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.flag_outlined,
                          size: 64,
                          color: AppColors.textTertiary,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _filter == 'all'
                              ? 'No goals yet. Create one to get started!'
                              : 'No ${_filter} goals',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 24),
                        PrimaryButton(
                          text: 'Create Goal',
                          onPressed: () => _showCreateGoalDialog(context),
                        ),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: filteredGoals.length,
                  itemBuilder: (context, index) {
                    final goal = filteredGoals[index];
                    return GoalCard(
                      goal: goal as Map<String, dynamic>,
                      onProgressUpdate: (currentValue) async {
                        try {
                          final apiService = ref.read(apiServiceProvider);
                          await apiService.updateGoalProgress(
                            goalId: goal['id'],
                            currentValue: currentValue,
                          );
                          ref.invalidate(goalsProvider);
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Failed to update: $e')),
                            );
                          }
                        }
                      },
                    );
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Center(
                child: Text(
                  'Error: $error',
                  style: TextStyle(color: AppColors.textSecondary),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String value, String label) {
    final isSelected = _filter == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() => _filter = value);
      },
      selectedColor: AppColors.neonPink.withOpacity(0.3),
      checkmarkColor: AppColors.neonPink,
      labelStyle: TextStyle(
        color: isSelected ? AppColors.neonPink : AppColors.textPrimary,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
    );
  }

  void _showCreateGoalDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => CreateGoalDialog(
        onGoalCreated: () {
          ref.invalidate(goalsProvider);
        },
      ),
    );
  }
}

