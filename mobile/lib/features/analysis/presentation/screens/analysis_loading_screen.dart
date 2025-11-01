import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/services/api_service.dart';
import '../../../../core/services/analytics_service.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/primary_button.dart';

class AnalysisLoadingScreen extends ConsumerStatefulWidget {
  final String imageUrl;

  const AnalysisLoadingScreen({
    super.key,
    required this.imageUrl,
  });

  @override
  ConsumerState<AnalysisLoadingScreen> createState() =>
      _AnalysisLoadingScreenState();
}

class _AnalysisLoadingScreenState extends ConsumerState<AnalysisLoadingScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  String _status = 'Analyzing your photo...';
  final _startTime = DateTime.now();
  bool _hasError = false;
  String _errorTitle = '';
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    
    _controller = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat();
    
    _startAnalysis();
    _updateStatus();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _updateStatus() {
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() => _status = 'Detecting facial features...');
      }
    });
    
    Future.delayed(const Duration(seconds: 5), () {
      if (mounted) {
        setState(() => _status = 'Calculating scores...');
      }
    });
    
    Future.delayed(const Duration(seconds: 8), () {
      if (mounted) {
        setState(() => _status = 'Generating insights...');
      }
    });
  }

  Future<void> _startAnalysis() async {
    setState(() {
      _hasError = false;
      _status = 'Analyzing your photo...';
    });

    try {
      ref.read(analyticsServiceProvider).trackAnalysisStarted();
      
      final apiService = ref.read(apiServiceProvider);
      final result = await apiService.analyzeImage(widget.imageUrl);
      
      final duration = DateTime.now().difference(_startTime).inMilliseconds;
      
      ref.read(analyticsServiceProvider).trackAnalysisCompleted(
        score: result['score'].toDouble(),
        durationMs: duration,
      );
      
      if (mounted) {
        context.go('/results/${result['analysis_id']}');
      }
    } catch (e) {
      ref.read(analyticsServiceProvider).trackAnalysisFailed(e.toString());
      
      if (mounted) {
        setState(() {
          _hasError = true;
          _parseError(e);
        });
      }
    }
  }

  void _parseError(dynamic error) {
    if (error is DioException) {
      switch (error.response?.statusCode) {
        case 500:
          _errorTitle = 'Server Error';
          _errorMessage = 'Our servers encountered an error processing your photo. Please try again in a moment.';
          break;
        case 429:
          _errorTitle = 'Too Many Requests';
          _errorMessage = 'You\'ve made too many requests. Please wait a few minutes and try again.';
          break;
        case 401:
        case 403:
          _errorTitle = 'Authentication Error';
          _errorMessage = 'Your session has expired. Please sign in again.';
          break;
        case 400:
          final message = error.response?.data?['message'] ?? error.response?.data?['error'];
          _errorTitle = 'Invalid Photo';
          _errorMessage = message ?? 'The photo could not be processed. Please ensure it contains a clear face.';
          break;
        default:
          _errorTitle = 'Connection Error';
          _errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      }
    } else {
      _errorTitle = 'Analysis Failed';
      _errorMessage = 'An unexpected error occurred: ${error.toString()}';
    }
  }

  void _retry() {
    _startAnalysis();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.deepBlack,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Image preview
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.file(
                  File(widget.imageUrl),
                  width: 200,
                  height: 200,
                  fit: BoxFit.cover,
                ),
              ),
              
              const SizedBox(height: 48),
              
              if (_hasError) ...[
                // Error icon
                Icon(
                  Icons.error_outline,
                  size: 80,
                  color: AppColors.neonYellow,
                ),
                
                const SizedBox(height: 32),
                
                // Error title
                Text(
                  _errorTitle,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        color: AppColors.neonYellow,
                      ),
                  textAlign: TextAlign.center,
                ),
                
                const SizedBox(height: 16),
                
                // Error message
                Text(
                  _errorMessage,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                  textAlign: TextAlign.center,
                ),
                
                const SizedBox(height: 32),
                
                // Retry button
                PrimaryButton(
                  text: 'Try Again',
                  icon: Icons.refresh,
                  onPressed: _retry,
                ),
                
                const SizedBox(height: 16),
                
                // Back button
                OutlinedButton.icon(
                  onPressed: () => context.go('/camera'),
                  icon: const Icon(Icons.arrow_back),
                  label: const Text('Take New Photo'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.textSecondary,
                    side: BorderSide(color: AppColors.glassBorder),
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  ),
                ),
              ] else ...[
                // Loading animation
                SizedBox(
                  width: 80,
                  height: 80,
                  child: CircularProgressIndicator(
                    strokeWidth: 4,
                    valueColor: const AlwaysStoppedAnimation<Color>(
                      AppColors.neonPink,
                    ),
                  ),
                ),
                
                const SizedBox(height: 32),
                
                // Status text
                Text(
                  _status,
                  style: Theme.of(context).textTheme.headlineMedium,
                  textAlign: TextAlign.center,
                ),
                
                const SizedBox(height: 16),
                
                Text(
                  'This may take up to 30 seconds',
                  style: Theme.of(context).textTheme.bodySmall,
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

