import 'package:flutter/material.dart';

import '../../../../shared/theme/app_colors.dart';

class AchievementBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool unlocked;

  const AchievementBadge({
    super.key,
    required this.icon,
    required this.label,
    required this.unlocked,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        gradient: unlocked ? AppColors.primaryGradient : null,
        color: !unlocked ? AppColors.charcoal : null,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: unlocked ? Colors.transparent : AppColors.glassBorder,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            color: unlocked ? AppColors.textPrimary : AppColors.textDisabled,
            size: 20,
          ),
          const SizedBox(width: 8),
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: unlocked ? AppColors.deepBlack : AppColors.textDisabled,
                  fontWeight: FontWeight.w600,
                ),
          ),
        ],
      ),
    );
  }
}

