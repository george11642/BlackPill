import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/services/api_service.dart';
import '../../../../core/services/analytics_service.dart';
import '../../../../shared/theme/app_colors.dart';

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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Analysis failed: ${e.toString()}'),
            backgroundColor: AppColors.neonYellow,
          ),
        );
        context.go('/camera');
      }
    }
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
          ),
        ),
      ),
    );
  }
}

