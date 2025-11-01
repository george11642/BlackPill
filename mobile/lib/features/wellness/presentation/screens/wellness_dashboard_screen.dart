import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/services/api_service.dart';
import '../../../../core/services/health_service.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../shared/widgets/primary_button.dart';
import 'package:intl/intl.dart';

/// Provider for wellness data
final wellnessDataProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final apiService = ref.read(apiServiceProvider);
  return await apiService.getWellnessData(limit: 30);
});

/// Provider for wellness correlations
final wellnessCorrelationsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  try {
    final apiService = ref.read(apiServiceProvider);
    return await apiService.calculateWellnessCorrelations();
  } catch (e) {
    return [];
  }
});

class WellnessDashboardScreen extends ConsumerStatefulWidget {
  const WellnessDashboardScreen({super.key});

  @override
  ConsumerState<WellnessDashboardScreen> createState() => _WellnessDashboardScreenState();
}

class _WellnessDashboardScreenState extends ConsumerState<WellnessDashboardScreen> {
  bool _isSyncing = false;

  Future<void> _syncWellnessData() async {
    setState(() => _isSyncing = true);

    try {
      final healthService = ref.read(healthServiceProvider);

      // Check if health service is available
      if (!healthService.isAvailable) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Health services not available on this device'),
            backgroundColor: AppColors.neonYellow,
          ),
        );
        return;
      }

      // Request permissions
      final hasPermissions = await healthService.hasPermissions();
      if (!hasPermissions) {
        final granted = await healthService.requestPermissions();
        if (!granted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Health permissions are required to sync data'),
              backgroundColor: AppColors.neonYellow,
            ),
          );
          return;
        }
      }

      // Sync today's data
      final wellnessData = await healthService.syncTodayData();
      
      // Send to backend
      final apiService = ref.read(apiServiceProvider);
      await apiService.syncWellnessData(
        date: wellnessData['date'] as String,
        sleepHours: wellnessData['sleepHours'] as double?,
        sleepQuality: wellnessData['sleepQuality'] as String?,
        sleepSource: wellnessData['sleepSource'] as String?,
        hydrationOunces: wellnessData['hydrationOunces'] as double?,
        hydrationGoal: wellnessData['hydrationGoal'] as double?,
        hydrationSource: wellnessData['hydrationSource'] as String?,
        hrv: wellnessData['hrv'] as double?,
        restingHr: wellnessData['restingHr'] as double?,
        stressLevel: wellnessData['stressLevel'] as String?,
        stressSource: wellnessData['stressSource'] as String?,
        exerciseMinutes: wellnessData['exerciseMinutes'] as int?,
        exerciseIntensity: wellnessData['exerciseIntensity'] as String?,
        exerciseType: wellnessData['exerciseType'] as List<String>?,
        exerciseCalories: wellnessData['exerciseCalories'] as int?,
        exerciseSource: wellnessData['exerciseSource'] as String?,
      );

      // Refresh data
      ref.invalidate(wellnessDataProvider);
      ref.invalidate(wellnessCorrelationsProvider);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Wellness data synced successfully!'),
          backgroundColor: AppColors.neonGreen,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to sync: ${e.toString()}'),
          backgroundColor: AppColors.neonYellow,
        ),
      );
    } finally {
      setState(() => _isSyncing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final wellnessAsync = ref.watch(wellnessDataProvider);
    final correlationsAsync = ref.watch(wellnessCorrelationsProvider);

    return Scaffold(
      backgroundColor: AppColors.deepBlack,
      appBar: AppBar(
        title: const Text('Wellness Impact'),
        backgroundColor: AppColors.darkGray,
        actions: [
          IconButton(
            icon: const Icon(Icons.sync),
            tooltip: 'Sync Wellness Data',
            onPressed: _isSyncing ? null : _syncWellnessData,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(wellnessDataProvider);
          ref.invalidate(wellnessCorrelationsProvider);
        },
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Text(
                'How Wellness Affects Your Score',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Connect your health data to see correlations with your appearance scores.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
              const SizedBox(height: 24),

              // Connect Services
              GlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.fitness_center, color: AppColors.neonCyan, size: 24),
                        const SizedBox(width: 12),
                        Text(
                          'Connect Health Services',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Sync data from your wearable devices to see how sleep, exercise, and hydration affect your appearance scores.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _isSyncing ? null : _syncWellnessData,
                            icon: const Icon(Icons.sync),
                            label: const Text('Sync Now'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppColors.textPrimary,
                              side: BorderSide(color: AppColors.glassBorder),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Correlations Section
              Text(
                'Top Correlations',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),

              correlationsAsync.when(
                data: (correlations) {
                  if (correlations.isEmpty) {
                    return GlassCard(
                      child: Column(
                        children: [
                          const Icon(Icons.info_outline, size: 48, color: AppColors.textTertiary),
                          const SizedBox(height: 16),
                          Text(
                            'No correlation data yet',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Connect a health service and complete a few analyses to see correlations.',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    );
                  }

                  return Column(
                    children: correlations.map((correlation) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: _CorrelationCard(correlation: correlation),
                      );
                    }).toList(),
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (error, stack) => GlassCard(
                  child: Text(
                    'Failed to load correlations: ${error.toString()}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.neonYellow,
                        ),
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Daily Wellness Checklist
              Text(
                'Today\'s Wellness Goals',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),

              wellnessAsync.when(
                data: (data) {
                  if (data.isEmpty) {
                    return GlassCard(
                      child: Column(
                        children: [
                          const Icon(Icons.today, size: 48, color: AppColors.textTertiary),
                          const SizedBox(height: 16),
                          Text(
                            'No wellness data today',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Start tracking your wellness to see how it affects your appearance!',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    );
                  }

                  final todayData = data.isNotEmpty ? data.first : {};
                  return _WellnessChecklistCard(wellnessData: todayData);
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (error, stack) => GlassCard(
                  child: Text(
                    'Failed to load wellness data: ${error.toString()}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.neonYellow,
                        ),
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Optimization Tips
              Text(
                'Optimization Tips',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),

              GlassCard(
                child: Column(
                  children: [
                    _buildTipItem(
                      'Sleep',
                      'Aim for 7.5-8 hours of quality sleep',
                      'Your skin score improves with consistent sleep',
                      Icons.bedtime,
                      AppColors.neonPurple,
                    ),
                    const Divider(height: 24),
                    _buildTipItem(
                      'Hydration',
                      'Drink 64 oz (8 glasses) of water daily',
                      'Proper hydration improves skin appearance',
                      Icons.water_drop,
                      AppColors.neonCyan,
                    ),
                    const Divider(height: 24),
                    _buildTipItem(
                      'Exercise',
                      '30 minutes of moderate activity 4x/week',
                      'Exercise improves circulation and overall health',
                      Icons.fitness_center,
                      AppColors.neonGreen,
                    ),
                    const Divider(height: 24),
                    _buildTipItem(
                      'Stress Management',
                      'Keep HRV (heart rate variability) optimal',
                      'Lower stress correlates with better appearance scores',
                      Icons.favorite,
                      AppColors.neonPink,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTipItem(String title, String goal, String benefit, IconData icon, Color color) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.2),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                goal,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                benefit,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textTertiary,
                      fontSize: 11,
                      fontStyle: FontStyle.italic,
                    ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _CorrelationCard extends StatelessWidget {
  final Map<String, dynamic> correlation;

  const _CorrelationCard({required this.correlation});

  @override
  Widget build(BuildContext context) {
    final category = correlation['category'] ?? 'unknown';
    final impact = (correlation['impact'] as num?)?.toDouble() ?? 0.0;
    final message = correlation['message'] ?? '';
    final recommendation = correlation['recommendation'] ?? '';
    final priority = correlation['priority'] ?? 'medium';

    IconData icon;
    Color color;
    switch (category) {
      case 'sleep':
        icon = Icons.bedtime;
        color = AppColors.neonPurple;
        break;
      case 'hydration':
        icon = Icons.water_drop;
        color = AppColors.neonCyan;
        break;
      case 'exercise':
        icon = Icons.fitness_center;
        color = AppColors.neonGreen;
        break;
      case 'stress':
        icon = Icons.favorite;
        color = AppColors.neonPink;
        break;
      default:
        icon = Icons.trending_up;
        color = AppColors.neonCyan;
    }

    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      category.toUpperCase(),
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    if (priority == 'high')
                      Container(
                        margin: const EdgeInsets.only(top: 4),
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.neonYellow.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'HIGH PRIORITY',
                          style: TextStyle(
                            color: AppColors.neonYellow,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              if (impact > 0)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.neonGreen.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.neonGreen, width: 1),
                  ),
                  child: Text(
                    '+${impact.toStringAsFixed(1)}',
                    style: const TextStyle(
                      color: AppColors.neonGreen,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            message,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.textPrimary,
                ),
          ),
          if (recommendation.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.lightbulb_outline, color: color, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      recommendation,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.textSecondary,
                            fontStyle: FontStyle.italic,
                          ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _WellnessChecklistCard extends StatelessWidget {
  final Map<String, dynamic> wellnessData;

  const _WellnessChecklistCard({required this.wellnessData});

  @override
  Widget build(BuildContext context) {
    final sleepHours = (wellnessData['sleep_hours'] as num?)?.toDouble();
    final hydrationOz = wellnessData['hydration_oz'] as int?;
    final exerciseMinutes = wellnessData['exercise_minutes'] as int?;
    final stressLevel = wellnessData['stress_level'] as String?;

    return GlassCard(
      child: Column(
        children: [
          _buildChecklistItem(
            'Sleep',
            sleepHours != null ? '${sleepHours.toStringAsFixed(1)} hrs' : 'Not tracked',
            sleepHours != null && sleepHours >= 7.5,
            Icons.bedtime,
            AppColors.neonPurple,
            'Goal: 7.5-8 hours',
          ),
          const Divider(height: 24),
          _buildChecklistItem(
            'Hydration',
            hydrationOz != null ? '$hydrationOz oz' : 'Not tracked',
            hydrationOz != null && hydrationOz >= 64,
            Icons.water_drop,
            AppColors.neonCyan,
            'Goal: 64 oz',
          ),
          const Divider(height: 24),
          _buildChecklistItem(
            'Exercise',
            exerciseMinutes != null ? '$exerciseMinutes min' : 'Not tracked',
            exerciseMinutes != null && exerciseMinutes >= 30,
            Icons.fitness_center,
            AppColors.neonGreen,
            'Goal: 30+ min',
          ),
          const Divider(height: 24),
          _buildChecklistItem(
            'Stress',
            stressLevel ?? 'Not tracked',
            stressLevel == 'low',
            Icons.favorite,
            AppColors.neonPink,
            'Goal: Low stress',
          ),
        ],
      ),
    );
  }

  Widget _buildChecklistItem(
    String label,
    String value,
    bool isComplete,
    IconData icon,
    Color color,
    String goal,
  ) {
    return Row(
      children: [
        Icon(
          isComplete ? Icons.check_circle : Icons.radio_button_unchecked,
          color: isComplete ? AppColors.neonGreen : AppColors.textTertiary,
          size: 24,
        ),
        const SizedBox(width: 12),
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: color.withOpacity(0.2),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Icon(icon, color: color, size: 18),
        ),
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
                '$value • $goal',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textTertiary,
                      fontSize: 11,
                    ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

