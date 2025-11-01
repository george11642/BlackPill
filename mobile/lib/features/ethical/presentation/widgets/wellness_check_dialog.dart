import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/services/api_service.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../shared/widgets/primary_button.dart';
import 'mental_health_resources_dialog.dart';

class WellnessCheckDialog extends ConsumerWidget {
  final String triggerReason;
  final String message;

  const WellnessCheckDialog({
    super.key,
    required this.triggerReason,
    required this.message,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Dialog(
      backgroundColor: Colors.transparent,
      child: GlassCard(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.favorite,
                  color: AppColors.neonGreen,
                  size: 32,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'We Care About You',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Text(
              message,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
            const SizedBox(height: 24),
            Text(
              'Remember:',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    color: AppColors.neonCyan,
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            _buildBulletPoint(context, 'You\'re more than a number'),
            _buildBulletPoint(context, 'Scores can vary based on many factors'),
            _buildBulletPoint(context, 'Focus on feeling confident and healthy'),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      _recordResponse(ref, 'dismissed');
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.textSecondary,
                      side: BorderSide(color: AppColors.glassBorder),
                    ),
                    child: const Text('Thanks, I\'m OK'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: PrimaryButton(
                    text: 'View Resources',
                    icon: Icons.help_outline,
                    onPressed: () {
                      Navigator.pop(context);
                      _recordResponse(ref, 'viewed_resources');
                      showDialog(
                        context: context,
                        builder: (context) => const MentalHealthResourcesDialog(),
                      );
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBulletPoint(BuildContext context, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '• ',
            style: TextStyle(color: AppColors.neonGreen, fontSize: 16),
          ),
          Expanded(
            child: Text(
              text,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
          ),
        ],
      ),
    );
  }

  void _recordResponse(WidgetRef ref, String response) {
    try {
      final apiService = ref.read(apiServiceProvider);
      apiService.recordWellnessCheck(
        triggerReason: triggerReason,
        messageShown: message,
        userResponse: response,
      );
    } catch (e) {
      // Silently fail - logging is optional
    }
  }
}



