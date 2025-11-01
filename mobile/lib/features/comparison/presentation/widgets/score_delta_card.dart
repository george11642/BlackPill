import 'package:flutter/material.dart';
import '../../../../shared/theme/app_colors.dart';

class ScoreDeltaCard extends StatelessWidget {
  final double scoreDelta;
  final int daysBetween;
  final String percentChange;

  const ScoreDeltaCard({
    super.key,
    required this.scoreDelta,
    required this.daysBetween,
    required this.percentChange,
  });

  @override
  Widget build(BuildContext context) {
    final isPositive = scoreDelta > 0;
    final color = isPositive ? AppColors.neonGreen : AppColors.neonPink;
    final icon = isPositive ? Icons.trending_up : Icons.trending_down;

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isPositive
              ? [AppColors.neonGreen.withOpacity(0.3), AppColors.neonCyan.withOpacity(0.3)]
              : [AppColors.neonPink.withOpacity(0.3), Colors.orange.withOpacity(0.3)],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withOpacity(0.5),
          width: 2,
        ),
      ),
      child: Column(
        children: [
          Icon(icon, size: 48, color: color),
          const SizedBox(height: 12),
          Text(
            '${scoreDelta > 0 ? '+' : ''}${scoreDelta.toStringAsFixed(1)}',
            style: TextStyle(
              fontSize: 48,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            '${isPositive ? '+' : ''}$percentChange% improvement',
            style: TextStyle(
              fontSize: 18,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '$daysBetween days between photos',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

