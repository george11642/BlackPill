import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/services/api_service.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../shared/widgets/primary_button.dart';

/// Provider for challenges
final challengesProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final apiService = ref.read(apiServiceProvider);
  return await apiService.getChallenges();
});

class ChallengesListScreen extends ConsumerWidget {
  const ChallengesListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final challengesAsync = ref.watch(challengesProvider);

    return Scaffold(
      backgroundColor: AppColors.deepBlack,
      appBar: AppBar(
        title: const Text('Challenges'),
        backgroundColor: AppColors.darkGray,
      ),
      body: challengesAsync.when(
        data: (challenges) {
          if (challenges.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.event_busy, size: 64, color: AppColors.textTertiary),
                  const SizedBox(height: 16),
                  Text(
                    'No challenges available',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Check back soon for new challenges!',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(20),
            itemCount: challenges.length,
            itemBuilder: (context, index) {
              final challenge = challenges[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: _ChallengeCard(challenge: challenge),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: AppColors.neonYellow),
              const SizedBox(height: 16),
              Text(
                'Failed to load challenges',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 24),
              PrimaryButton(
                text: 'Retry',
                onPressed: () {
                  ref.invalidate(challengesProvider);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ChallengeCard extends StatelessWidget {
  final Map<String, dynamic> challenge;

  const _ChallengeCard({required this.challenge});

  @override
  Widget build(BuildContext context) {
    final name = challenge['name'] ?? 'Unknown Challenge';
    final description = challenge['description'] ?? '';
    final duration = challenge['duration_days'] ?? 0;
    final difficulty = challenge['difficulty'] ?? 'beginner';
    final focusAreas = (challenge['focus_areas'] as List<dynamic>?) ?? [];
    final participants = challenge['participants'] ?? 0;
    final successRate = challenge['success_rate'] ?? 0.0;
    final avgImprovement = challenge['avg_improvement'] ?? 0.0;

    Color difficultyColor;
    IconData difficultyIcon;
    switch (difficulty) {
      case 'beginner':
        difficultyColor = AppColors.neonGreen;
        difficultyIcon = Icons.star;
        break;
      case 'intermediate':
        difficultyColor = AppColors.neonCyan;
        difficultyIcon = Icons.star;
        break;
      case 'advanced':
        difficultyColor = AppColors.neonPink;
        difficultyIcon = Icons.star;
        break;
      default:
        difficultyColor = AppColors.textSecondary;
        difficultyIcon = Icons.star_border;
    }

    return GlassCard(
      child: InkWell(
        onTap: () {
          context.push('/challenges/${challenge['id']}');
        },
        borderRadius: BorderRadius.circular(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    name,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: difficultyColor.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: difficultyColor, width: 1),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(difficultyIcon, size: 16, color: difficultyColor),
                      const SizedBox(width: 4),
                      Text(
                        difficulty.toUpperCase(),
                        style: TextStyle(
                          color: difficultyColor,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              description,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                _buildInfoChip(
                  Icons.calendar_today,
                  '$duration days',
                  AppColors.neonCyan,
                ),
                const SizedBox(width: 8),
                if (focusAreas.isNotEmpty)
                  _buildInfoChip(
                    Icons.flag,
                    focusAreas.first.toString(),
                    AppColors.neonPink,
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    context,
                    'Participants',
                    participants.toString(),
                    Icons.people,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    context,
                    'Success Rate',
                    '${(successRate * 100).toStringAsFixed(0)}%',
                    Icons.check_circle,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    context,
                    'Avg Improvement',
                    '+${avgImprovement.toStringAsFixed(1)}',
                    Icons.trending_up,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            PrimaryButton(
              text: 'View Details',
              onPressed: () {
                context.push('/challenges/${challenge['id']}');
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(BuildContext context, String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, size: 16, color: AppColors.textTertiary),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.bold,
              ),
        ),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.textTertiary,
                fontSize: 10,
              ),
        ),
      ],
    );
  }
}

