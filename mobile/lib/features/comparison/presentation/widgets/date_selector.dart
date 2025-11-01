import 'package:flutter/material.dart';
import '../../../../shared/theme/app_colors.dart';

class DateSelector extends StatelessWidget {
  final String label;
  final List<dynamic> analyses;
  final String? selectedId;
  final Function(String) onSelect;

  const DateSelector({
    super.key,
    required this.label,
    required this.analyses,
    required this.selectedId,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final selectedAnalysis = analyses.firstWhere(
      (a) => a['id'] == selectedId,
      orElse: () => null,
    );

    return InkWell(
      onTap: () => _showDatePicker(context),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.darkGray,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selectedId != null ? AppColors.neonPink : AppColors.glassBorder,
            width: selectedId != null ? 2 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              selectedAnalysis != null
                  ? _formatDate(selectedAnalysis['created_at'])
                  : 'Select...',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            if (selectedAnalysis != null) ...[
              const SizedBox(height: 4),
              Text(
                'Score: ${selectedAnalysis['score'].toStringAsFixed(1)}/10',
                style: TextStyle(
                  color: AppColors.neonPink,
                  fontSize: 12,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showDatePicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkGray,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Select $label Analysis',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: analyses.length,
                itemBuilder: (context, index) {
                  final analysis = analyses[index];
                  final isSelected = analysis['id'] == selectedId;
                  return ListTile(
                    title: Text(
                      _formatDate(analysis['created_at']),
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                    subtitle: Text(
                      'Score: ${analysis['score'].toStringAsFixed(1)}/10',
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                    trailing: isSelected
                        ? Icon(Icons.check_circle, color: AppColors.neonPink)
                        : null,
                    onTap: () {
                      onSelect(analysis['id']);
                      Navigator.pop(context);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      return '${date.month}/${date.day}/${date.year}';
    } catch (e) {
      return 'Unknown';
    }
  }
}

