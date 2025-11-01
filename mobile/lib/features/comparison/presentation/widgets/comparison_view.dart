import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../screens/comparison_screen.dart';
import 'score_delta_card.dart';
import 'improvement_row.dart';

class ComparisonView extends ConsumerWidget {
  final String beforeId;
  final String afterId;

  const ComparisonView({
    super.key,
    required this.beforeId,
    required this.afterId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final comparisonAsync = ref.watch(
      comparisonProvider({
        'beforeId': beforeId,
        'afterId': afterId,
      }),
    );

    return comparisonAsync.when(
      data: (data) => SingleChildScrollView(
        child: Column(
          children: [
            // Side-by-side images
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: ComparisonImage(
                      imageUrl: data['before_thumbnail'] ?? data['before_image'],
                      score: data['before_score'],
                      date: data['before_date'],
                      label: 'Before',
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ComparisonImage(
                      imageUrl: data['after_thumbnail'] ?? data['after_image'],
                      score: data['after_score'],
                      date: data['after_date'],
                      label: 'After',
                    ),
                  ),
                ],
              ),
            ),

            // Score delta card
            ScoreDeltaCard(
              scoreDelta: data['score_delta'],
              daysBetween: data['days_between'],
              percentChange: data['percent_change'],
            ),

            // Category improvements
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Category Changes',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 12),
                  if (data['breakdownDeltas'] != null)
                    ...(data['breakdownDeltas'] as Map<String, dynamic>).entries.map((entry) {
                      final category = entry.key;
                      final delta = entry.value as Map<String, dynamic>;
                      return ImprovementRow(
                        category: category,
                        before: delta['before']?.toDouble() ?? 0.0,
                        after: delta['after']?.toDouble() ?? 0.0,
                        delta: delta['delta']?.toDouble() ?? 0.0,
                      );
                    }),
                ],
              ),
            ),

            // Routine compliance (if applicable)
            if (data['routineCompliance'] != null)
              Card(
                margin: const EdgeInsets.all(16),
                color: AppColors.darkGray,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: AppColors.glassBorder),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(Icons.check_circle, color: AppColors.neonGreen),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Routine completed ${data['routineCompliance']}% during this period',
                          style: TextStyle(
                            fontSize: 16,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // Share button
            Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                width: double.infinity,
                child: PrimaryButton(
                  text: 'Share My Progress',
                  icon: Icons.share,
                  onPressed: () {
                    // Generate and share comparison card
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Share feature coming soon')),
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(
        child: Text(
          'Error: $error',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      ),
    );
  }
}

class ComparisonImage extends StatelessWidget {
  final String? imageUrl;
  final double score;
  final String date;
  final String label;

  const ComparisonImage({
    super.key,
    required this.imageUrl,
    required this.score,
    required this.date,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    final dateObj = DateTime.tryParse(date);
    final formattedDate = dateObj != null
        ? '${dateObj.month}/${dateObj.day}/${dateObj.year}'
        : 'N/A';

    return Column(
      children: [
        Container(
          height: 200,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.glassBorder, width: 2),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: imageUrl != null
                ? CachedNetworkImage(
                    imageUrl: imageUrl!,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(
                      color: AppColors.darkGray,
                      child: const Center(child: CircularProgressIndicator()),
                    ),
                    errorWidget: (context, url, error) => Container(
                      color: AppColors.darkGray,
                      child: Icon(
                        Icons.error,
                        color: AppColors.textTertiary,
                      ),
                    ),
                  )
                : Container(
                    color: AppColors.darkGray,
                    child: Icon(
                      Icons.image_not_supported,
                      color: AppColors.textTertiary,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: TextStyle(
            color: AppColors.textSecondary,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          '${score.toStringAsFixed(1)}/10',
          style: TextStyle(
            color: AppColors.neonPink,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          formattedDate,
          style: TextStyle(
            color: AppColors.textTertiary,
            fontSize: 10,
          ),
        ),
      ],
    );
  }
}

