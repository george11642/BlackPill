import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/services/api_service.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/widgets/glass_card.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../ethical/presentation/widgets/mental_health_resources_dialog.dart';

class DisclaimersScreen extends ConsumerStatefulWidget {
  const DisclaimersScreen({super.key});

  @override
  ConsumerState<DisclaimersScreen> createState() => _DisclaimersScreenState();
}

class _DisclaimersScreenState extends ConsumerState<DisclaimersScreen> {
  bool _aiLimitations = false;
  bool _notMedicalAdvice = false;
  bool _beautyStandards = false;
  bool _personalWorth = false;
  bool _isLoading = false;

  bool get _allAcknowledged =>
      _aiLimitations && _notMedicalAdvice && _beautyStandards && _personalWorth;

  Future<void> _saveAcknowledgments() async {
    if (!_allAcknowledged) return;

    setState(() => _isLoading = true);

    try {
      final apiService = ref.read(apiServiceProvider);
      
      // Save to user_ethical_settings
      await apiService.dio.post(
        '/api/ethical/acknowledge-disclaimers',
        data: {
          'disclaimers_acknowledged': true,
        },
      );

      if (mounted) {
        // Navigate to permissions screen
        context.go('/onboarding/permissions');
      }
    } catch (e) {
      setState(() => _isLoading = false);
      
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppColors.deepBlack,
              AppColors.darkGray,
            ],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 32),
                
                // Warning Icon
                Center(
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppColors.neonYellow.withOpacity(0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.warning_amber_rounded,
                      size: 48,
                      color: AppColors.neonYellow,
                    ),
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Title
                Center(
                  child: Text(
                    'Important Information',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Subtitle
                Center(
                  child: Text(
                    'BlackPill uses AI to analyze facial attractiveness.\nPlease understand:',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ),
                
                const SizedBox(height: 32),
                
                // Disclaimers
                GlassCard(
                  child: Column(
                    children: [
                      _buildDisclaimerCheckbox(
                        'Results are algorithmic estimates, not absolute truth',
                        _aiLimitations,
                        (value) => setState(() => _aiLimitations = value),
                        Icons.smart_toy,
                      ),
                      
                      const Divider(height: 32),
                      
                      _buildDisclaimerCheckbox(
                        'This is NOT medical advice. Consult professionals for health concerns',
                        _notMedicalAdvice,
                        (value) => setState(() => _notMedicalAdvice = value),
                        Icons.medical_services,
                      ),
                      
                      const Divider(height: 32),
                      
                      _buildDisclaimerCheckbox(
                        'Based on conventional beauty standards, not universal values',
                        _beautyStandards,
                        (value) => setState(() => _beautyStandards = value),
                        Icons.palette,
                      ),
                      
                      const Divider(height: 32),
                      
                      _buildDisclaimerCheckbox(
                        'Your worth as a person extends far beyond physical appearance',
                        _personalWorth,
                        (value) => setState(() => _personalWorth = value),
                        Icons.favorite,
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Mental Health Resources Button
                OutlinedButton.icon(
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (context) => const MentalHealthResourcesDialog(),
                    );
                  },
                  icon: const Icon(Icons.help_outline),
                  label: const Text('View Mental Health Resources'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.neonGreen,
                    side: const BorderSide(color: AppColors.neonGreen),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // I Understand Button
                PrimaryButton(
                  text: 'I Understand',
                  icon: Icons.check_circle,
                  onPressed: _allAcknowledged && !_isLoading ? _saveAcknowledgments : null,
                  isLoading: _isLoading,
                ),
                
                const SizedBox(height: 32),
                
                // Additional Info
                Text(
                  'If you experience negative thoughts about your appearance, please reach out to mental health resources.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textTertiary,
                      ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDisclaimerCheckbox(
    String text,
    bool value,
    ValueChanged<bool> onChanged,
    IconData icon,
  ) {
    return InkWell(
      onTap: () => onChanged(!value),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(6),
              border: Border.all(
                color: value ? AppColors.neonPink : AppColors.glassBorder,
                width: 2,
              ),
              color: value ? AppColors.neonPink : Colors.transparent,
            ),
            child: value
                ? const Icon(
                    Icons.check,
                    size: 16,
                    color: AppColors.textPrimary,
                  )
                : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(icon, color: AppColors.neonCyan, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        text,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: value
                                  ? AppColors.textPrimary
                                  : AppColors.textSecondary,
                            ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

