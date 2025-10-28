import 'package:flutter/material.dart';

import '../../../../shared/theme/app_colors.dart';

/// Visual indicator for photo quality requirements
class QualityIndicator extends StatelessWidget {
  final String label;
  final bool isGood;
  final IconData icon;

  const QualityIndicator({
    super.key,
    required this.label,
    required this.isGood,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: isGood
                ? AppColors.neonGreen.withOpacity(0.2)
                : AppColors.neonYellow.withOpacity(0.2),
            shape: BoxShape.circle,
          ),
          child: Icon(
            icon,
            color: isGood ? AppColors.neonGreen : AppColors.neonYellow,
            size: 20,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: isGood ? AppColors.neonGreen : AppColors.neonYellow,
                ),
          ),
        ),
        Icon(
          isGood ? Icons.check_circle : Icons.warning,
          color: isGood ? AppColors.neonGreen : AppColors.neonYellow,
          size: 20,
        ),
      ],
    );
  }
}


