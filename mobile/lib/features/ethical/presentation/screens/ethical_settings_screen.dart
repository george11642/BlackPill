import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/services/api_service.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../widgets/wellness_check_dialog.dart';
import '../widgets/mental_health_resources_dialog.dart';

/// Provider for ethical settings
final ethicalSettingsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final apiService = ref.read(apiServiceProvider);
  return await apiService.getEthicalSettings();
});

class EthicalSettingsScreen extends ConsumerStatefulWidget {
  const EthicalSettingsScreen({super.key});

  @override
  ConsumerState<EthicalSettingsScreen> createState() => _EthicalSettingsScreenState();
}

class _EthicalSettingsScreenState extends ConsumerState<EthicalSettingsScreen> {
  bool _isLoading = false;
  Map<String, dynamic>? _settings;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    try {
      final apiService = ref.read(apiServiceProvider);
      final settings = await apiService.getEthicalSettings();
      setState(() {
        _settings = settings;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load settings: ${e.toString()}'),
            backgroundColor: AppColors.neonYellow,
          ),
        );
      }
    }
  }

  Future<void> _updateSetting(String key, bool value) async {
    setState(() => _isLoading = true);
    
    try {
      final apiService = ref.read(apiServiceProvider);
      await apiService.updateEthicalSettings(
        ageEstimation: key == 'age_estimation' ? value : null,
        ethnicityDetection: key == 'ethnicity_detection' ? value : null,
        bodyTypeInferences: key == 'body_type_inferences' ? value : null,
        advancedFeatures: key == 'advanced_features' ? value : null,
        enableWellnessChecks: key == 'enable_wellness_checks' ? value : null,
        showResourcesOnLowScores: key == 'show_resources_on_low_scores' ? value : null,
        checkFrequency: key == 'check_frequency' ? value.toString() : null,
      );
      
      setState(() {
        _settings?[key] = value;
        _isLoading = false;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Settings updated'),
          backgroundColor: AppColors.neonGreen,
        ),
      );
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update: ${e.toString()}'),
            backgroundColor: AppColors.neonYellow,
          ),
        );
      }
    }
  }

  Future<void> _updateFrequency(String frequency) async {
    setState(() => _isLoading = true);
    
    try {
      final apiService = ref.read(apiServiceProvider);
      await apiService.updateEthicalSettings(checkFrequency: frequency);
      
      setState(() {
        _settings?['check_frequency'] = frequency;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _checkWellness() async {
    try {
      final apiService = ref.read(apiServiceProvider);
      final result = await apiService.checkWellness();
      
      if (mounted && result['shouldShow'] == true) {
        await showDialog(
          context: context,
          builder: (context) => WellnessCheckDialog(
            triggerReason: result['triggerReason'] ?? 'Unknown',
            message: result['message'] ?? 'We care about your wellbeing.',
          ),
        );
      }
    } catch (e) {
      // Silently fail - wellness check is optional
    }
  }

  @override
  Widget build(BuildContext context) {
    final settingsAsync = ref.watch(ethicalSettingsProvider);

    return Scaffold(
      backgroundColor: AppColors.deepBlack,
      appBar: AppBar(
        title: const Text('Ethical Settings'),
        backgroundColor: AppColors.darkGray,
      ),
      body: settingsAsync.when(
        data: (data) {
          _settings ??= data;
          
          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Text(
                  'Privacy & Wellness',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Control how your data is used and manage wellness features.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
                const SizedBox(height: 32),

                // Sensitive Inferences Section
                Text(
                  'Sensitive Inferences',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: AppColors.neonCyan,
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 16),
                _buildSettingSwitch(
                  'Age Estimation',
                  'Allow the app to estimate your age',
                  _settings?['age_estimation'] ?? true,
                  (value) => _updateSetting('age_estimation', value),
                ),
                const SizedBox(height: 12),
                _buildSettingSwitch(
                  'Ethnicity Detection',
                  'Allow ethnicity-related analysis (default: off)',
                  _settings?['ethnicity_detection'] ?? false,
                  (value) => _updateSetting('ethnicity_detection', value),
                ),
                const SizedBox(height: 12),
                _buildSettingSwitch(
                  'Body Type Inferences',
                  'Allow body type analysis',
                  _settings?['body_type_inferences'] ?? true,
                  (value) => _updateSetting('body_type_inferences', value),
                ),
                const SizedBox(height: 12),
                _buildSettingSwitch(
                  'Advanced Features',
                  'Enable advanced facial feature analysis',
                  _settings?['advanced_features'] ?? true,
                  (value) => _updateSetting('advanced_features', value),
                ),

                const SizedBox(height: 32),

                // Wellness Checks Section
                Text(
                  'Wellness Checks',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: AppColors.neonCyan,
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 16),
                _buildSettingSwitch(
                  'Enable Wellness Checks',
                  'Receive gentle reminders about healthy usage patterns',
                  _settings?['enable_wellness_checks'] ?? true,
                  (value) => _updateSetting('enable_wellness_checks', value),
                ),
                const SizedBox(height: 16),
                if (_settings?['enable_wellness_checks'] == true) ...[
                  Text(
                    'Check Frequency',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  const SizedBox(height: 8),
                  SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(value: 'weekly', label: Text('Weekly')),
                      ButtonSegment(value: 'biweekly', label: Text('Bi-weekly')),
                      ButtonSegment(value: 'monthly', label: Text('Monthly')),
                    ],
                    selected: {_settings?['check_frequency'] ?? 'weekly'},
                    onSelectionChanged: (Set<String> selection) {
                      _updateFrequency(selection.first);
                    },
                  ),
                  const SizedBox(height: 16),
                  _buildSettingSwitch(
                    'Show Resources on Low Scores',
                    'Display mental health resources when scores are low',
                    _settings?['show_resources_on_low_scores'] ?? true,
                    (value) => _updateSetting('show_resources_on_low_scores', value),
                  ),
                ],

                const SizedBox(height: 32),

                // Mental Health Resources
                GlassCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(
                            Icons.favorite,
                            color: AppColors.neonGreen,
                            size: 24,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Mental Health Resources',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    color: AppColors.textPrimary,
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'If you\'re struggling with body image or mental health, help is available.',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppColors.textSecondary,
                            ),
                      ),
                      const SizedBox(height: 16),
                      PrimaryButton(
                        text: 'View Resources',
                        icon: Icons.help_outline,
                        onPressed: () {
                          showDialog(
                            context: context,
                            builder: (context) => const MentalHealthResourcesDialog(),
                          );
                        },
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Test Wellness Check Button
                OutlinedButton.icon(
                  onPressed: _isLoading ? null : _checkWellness,
                  icon: const Icon(Icons.health_and_safety),
                  label: const Text('Test Wellness Check'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.neonGreen,
                    side: const BorderSide(color: AppColors.neonGreen),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),

                const SizedBox(height: 32),

                // Disclaimer
                GlassCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(
                            Icons.info_outline,
                            color: AppColors.neonYellow,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Important',
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                  color: AppColors.neonYellow,
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Your worth as a person extends far beyond physical appearance. '
                        'BlackPill provides algorithmic estimates based on conventional beauty standards, '
                        'not universal values. If you experience negative thoughts about your appearance, '
                        'please reach out to mental health resources.',
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
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: AppColors.neonYellow),
              const SizedBox(height: 16),
              Text(
                'Failed to load settings',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(
                error.toString(),
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              PrimaryButton(
                text: 'Retry',
                onPressed: () {
                  ref.invalidate(ethicalSettingsProvider);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSettingSwitch(
    String title,
    String description,
    bool value,
    ValueChanged<bool> onChanged,
  ) {
    return GlassCard(
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w500,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: _isLoading ? null : onChanged,
            activeColor: AppColors.neonPink,
          ),
        ],
      ),
    );
  }
}



