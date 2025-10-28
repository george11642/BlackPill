import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../../shared/theme/app_colors.dart';

class LeaderboardItem extends StatelessWidget {
  final int rank;
  final String username;
  final double score;
  final String? avatarUrl;
  final bool isTopThree;
  final bool showBadge;
  final bool isCurrentUser;

  const LeaderboardItem({
    super.key,
    required this.rank,
    required this.username,
    required this.score,
    this.avatarUrl,
    this.isTopThree = false,
    this.showBadge = false,
    this.isCurrentUser = false,
  });

  String _getBadgeEmoji() {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '';
    }
  }

  Color _getRankColor() {
    if (isCurrentUser) return AppColors.neonPink;
    if (isTopThree) return AppColors.neonCyan;
    return AppColors.textSecondary;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isCurrentUser 
            ? AppColors.neonPink.withOpacity(0.1)
            : isTopThree
                ? AppColors.neonCyan.withOpacity(0.05)
                : AppColors.darkGray.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isCurrentUser
              ? AppColors.neonPink
              : isTopThree
                  ? AppColors.neonCyan.withOpacity(0.3)
                  : AppColors.glassBorder,
          width: isCurrentUser ? 2 : 1,
        ),
      ),
      child: Row(
        children: [
          // Rank or Badge
          SizedBox(
            width: 40,
            child: showBadge
                ? Text(
                    _getBadgeEmoji(),
                    style: const TextStyle(fontSize: 28),
                    textAlign: TextAlign.center,
                  )
                : Text(
                    '#$rank',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: _getRankColor(),
                          fontWeight: FontWeight.w700,
                        ),
                    textAlign: TextAlign.center,
                  ),
          ),
          
          const SizedBox(width: 16),
          
          // Avatar
          CircleAvatar(
            radius: 24,
            backgroundColor: AppColors.charcoal,
            backgroundImage: avatarUrl != null
                ? CachedNetworkImageProvider(avatarUrl!)
                : null,
            child: avatarUrl == null
                ? const Icon(Icons.person, color: AppColors.textSecondary)
                : null,
          ),
          
          const SizedBox(width: 16),
          
          // Username
          Expanded(
            child: Text(
              username,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: isCurrentUser ? AppColors.neonPink : null,
                    fontWeight: isCurrentUser ? FontWeight.w600 : null,
                  ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          
          const SizedBox(width: 16),
          
          // Score
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              gradient: isTopThree || isCurrentUser
                  ? AppColors.primaryGradient
                  : null,
              color: !isTopThree && !isCurrentUser ? AppColors.charcoal : null,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              score.toStringAsFixed(1),
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w700,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

