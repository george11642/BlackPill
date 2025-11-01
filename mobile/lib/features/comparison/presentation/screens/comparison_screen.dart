import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/api_service.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../widgets/comparison_view.dart';
import '../widgets/date_selector.dart';

/// Provider for analyses list
final analysesProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final apiService = ref.read(apiServiceProvider);
  return await apiService.getAnalyses(limit: 100);
});

/// Provider for comparison
final comparisonProvider = FutureProvider.family.autoDispose<Map<String, dynamic>, Map<String, String>>((ref, params) async {
  final apiService = ref.read(apiServiceProvider);
  return await apiService.compareAnalyses(
    beforeId: params['beforeId']!,
    afterId: params['afterId']!,
  );
});

class ComparisonScreen extends ConsumerStatefulWidget {
  const ComparisonScreen({super.key});

  @override
  ConsumerState<ComparisonScreen> createState() => _ComparisonScreenState();
}

class _ComparisonScreenState extends ConsumerState<ComparisonScreen> {
  String? _selectedBeforeId;
  String? _selectedAfterId;

  @override
  Widget build(BuildContext context) {
    final analysesAsync = ref.watch(analysesProvider);

    return Scaffold(
      backgroundColor: AppColors.deepBlack,
      appBar: AppBar(
        title: const Text('Compare Progress'),
        backgroundColor: AppColors.darkGray,
      ),
      body: analysesAsync.when(
        data: (analyses) {
          if (analyses.length < 2) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.compare_arrows,
                    size: 64,
                    color: AppColors.textTertiary,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'You need at least 2 analyses to compare',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            );
          }

          return Column(
            children: [
              // Date selectors
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: DateSelector(
                        label: 'Before',
                        analyses: analyses,
                        selectedId: _selectedBeforeId,
                        onSelect: (id) => setState(() => _selectedBeforeId = id),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Icon(
                        Icons.arrow_forward,
                        size: 32,
                        color: AppColors.neonPink,
                      ),
                    ),
                    Expanded(
                      child: DateSelector(
                        label: 'After',
                        analyses: analyses,
                        selectedId: _selectedAfterId,
                        onSelect: (id) => setState(() => _selectedAfterId = id),
                      ),
                    ),
                  ],
                ),
              ),

              // Comparison view
              if (_selectedBeforeId != null && _selectedAfterId != null)
                Expanded(
                  child: ComparisonView(
                    beforeId: _selectedBeforeId!,
                    afterId: _selectedAfterId!,
                  ),
                )
              else
                Expanded(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.photo_library,
                          size: 64,
                          color: AppColors.textTertiary,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Select two analyses to compare',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Text(
            'Error: $error',
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ),
      ),
    );
  }
}

