import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/services/api_service.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../shared/widgets/primary_button.dart';

/// Provider for challenge detail
final challengeDetailProvider = FutureProvider.family<Map<String, dynamic>, String>((ref, challengeId) async {
  final apiService = ref.read(apiServiceProvider);
  final challenges = await apiService.getChallenges();
  return challenges.firstWhere((c) => c['id'] == challengeId, orElse: () => {});
});

/// Provider for user's participation in a challenge
final challengeParticipationProvider = FutureProvider.family<Map<String, dynamic>?, String>((ref, challengeId) async {
  try {
    final apiService = ref.read(apiServiceProvider);
    final participations = await apiService.getMyChallenges(status: 'active');
    return participations.firstWhere(
      (p) => p['challenge_id'] == challengeId,
      orElse: () => null,
    );
  } catch (e) {
    return null;
  }
});

class ChallengeDetailScreen extends ConsumerStatefulWidget {
  final String challengeId;

  const ChallengeDetailScreen({
    super.key,
    required this.challengeId,
  });

  @override
  ConsumerState<ChallengeDetailScreen> createState() => _ChallengeDetailScreenState();
}

class _ChallengeDetailScreenState extends ConsumerState<ChallengeDetailScreen> {
  bool _isJoining = false;

  Future<void> _joinChallenge() async {
    setState(() => _isJoining = true);

    try {
      final apiService = ref.read(apiServiceProvider);
      await apiService.joinChallenge(challengeId: widget.challengeId);

      // Invalidate participation provider to refresh
      ref.invalidate(challengeParticipationProvider(widget.challengeId));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Challenge joined successfully!'),
            backgroundColor: AppColors.neonGreen,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to join challenge: ${e.toString()}'),
            backgroundColor: AppColors.neonYellow,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isJoining = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final challengeAsync = ref.watch(challengeDetailProvider(widget.challengeId));
    final participationAsync = ref.watch(challengeParticipationProvider(widget.challengeId));

    return Scaffold(
      backgroundColor: AppColors.deepBlack,
      appBar: AppBar(
        title: const Text('Challenge Details'),
        backgroundColor: AppColors.darkGray,
      ),
      body: challengeAsync.when(
        data: (challenge) {
          if (challenge.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: AppColors.neonYellow),
                  const SizedBox(height: 16),
                  Text(
                    'Challenge not found',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 24),
                  PrimaryButton(
                    text: 'Go Back',
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            );
          }

          final name = challenge['name'] ?? 'Unknown Challenge';
          final description = challenge['description'] ?? '';
          final duration = challenge['duration_days'] ?? 0;
          final difficulty = challenge['difficulty'] ?? 'beginner';
          final focusAreas = (challenge['focus_areas'] as List<dynamic>?) ?? [];
          final requirements = challenge['requirements'] as Map<String, dynamic>? ?? {};
          final schedule = challenge['schedule'] as List<dynamic>? ?? [];
          final rewards = challenge['rewards'] as Map<String, dynamic>? ?? {};
          final photoGuidance = challenge['photo_guidance'] as Map<String, dynamic>? ?? {};

          final participation = participationAsync.valueOrNull;
          final isParticipating = participation != null;
          final currentDay = participation?['current_day'] ?? 0;
          final complianceRate = participation?['compliance_rate'] ?? 0.0;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header Card
                GlassCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              name,
                              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                    color: AppColors.textPrimary,
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                          ),
                          _buildDifficultyBadge(difficulty),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        description,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppColors.textSecondary,
                            ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          _buildInfoChip(Icons.calendar_today, '$duration days', AppColors.neonCyan),
                          const SizedBox(width: 8),
                          if (focusAreas.isNotEmpty)
                            _buildInfoChip(Icons.target, focusAreas.first.toString(), AppColors.neonPink),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Participation Status
                if (isParticipating)
                  GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.check_circle, color: AppColors.neonGreen, size: 24),
                            const SizedBox(width: 12),
                            Text(
                              'You\'re Participating!',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    color: AppColors.textPrimary,
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: _buildStatColumn('Day', '$currentDay / $duration', Icons.calendar_today),
                            ),
                            Expanded(
                              child: _buildStatColumn(
                                'Compliance',
                                '${(complianceRate * 100).toStringAsFixed(0)}%',
                                Icons.trending_up,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        PrimaryButton(
                          text: 'Check In',
                          icon: Icons.camera_alt,
                          onPressed: () {
                            context.push('/challenges/${widget.challengeId}/checkin');
                          },
                        ),
                      ],
                    ),
                  ),

                const SizedBox(height: 24),

                // Requirements
                Text(
                  'Requirements',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 12),
                GlassCard(
                  child: Column(
                    children: [
                      _buildRequirementRow(
                        'Daily Tasks',
                        '${requirements['dailyTasks'] ?? 0} tasks per day',
                        Icons.checklist,
                      ),
                      const Divider(height: 24),
                      _buildRequirementRow(
                        'Weekly Check-ins',
                        '${requirements['weeklyCheckins'] ?? 0} photo check-ins per week',
                        Icons.camera_alt,
                      ),
                      const Divider(height: 24),
                      _buildRequirementRow(
                        'Minimum Compliance',
                        '${(requirements['minimumCompliance'] ?? 0.8) * 100}% required',
                        Icons.trending_up,
                      ),
                      const Divider(height: 24),
                      _buildRequirementRow(
                        'Photo Verification',
                        requirements['photoVerification'] == true ? 'Required' : 'Optional',
                        Icons.verified,
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Photo Guidance
                Text(
                  'Photo Guidelines',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 12),
                GlassCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildGuidelineItem('Lighting', photoGuidance['lighting'] ?? 'Natural'),
                      _buildGuidelineItem('Time of Day', photoGuidance['timeOfDay'] ?? 'Morning'),
                      _buildGuidelineItem('Distance', photoGuidance['distance'] ?? 'Arm\'s length'),
                      _buildGuidelineItem('Angle', photoGuidance['angle'] ?? 'Straight on'),
                      _buildGuidelineItem('Background', photoGuidance['background'] ?? 'Plain'),
                      _buildGuidelineItem('Expression', photoGuidance['expression'] ?? 'Neutral'),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Rewards
                Text(
                  'Rewards',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 12),
                GlassCard(
                  child: Column(
                    children: [
                      if (rewards['badge'] != null)
                        _buildRewardRow('Badge', rewards['badge'], Icons.workspace_premium),
                      if (rewards['badge'] != null && rewards['bonusScans'] != null)
                        const Divider(height: 24),
                      if (rewards['bonusScans'] != null)
                        _buildRewardRow('Bonus Scans', '${rewards['bonusScans']}', Icons.photo_camera),
                      if (rewards['unlocks'] != null && (rewards['unlocks'] as List).isNotEmpty) ...[
                        const Divider(height: 24),
                        _buildRewardRow(
                          'Unlocks',
                          (rewards['unlocks'] as List).join(', '),
                          Icons.lock_open,
                        ),
                      ],
                      if (rewards['tierDiscount'] != null) ...[
                        const Divider(height: 24),
                        _buildRewardRow('Tier Discount', rewards['tierDiscount'], Icons.local_offer),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 32),

                // Join Button (if not participating)
                if (!isParticipating)
                  PrimaryButton(
                    text: 'Join Challenge',
                    icon: Icons.add_circle_outline,
                    isLoading: _isJoining,
                    onPressed: _joinChallenge,
                  ),

                const SizedBox(height: 32),
              ],
            ),
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
                'Failed to load challenge',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 24),
              PrimaryButton(
                text: 'Retry',
                onPressed: () {
                  ref.invalidate(challengeDetailProvider(widget.challengeId));
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDifficultyBadge(String difficulty) {
    Color color;
    switch (difficulty) {
      case 'beginner':
        color = AppColors.neonGreen;
        break;
      case 'intermediate':
        color = AppColors.neonCyan;
        break;
      case 'advanced':
        color = AppColors.neonPink;
        break;
      default:
        color = AppColors.textSecondary;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color, width: 1),
      ),
      child: Text(
        difficulty.toUpperCase(),
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.bold,
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

  Widget _buildStatColumn(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, size: 20, color: AppColors.neonCyan),
        const SizedBox(height: 8),
        Text(
          value,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.bold,
              ),
        ),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.textTertiary,
              ),
        ),
      ],
    );
  }

  Widget _buildRequirementRow(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: AppColors.neonCyan, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w500,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildGuidelineItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          const Icon(Icons.check_circle_outline, color: AppColors.neonGreen, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w500,
                      ),
                ),
                Text(
                  value,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRewardRow(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: AppColors.neonYellow, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w500,
                ),
          ),
        ),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.neonYellow,
                fontWeight: FontWeight.bold,
              ),
        ),
      ],
    );
  }
}

