import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/services/api_service.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../shared/widgets/primary_button.dart';

/// Provider for scoring preferences
final scoringPreferencesProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final apiService = ref.read(apiServiceProvider);
  return await apiService.getScoringPreferences();
});

class ScoringMethodologyScreen extends ConsumerStatefulWidget {
  final String? analysisId;

  const ScoringMethodologyScreen({
    super.key,
    this.analysisId,
  });

  @override
  ConsumerState<ScoringMethodologyScreen> createState() => _ScoringMethodologyScreenState();
}

class _ScoringMethodologyScreenState extends ConsumerState<ScoringMethodologyScreen> {
  Map<String, int> _weights = {
    'symmetry': 20,
    'skin': 20,
    'jawline': 15,
    'eyes': 15,
    'lips': 15,
    'bone_structure': 15,
  };
  double? _customScore;
  bool _isRecalculating = false;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    // Preferences will be loaded via the provider
  }

  void _loadPreferencesFromData(Map<String, dynamic> data) {
    final prefs = data['preferences'] as Map<String, dynamic>?;
    
    if (prefs != null) {
      setState(() {
        _weights = {
          'symmetry': prefs['symmetry_weight'] ?? 20,
          'skin': prefs['skin_weight'] ?? 20,
          'jawline': prefs['jawline_weight'] ?? 15,
          'eyes': prefs['eyes_weight'] ?? 15,
          'lips': prefs['lips_weight'] ?? 15,
          'bone_structure': prefs['bone_structure_weight'] ?? 15,
        };
      });
    }
  }

  Future<void> _recalculateScore() async {
    if (widget.analysisId == null) return;
    
    setState(() => _isRecalculating = true);
    
    try {
      final apiService = ref.read(apiServiceProvider);
      final result = await apiService.recalculateScore(
        analysisId: widget.analysisId!,
        customWeights: _weights,
      );
      
      setState(() {
        _customScore = (result['customScore'] as num?)?.toDouble();
        _isRecalculating = false;
      });
    } catch (e) {
      setState(() => _isRecalculating = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to recalculate: ${e.toString()}'),
            backgroundColor: AppColors.neonYellow,
          ),
        );
      }
    }
  }

  Future<void> _savePreferences() async {
    setState(() => _isSaving = true);
    
    try {
      final apiService = ref.read(apiServiceProvider);
      await apiService.updateScoringPreferences(
        symmetryWeight: _weights['symmetry'],
        skinWeight: _weights['skin'],
        jawlineWeight: _weights['jawline'],
        eyesWeight: _weights['eyes'],
        lipsWeight: _weights['lips'],
        boneStructureWeight: _weights['bone_structure'],
      );
      
      setState(() => _isSaving = false);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Preferences saved'),
            backgroundColor: AppColors.neonGreen,
          ),
        );
      }
    } catch (e) {
      setState(() => _isSaving = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save: ${e.toString()}'),
            backgroundColor: AppColors.neonYellow,
          ),
        );
      }
    }
  }

  void _resetToDefaults() {
    setState(() {
      _weights = {
        'symmetry': 20,
        'skin': 20,
        'jawline': 15,
        'eyes': 15,
        'lips': 15,
        'bone_structure': 15,
      };
      _customScore = null;
    });
    if (widget.analysisId != null) {
      _recalculateScore();
    }
  }

  void _updateWeight(String category, int value) {
    final currentTotal = _weights.values.reduce((a, b) => a + b);
    final currentValue = _weights[category] ?? 0;
    final difference = value - currentValue;
    
    // Calculate how much we can adjust
    final minValue = (category == 'symmetry' || category == 'skin') ? 15 : 10;
    final maxValue = (category == 'symmetry' || category == 'skin') ? 25 : 20;
    
    if (value < minValue || value > maxValue) return;
    
    // Adjust other weights to maintain total of 100
    final otherCategories = _weights.keys.where((k) => k != category).toList();
    final adjustmentPerCategory = -difference / otherCategories.length;
    
    setState(() {
      _weights[category] = value;
      
      // Distribute the difference across other categories
      for (final otherCategory in otherCategories) {
        final otherMin = (otherCategory == 'symmetry' || otherCategory == 'skin') ? 15 : 10;
        final otherMax = (otherCategory == 'symmetry' || otherCategory == 'skin') ? 25 : 20;
        final newValue = (_weights[otherCategory] ?? 0) + adjustmentPerCategory.round();
        _weights[otherCategory] = newValue.clamp(otherMin, otherMax);
      }
      
      // Ensure total is exactly 100
      final newTotal = _weights.values.reduce((a, b) => a + b);
      if (newTotal != 100) {
        final diff = 100 - newTotal;
        final firstOther = otherCategories.first;
        _weights[firstOther] = (_weights[firstOther] ?? 0) + diff;
      }
    });
    
    if (widget.analysisId != null) {
      _recalculateScore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final prefsAsync = ref.watch(scoringPreferencesProvider);

    return Scaffold(
      backgroundColor: AppColors.deepBlack,
      appBar: AppBar(
        title: const Text('Scoring Methodology'),
        backgroundColor: AppColors.darkGray,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Reset to Default',
            onPressed: _resetToDefaults,
          ),
        ],
      ),
      body: prefsAsync.when(
        data: (data) {
          // Load preferences when data is available
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _loadPreferencesFromData(data);
          });
          
          final methodology = data['methodology'] as Map<String, dynamic>? ?? {};
          
          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Custom Score Display
                if (_customScore != null && widget.analysisId != null)
                  GlassCard(
                    child: Row(
                      children: [
                        const Icon(
                          Icons.info_outline,
                          color: AppColors.neonCyan,
                          size: 24,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'With your custom weights, your score would be: ${_customScore!.toStringAsFixed(1)}/10',
                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                  color: AppColors.textPrimary,
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                        ),
                      ],
                    ),
                  ),
                
                if (_customScore != null && widget.analysisId != null)
                  const SizedBox(height: 24),

                // Instructions
                Text(
                  'Adjust Category Weights',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Customize how each category contributes to your overall score. Total must equal 100%.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
                const SizedBox(height: 24),

                // Weight Sliders
                ..._weights.keys.map((category) {
                  final categoryData = methodology[category] as Map<String, dynamic>? ?? {};
                  final minWeight = (category == 'symmetry' || category == 'skin') ? 15 : 10;
                  final maxWeight = (category == 'symmetry' || category == 'skin') ? 25 : 20;
                  
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 20),
                    child: _buildCategorySlider(
                      category: category,
                      currentWeight: _weights[category] ?? 0,
                      minWeight: minWeight,
                      maxWeight: maxWeight,
                      methodology: categoryData,
                      onChanged: (value) => _updateWeight(category, value.round()),
                    ),
                  );
                }),

                const SizedBox(height: 32),

                // Save Button
                PrimaryButton(
                  text: 'Save Preferences',
                  icon: Icons.save,
                  isLoading: _isSaving,
                  onPressed: _savePreferences,
                ),

                const SizedBox(height: 24),

                // View Full Methodology Button
                OutlinedButton.icon(
                  onPressed: () {
                    // Navigate to full methodology page
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Full methodology page coming soon'),
                      ),
                    );
                  },
                  icon: const Icon(Icons.description),
                  label: const Text('View Full Methodology'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.neonCyan,
                    side: const BorderSide(color: AppColors.neonCyan),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
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
                'Failed to load methodology',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 24),
              PrimaryButton(
                text: 'Retry',
                onPressed: () {
                  ref.invalidate(scoringPreferencesProvider);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCategorySlider({
    required String category,
    required int currentWeight,
    required int minWeight,
    required int maxWeight,
    required Map<String, dynamic> methodology,
    required ValueChanged<double> onChanged,
  }) {
    final displayName = category.split('_').map((w) => 
      w[0].toUpperCase() + w.substring(1)
    ).join(' ');
    
    final factors = methodology['factors'] as List<dynamic>? ?? [];
    final measurement = methodology['measurement'] as String? ?? '';
    final scientificBasis = methodology['scientificBasis'] as String? ?? '';

    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                displayName.toUpperCase(),
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.bold,
                    ),
              ),
              Text(
                '$currentWeight%',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: AppColors.neonPink,
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Slider(
            value: currentWeight.toDouble(),
            min: minWeight.toDouble(),
            max: maxWeight.toDouble(),
            divisions: maxWeight - minWeight,
            label: '$currentWeight%',
            activeColor: AppColors.neonPink,
            onChanged: onChanged,
          ),
          const SizedBox(height: 8),
          Text(
            'Range: $minWeight% - $maxWeight%',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textTertiary,
                ),
          ),
          if (factors.isNotEmpty || measurement.isNotEmpty || scientificBasis.isNotEmpty) ...[
            const SizedBox(height: 16),
            const Divider(height: 1),
            const SizedBox(height: 12),
            if (factors.isNotEmpty) ...[
              Text(
                'Measured factors:',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 4),
              ...factors.map((factor) => Padding(
                    padding: const EdgeInsets.only(left: 8, bottom: 4),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '• ',
                          style: TextStyle(color: AppColors.neonCyan, fontSize: 12),
                        ),
                        Expanded(
                          child: Text(
                            factor.toString(),
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                          ),
                        ),
                      ],
                    ),
                  )),
            ],
            if (measurement.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                'Measurement: $measurement',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textTertiary,
                      fontSize: 11,
                    ),
              ),
            ],
            if (scientificBasis.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                scientificBasis,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textTertiary,
                      fontSize: 11,
                      fontStyle: FontStyle.italic,
                    ),
              ),
            ],
          ],
        ],
      ),
    );
  }
}

