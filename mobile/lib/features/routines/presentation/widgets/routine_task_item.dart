import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/api_service.dart';
import '../../../../shared/theme/app_colors.dart';

class RoutineTaskItem extends ConsumerStatefulWidget {
  final Map<String, dynamic> task;
  final String routineId;

  const RoutineTaskItem({
    super.key,
    required this.task,
    required this.routineId,
  });

  @override
  ConsumerState<RoutineTaskItem> createState() => _RoutineTaskItemState();
}

class _RoutineTaskItemState extends ConsumerState<RoutineTaskItem> {
  bool _isCompleted = false;
  bool _isLoading = false;

  Future<void> _toggleComplete() async {
    setState(() {
      _isCompleted = !_isCompleted;
      _isLoading = true;
    });

    try {
      final apiService = ref.read(apiServiceProvider);
      await apiService.completeTask(
        taskId: widget.task['id'],
        routineId: widget.routineId,
        skipped: false,
      );

      // Refresh routine data
      ref.invalidate(routineProvider(widget.routineId));
    } catch (e) {
      setState(() => _isCompleted = !_isCompleted);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to update task')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final duration = widget.task['duration_minutes'];
    final category = widget.task['category'] ?? 'general';

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      color: AppColors.darkGray,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: AppColors.glassBorder,
          width: 1,
        ),
      ),
      child: CheckboxListTile(
        value: _isCompleted,
        onChanged: _isLoading ? null : (bool? value) => _toggleComplete(),
        title: Text(
          widget.task['title'] ?? 'Untitled Task',
          style: TextStyle(
            color: AppColors.textPrimary,
            decoration: _isCompleted ? TextDecoration.lineThrough : null,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (widget.task['description'] != null) ...[
              const SizedBox(height: 4),
              Text(
                widget.task['description'],
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 12,
                ),
              ),
            ],
            const SizedBox(height: 8),
            Row(
              children: [
                if (duration != null) ...[
                  Icon(
                    Icons.access_time,
                    size: 14,
                    color: AppColors.textTertiary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '$duration min',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textTertiary,
                    ),
                  ),
                  const SizedBox(width: 12),
                ],
                Chip(
                  label: Text(
                    category.toString().toUpperCase(),
                    style: const TextStyle(fontSize: 10),
                  ),
                  labelStyle: const TextStyle(fontSize: 10),
                  visualDensity: VisualDensity.compact,
                  backgroundColor: AppColors.charcoal,
                  labelPadding: const EdgeInsets.symmetric(horizontal: 8),
                ),
              ],
            ),
            if (widget.task['why_it_helps'] != null) ...[
              const SizedBox(height: 8),
              Text(
                'Why: ${widget.task['why_it_helps']}',
                style: TextStyle(
                  fontSize: 11,
                  color: AppColors.textTertiary,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ],
        ),
        isThreeLine: true,
        activeColor: AppColors.neonPink,
        checkColor: AppColors.textPrimary,
      ),
    );
  }
}

