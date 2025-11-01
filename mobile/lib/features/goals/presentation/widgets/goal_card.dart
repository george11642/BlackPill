import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../../shared/theme/app_colors.dart';

class GoalCard extends StatelessWidget {
  final Map<String, dynamic> goal;
  final Function(double) onProgressUpdate;

  const GoalCard({
    super.key,
    required this.goal,
    required this.onProgressUpdate,
  });

  @override
  Widget build(BuildContext context) {
    final goalType = goal['goal_type'] ?? 'custom';
    final currentValue = goal['current_value']?.toDouble() ?? 0.0;
    final targetValue = goal['target_value']?.toDouble() ?? 0.0;
    final deadline = goal['deadline'] != null
        ? DateTime.tryParse(goal['deadline'])
        : null;
    final status = goal['status'] ?? 'active';
    final milestones = (goal['goal_milestones'] as List<dynamic>?) ?? [];

    final progress = targetValue > 0 ? (currentValue / targetValue).clamp(0.0, 1.0) : 0.0;
    final isCompleted = status == 'completed';

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      color: AppColors.darkGray,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isCompleted ? AppColors.neonGreen : AppColors.glassBorder,
          width: isCompleted ? 2 : 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    _formatGoalType(goalType),
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                if (isCompleted)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.neonGreen.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'COMPLETED',
                      style: TextStyle(
                        color: AppColors.neonGreen,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            // Progress bar
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${currentValue.toStringAsFixed(1)} / ${targetValue.toStringAsFixed(1)}',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      '${(progress * 100).toStringAsFixed(0)}%',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: LinearProgressIndicator(
                    value: progress,
                    minHeight: 8,
                    backgroundColor: AppColors.charcoal,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      isCompleted ? AppColors.neonGreen : AppColors.neonPink,
                    ),
                  ),
                ),
              ],
            ),
            if (deadline != null) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(
                    Icons.calendar_today,
                    size: 16,
                    color: AppColors.textTertiary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Deadline: ${DateFormat('MMM d, y').format(deadline)}',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ],
            if (milestones.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(
                'Milestones',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              ...milestones.take(3).map((milestone) {
                final completed = milestone['completed'] ?? false;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Icon(
                        completed ? Icons.check_circle : Icons.radio_button_unchecked,
                        size: 16,
                        color: completed ? AppColors.neonGreen : AppColors.textTertiary,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '${milestone['milestone_name']}: ${milestone['target_value']?.toStringAsFixed(1)}',
                          style: TextStyle(
                            color: completed ? AppColors.textPrimary : AppColors.textSecondary,
                            fontSize: 12,
                            decoration: completed ? TextDecoration.lineThrough : null,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ],
        ),
      ),
    );
  }

  String _formatGoalType(String type) {
    return type
        .split('_')
        .map((word) => word[0].toUpperCase() + word.substring(1))
        .join(' ');
  }
}

