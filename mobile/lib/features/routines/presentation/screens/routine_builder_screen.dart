import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/api_service.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/primary_button.dart';
import 'routine_checklist_screen.dart';

class RoutineBuilderScreen extends ConsumerStatefulWidget {
  final String analysisId;

  const RoutineBuilderScreen({
    super.key,
    required this.analysisId,
  });

  @override
  ConsumerState<RoutineBuilderScreen> createState() => _RoutineBuilderScreenState();
}

class _RoutineBuilderScreenState extends ConsumerState<RoutineBuilderScreen> {
  final Set<String> _selectedGoals = {};
  String _timeCommitment = 'medium'; // short, medium, long
  bool _isGenerating = false;

  final List<Map<String, dynamic>> _goalOptions = [
    {'key': 'skin', 'label': 'Skin Quality', 'icon': Icons.face},
    {'key': 'jawline', 'label': 'Jawline Definition', 'icon': Icons.accessibility_new},
    {'key': 'symmetry', 'label': 'Facial Symmetry', 'icon': Icons.balance},
    {'key': 'grooming', 'label': 'Overall Grooming', 'icon': Icons.cut},
    {'key': 'fitness', 'label': 'Fitness & Body', 'icon': Icons.fitness_center},
  ];

  Future<void> _generateRoutine() async {
    if (_selectedGoals.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one goal')),
      );
      return;
    }

    setState(() => _isGenerating = true);

    try {
      final apiService = ref.read(apiServiceProvider);
      final routine = await apiService.generateRoutine(
        analysisId: widget.analysisId,
        focusAreas: _selectedGoals.toList(),
        timeCommitment: _timeCommitment,
      );

      if (!mounted) return;

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => RoutineChecklistScreen(routineId: routine['id']),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to generate routine: $e')),
      );
    } finally {
      if (mounted) {
        setState(() => _isGenerating = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.deepBlack,
      appBar: AppBar(
        title: const Text('Build Your Routine'),
        backgroundColor: AppColors.darkGray,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'What do you want to improve?',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            ..._goalOptions.map((goal) => GoalCard(
                  label: goal['label'] as String,
                  icon: goal['icon'] as IconData,
                  isSelected: _selectedGoals.contains(goal['key']),
                  onTap: () {
                    setState(() {
                      if (_selectedGoals.contains(goal['key'])) {
                        _selectedGoals.remove(goal['key']);
                      } else {
                        _selectedGoals.add(goal['key'] as String);
                      }
                    });
                  },
                )),
            const SizedBox(height: 32),
            Text(
              'Daily time commitment',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppColors.textPrimary,
                  ),
            ),
            const SizedBox(height: 12),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'short', label: Text('10-15 min')),
                ButtonSegment(value: 'medium', label: Text('20-30 min')),
                ButtonSegment(value: 'long', label: Text('45+ min')),
              ],
              selected: {_timeCommitment},
              onSelectionChanged: (Set<String> newSelection) {
                setState(() => _timeCommitment = newSelection.first);
              },
            ),
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              child: PrimaryButton(
                text: 'Generate My Routine',
                onPressed: _isGenerating ? null : _generateRoutine,
                isLoading: _isGenerating,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class GoalCard extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const GoalCard({
    super.key,
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: isSelected
          ? AppColors.neonPink.withOpacity(0.2)
          : AppColors.darkGray,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isSelected ? AppColors.neonPink : AppColors.glassBorder,
          width: isSelected ? 2 : 1,
        ),
      ),
      child: ListTile(
        leading: Icon(
          icon,
          color: isSelected ? AppColors.neonPink : AppColors.textSecondary,
        ),
        title: Text(
          label,
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        trailing: isSelected
            ? Icon(
                Icons.check_circle,
                color: AppColors.neonPink,
              )
            : null,
        onTap: onTap,
      ),
    );
  }
}

