import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../core/services/api_service.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/primary_button.dart';

class CreateGoalDialog extends ConsumerStatefulWidget {
  final VoidCallback onGoalCreated;

  const CreateGoalDialog({
    super.key,
    required this.onGoalCreated,
  });

  @override
  ConsumerState<CreateGoalDialog> createState() => _CreateGoalDialogState();
}

class _CreateGoalDialogState extends ConsumerState<CreateGoalDialog> {
  String _goalType = 'score_improvement';
  final TextEditingController _currentValueController = TextEditingController();
  final TextEditingController _targetValueController = TextEditingController();
  DateTime? _selectedDeadline;
  bool _isCreating = false;

  final List<Map<String, dynamic>> _goalTypes = [
    {
      'key': 'score_improvement',
      'label': 'Score Improvement',
      'icon': Icons.trending_up,
    },
    {
      'key': 'category_improvement',
      'label': 'Category Improvement',
      'icon': Icons.star,
    },
    {
      'key': 'routine_consistency',
      'label': 'Routine Consistency',
      'icon': Icons.check_circle,
    },
    {
      'key': 'custom',
      'label': 'Custom Goal',
      'icon': Icons.flag,
    },
  ];

  Future<void> _createGoal() async {
    if (_targetValueController.text.isEmpty || _selectedDeadline == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all required fields')),
      );
      return;
    }

    setState(() => _isCreating = true);

    try {
      final apiService = ref.read(apiServiceProvider);
      await apiService.createGoal(
        goalType: _goalType,
        targetValue: double.parse(_targetValueController.text),
        currentValue: _currentValueController.text.isNotEmpty
            ? double.parse(_currentValueController.text)
            : null,
        deadline: _selectedDeadline!.toIso8601String().split('T')[0],
      );

      widget.onGoalCreated();
      if (mounted) {
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to create goal: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isCreating = false);
      }
    }
  }

  Future<void> _selectDeadline() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 30)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (picked != null) {
      setState(() => _selectedDeadline = picked);
    }
  }

  @override
  void dispose() {
    _currentValueController.dispose();
    _targetValueController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: AppColors.darkGray,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Container(
        padding: const EdgeInsets.all(24),
        constraints: const BoxConstraints(maxWidth: 400),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Create New Goal',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Goal Type',
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _goalTypes.map((type) {
                  final isSelected = _goalType == type['key'];
                  return ChoiceChip(
                    label: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(type['icon'], size: 16),
                        const SizedBox(width: 4),
                        Text(type['label']),
                      ],
                    ),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() => _goalType = type['key'] as String);
                    },
                    selectedColor: AppColors.neonPink.withOpacity(0.3),
                    labelStyle: TextStyle(
                      color: isSelected ? AppColors.neonPink : AppColors.textPrimary,
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _currentValueController,
                decoration: InputDecoration(
                  labelText: 'Current Value (optional)',
                  labelStyle: TextStyle(color: AppColors.textSecondary),
                  filled: true,
                  fillColor: AppColors.charcoal,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: AppColors.glassBorder),
                  ),
                ),
                keyboardType: TextInputType.number,
                style: TextStyle(color: AppColors.textPrimary),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _targetValueController,
                decoration: InputDecoration(
                  labelText: 'Target Value *',
                  labelStyle: TextStyle(color: AppColors.textSecondary),
                  filled: true,
                  fillColor: AppColors.charcoal,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: AppColors.glassBorder),
                  ),
                ),
                keyboardType: TextInputType.number,
                style: TextStyle(color: AppColors.textPrimary),
              ),
              const SizedBox(height: 16),
              InkWell(
                onTap: _selectDeadline,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.charcoal,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.glassBorder),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.calendar_today,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _selectedDeadline != null
                              ? DateFormat('MMM d, y').format(_selectedDeadline!)
                              : 'Select Deadline *',
                          style: TextStyle(
                            color: _selectedDeadline != null
                                ? AppColors.textPrimary
                                : AppColors.textTertiary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: PrimaryButton(
                  text: 'Create Goal',
                  onPressed: _isCreating ? null : _createGoal,
                  isLoading: _isCreating,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

