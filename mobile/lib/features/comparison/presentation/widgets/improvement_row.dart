import 'package:flutter/material.dart';
import '../../../../shared/theme/app_colors.dart';

class ImprovementRow extends StatelessWidget {
  final String category;
  final double before;
  final double after;
  final double delta;

  const ImprovementRow({
    super.key,
    required this.category,
    required this.before,
    required this.after,
    required this.delta,
  });

  @override
  Widget build(BuildContext context) {
    final isPositive = delta > 0;
    final icon = delta > 0.5
        ? Icons.check_circle
        : delta > 0
            ? Icons.trending_up
            : delta < -0.5
                ? Icons.warning
                : Icons.trending_down;

    final color = delta > 0
        ? AppColors.neonGreen
        : delta < 0
            ? AppColors.neonPink
            : AppColors.textTertiary;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      color: AppColors.darkGray,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: AppColors.glassBorder),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Icon(icon, color: color),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    category.toUpperCase(),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textTertiary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${before.toStringAsFixed(1)} → ${after.toStringAsFixed(1)}',
                    style: TextStyle(
                      fontSize: 16,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
            Text(
              '${delta > 0 ? '+' : ''}${delta.toStringAsFixed(1)}',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

