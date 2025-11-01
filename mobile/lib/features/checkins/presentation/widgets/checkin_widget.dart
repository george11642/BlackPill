import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/api_service.dart';
import '../../../../shared/theme/app_colors.dart';

/// Provider for check-in status
final checkInStatusProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final apiService = ref.read(apiServiceProvider);
  return await apiService.getCheckInStatus();
});

class CheckInWidget extends ConsumerWidget {
  const CheckInWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statusAsync = ref.watch(checkInStatusProvider);

    return statusAsync.when(
      data: (status) {
        final checkedIn = status['checked_in_today'] ?? false;
        final streakCount = status['current_streak'] ?? 0;
        final isAtRisk = status['is_at_risk'] ?? false;

        return Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: isAtRisk
                  ? [Colors.red.shade400, Colors.orange.shade400]
                  : [Colors.orange.shade400, Colors.red.shade400],
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.3),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: [
              Row(
                children: [
                  Icon(
                    Icons.local_fire_department,
                    size: 48,
                    color: Colors.white,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '$streakCount Day Streak!',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        if (isAtRisk)
                          Text(
                            '🔥 Your streak is at risk!',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.white.withOpacity(0.9),
                            ),
                          )
                        else if (checkedIn)
                          Text(
                            '✓ Checked in today',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.white.withOpacity(0.9),
                            ),
                          )
                        else
                          Text(
                            'Tap to check in',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.white.withOpacity(0.9),
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (!checkedIn)
                    ElevatedButton(
                      onPressed: () => _handleCheckIn(context, ref),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.orange.shade400,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                      ),
                      child: const Text('Check In'),
                    ),
                ],
              ),
              if (streakCount > 0) ...[
                const SizedBox(height: 12),
                _buildMilestoneIndicators(streakCount),
              ],
            ],
          ),
        );
      },
      loading: () => Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.darkGray,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Center(child: CircularProgressIndicator()),
      ),
      error: (error, stack) => Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.darkGray,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          'Error loading streak',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      ),
    );
  }

  Widget _buildMilestoneIndicators(int streakCount) {
    final milestones = [7, 14, 30, 90, 365];
    final icons = ['🎉', '🏆', '💎', '👑', '✨'];
    final labels = ['Week', '2 Weeks', 'Month', 'Quarter', 'Year'];

    return Wrap(
      spacing: 8,
      runSpacing: 4,
      children: milestones.asMap().entries.map((entry) {
        final milestone = entry.value;
        final index = entry.key;
        final reached = streakCount >= milestone;
        final next = streakCount < milestone && (index == 0 || streakCount >= milestones[index - 1]);

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: reached
                ? Colors.white.withOpacity(0.3)
                : next
                    ? Colors.white.withOpacity(0.1)
                    : Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: reached ? Colors.white : Colors.white.withOpacity(0.3),
              width: reached ? 2 : 1,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                icons[index],
                style: TextStyle(
                  fontSize: reached ? 16 : 12,
                ),
              ),
              const SizedBox(width: 4),
              Text(
                labels[index],
                style: TextStyle(
                  fontSize: 10,
                  color: Colors.white,
                  fontWeight: reached ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Future<void> _handleCheckIn(BuildContext context, WidgetRef ref) async {
    try {
      final apiService = ref.read(apiServiceProvider);
      await apiService.checkIn(activities: ['checkin']);

      // Refresh status
      ref.invalidate(checkInStatusProvider);

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Checked in!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to check in: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}

