import 'package:flutter/material.dart';

import '../../../../shared/theme/app_colors.dart';
import '../screens/leaderboard_screen.dart';

class LeaderboardFilterChips extends StatelessWidget {
  final LeaderboardFilter selectedFilter;
  final Function(LeaderboardFilter) onFilterChanged;

  const LeaderboardFilterChips({
    super.key,
    required this.selectedFilter,
    required this.onFilterChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _buildFilterChip(
            context,
            'This Week',
            LeaderboardFilter.thisWeek,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _buildFilterChip(
            context,
            'All Time',
            LeaderboardFilter.allTime,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _buildFilterChip(
            context,
            'By Location',
            LeaderboardFilter.byLocation,
          ),
        ),
      ],
    );
  }

  Widget _buildFilterChip(
    BuildContext context,
    String label,
    LeaderboardFilter filter,
  ) {
    final isSelected = selectedFilter == filter;

    return GestureDetector(
      onTap: () => onFilterChanged(filter),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          gradient: isSelected ? AppColors.primaryGradient : null,
          color: !isSelected ? AppColors.darkGray.withOpacity(0.5) : null,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? Colors.transparent : AppColors.glassBorder,
          ),
        ),
        child: Text(
          label,
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: isSelected ? AppColors.deepBlack : AppColors.textSecondary,
              ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

