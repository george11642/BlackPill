import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/services/api_service.dart';
import '../../../../core/services/analytics_service.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/text_input_field.dart';
import '../../../../shared/widgets/glass_card.dart';

class CreatorApplicationScreen extends ConsumerStatefulWidget {
  const CreatorApplicationScreen({super.key});

  @override
  ConsumerState<CreatorApplicationScreen> createState() =>
      _CreatorApplicationScreenState();
}

class _CreatorApplicationScreenState
    extends ConsumerState<CreatorApplicationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _instagramController = TextEditingController();
  final _tiktokController = TextEditingController();
  final _bioController = TextEditingController();
  int _followerCount = 0;
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _instagramController.dispose();
    _tiktokController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _submitApplication() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      ref.read(analyticsServiceProvider).trackCreatorApplied();

      final apiService = ref.read(apiServiceProvider);
      
      // Call backend API to apply
      // For now, we'll just show success
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Application submitted! We\'ll review within 48 hours.'),
            backgroundColor: AppColors.neonGreen,
          ),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: AppColors.neonYellow,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Creator Application'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                GlassCard(
                  child: Column(
                    children: [
                      Icon(
                        Icons.stars,
                        size: 64,
                        color: AppColors.neonPurple,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Join the Creator Program',
                        style: Theme.of(context).textTheme.displaySmall,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Earn 20-30% recurring commission',
                        style: Theme.of(context).textTheme.bodyMedium,
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 32),

                TextInputField(
                  controller: _nameController,
                  label: 'Your Name',
                  validator: (v) => v == null || v.isEmpty ? 'Name required' : null,
                ),

                const SizedBox(height: 16),

                TextInputField(
                  controller: _instagramController,
                  label: 'Instagram Handle (optional)',
                  hint: '@username',
                ),

                const SizedBox(height: 16),

                TextInputField(
                  controller: _tiktokController,
                  label: 'TikTok Handle (optional)',
                  hint: '@username',
                ),

                const SizedBox(height: 16),

                TextInputField(
                  controller: _bioController,
                  label: 'Bio',
                  hint: 'Tell us about your content',
                  maxLines: 3,
                ),

                const SizedBox(height: 32),

                PrimaryButton(
                  text: 'Submit Application',
                  onPressed: _isLoading ? null : _submitApplication,
                  isLoading: _isLoading,
                ),

                const SizedBox(height: 16),

                Text(
                  'We\'ll review your application within 48 hours',
                  style: Theme.of(context).textTheme.bodySmall,
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

