import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../../core/services/analytics_service.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/glass_card.dart';

class PermissionsScreen extends ConsumerStatefulWidget {
  const PermissionsScreen({super.key});

  @override
  ConsumerState<PermissionsScreen> createState() => _PermissionsScreenState();
}

class _PermissionsScreenState extends ConsumerState<PermissionsScreen> {
  bool _cameraGranted = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _checkPermissions();
  }

  Future<void> _checkPermissions() async {
    final cameraStatus = await Permission.camera.status;
    setState(() {
      _cameraGranted = cameraStatus.isGranted;
    });
  }

  Future<void> _requestPermissions() async {
    setState(() => _isLoading = true);

    try {
      final status = await Permission.camera.request();
      
      setState(() {
        _cameraGranted = status.isGranted;
        _isLoading = false;
      });

      if (status.isGranted) {
        // Track permissions granted
        ref.read(analyticsServiceProvider).trackOnboardingStepCompleted('permissions');
        
        // Navigate to home/camera screen
        if (mounted) {
          context.go('/home');
        }
      } else if (status.isPermanentlyDenied) {
        // Show dialog to open settings
        _showSettingsDialog();
      }
    } catch (e) {
      setState(() => _isLoading = false);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error requesting permissions: ${e.toString()}'),
            backgroundColor: AppColors.neonYellow,
          ),
        );
      }
    }
  }

  void _showSettingsDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.darkGray,
        title: const Text('Camera Permission Required'),
        content: const Text(
          'Black Pill needs camera access to take photos for analysis. '
          'Please enable camera permission in Settings.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              openAppSettings();
            },
            child: const Text('Open Settings'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              
              // Icon
              Icon(
                Icons.camera_alt,
                size: 100,
                color: _cameraGranted ? AppColors.neonGreen : AppColors.neonPink,
              ),
              
              const SizedBox(height: 32),
              
              // Title
              Text(
                _cameraGranted ? 'All Set!' : 'Camera Access',
                style: Theme.of(context).textTheme.displayMedium,
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 16),
              
              // Description
              Text(
                _cameraGranted
                    ? 'You\'re ready to start analyzing!'
                    : 'We need access to your camera to take photos for analysis',
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 32),
              
              // Why we need it
              GlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Why we need camera access:',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 16),
                    _buildPermissionReason(
                      Icons.photo_camera,
                      'Take photos directly in the app',
                    ),
                    _buildPermissionReason(
                      Icons.face,
                      'Capture clear facial images for accurate analysis',
                    ),
                    _buildPermissionReason(
                      Icons.lock,
                      'All photos are processed securely and deleted after 90 days',
                    ),
                  ],
                ),
              ),
              
              const Spacer(),
              
              // Continue button
              if (_cameraGranted)
                PrimaryButton(
                  text: 'Continue',
                  onPressed: () => context.go('/home'),
                )
              else
                PrimaryButton(
                  text: 'Grant Camera Access',
                  icon: Icons.camera_alt,
                  onPressed: _isLoading ? null : _requestPermissions,
                  isLoading: _isLoading,
                ),
              
              const SizedBox(height: 16),
              
              // Skip button
              if (!_cameraGranted)
                TextButton(
                  onPressed: () => context.go('/home'),
                  child: const Text('Skip for Now'),
                ),
              
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPermissionReason(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.neonCyan, size: 24),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              text,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }
}


