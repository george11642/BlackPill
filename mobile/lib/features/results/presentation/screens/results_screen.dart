import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:confetti/confetti.dart';
import 'package:share_plus/share_plus.dart';

import 'package:go_router/go_router.dart';

import '../../../../config/constants.dart';
import '../../../../core/services/api_service.dart';
import '../../../../core/services/analytics_service.dart';
import '../../../../core/services/paywall_service.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../subscription/presentation/screens/paywall_screen.dart';
import '../../../ethical/presentation/widgets/mental_health_resources_dialog.dart';
import '../widgets/score_circle.dart';
import '../widgets/breakdown_bar.dart';
import '../widgets/share_platform_buttons.dart';

class ResultsScreen extends ConsumerStatefulWidget {
  final String analysisId;

  const ResultsScreen({
    super.key,
    required this.analysisId,
  });

  @override
  ConsumerState<ResultsScreen> createState() => _ResultsScreenState();
}

class _ResultsScreenState extends ConsumerState<ResultsScreen> {
  late ConfettiController _confettiController;
  Map<String, dynamic>? _analysis;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _confettiController = ConfettiController(
      duration: AppConstants.confettiAnimation,
    );
    _loadAnalysis();
  }

  @override
  void dispose() {
    _confettiController.dispose();
    super.dispose();
  }

  Future<void> _loadAnalysis() async {
    try {
      final apiService = ref.read(apiServiceProvider);
      final analysis = await apiService.getAnalysis(widget.analysisId);
      
      setState(() {
        _analysis = analysis;
        _isLoading = false;
      });
      
      // Show confetti if score is high
      if (analysis['score'] >= AppConstants.confettiThreshold) {
        _confettiController.play();
      }
      
      ref.read(analyticsServiceProvider).trackResultsViewed();
      
      // Mark first scan as completed
      await ref.read(paywallServiceProvider).markFirstScanCompleted();
      
      // Check if we should show paywall
      _checkAndShowPaywall();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading results: ${e.toString()}'),
            backgroundColor: AppColors.neonYellow,
          ),
        );
      }
    }
  }

  Future<void> _checkAndShowPaywall() async {
    // Wait a bit so user sees results first
    await Future.delayed(const Duration(seconds: 2));
    
    if (!mounted) return;
    
    final shouldShow = await ref.read(paywallServiceProvider).shouldShowPaywall();
    
    if (shouldShow && mounted) {
      await ref.read(paywallServiceProvider).markPaywallShown();
      
      // Show paywall as a dialog that's dismissible
      showDialog(
        context: context,
        barrierDismissible: true,
        builder: (context) => Dialog(
          backgroundColor: Colors.transparent,
          child: Container(
            constraints: const BoxConstraints(maxHeight: 600),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: const PaywallScreen(),
            ),
          ),
        ),
      );
    }
  }

  Future<void> _shareResults() async {
    try {
      ref.read(analyticsServiceProvider).trackShareCardViewed();
      
      final apiService = ref.read(apiServiceProvider);
      final shareData = await apiService.generateShareCard(widget.analysisId);
      
      // Show share platform dialog
      if (mounted) {
        showModalBottomSheet(
          context: context,
          backgroundColor: AppColors.darkGray,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          builder: (context) => Padding(
            padding: const EdgeInsets.all(24),
            child: SharePlatformButtons(
              shareUrl: shareData['share_url'],
              message: 'Check out my Black Pill score! Get yours at ${shareData['share_url']}',
              analyticsService: ref.read(analyticsServiceProvider),
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error sharing: ${e.toString()}'),
            backgroundColor: AppColors.neonYellow,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    final score = _analysis!['score'].toDouble();
    final breakdown = _analysis!['breakdown'] as Map<String, dynamic>;
    final tips = _analysis!['tips'] as List<dynamic>;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Your Results'),
      ),
      body: Stack(
        children: [
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Score circle
                  ScoreCircle(score: score),
                  
                  const SizedBox(height: 32),
                  
                  // Breakdown
                  GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Breakdown',
                              style: Theme.of(context).textTheme.headlineMedium,
                            ),
                            IconButton(
                              icon: const Icon(Icons.info_outline, size: 20),
                              onPressed: () {
                                context.push('/scoring/methodology?analysisId=${widget.analysisId}');
                              },
                              color: AppColors.neonCyan,
                              tooltip: 'View Scoring Methodology',
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        BreakdownBar(
                          label: 'Symmetry',
                          score: breakdown['symmetry'].toDouble(),
                        ),
                        BreakdownBar(
                          label: 'Jawline',
                          score: breakdown['jawline'].toDouble(),
                        ),
                        BreakdownBar(
                          label: 'Eyes',
                          score: breakdown['eyes'].toDouble(),
                        ),
                        BreakdownBar(
                          label: 'Lips',
                          score: breakdown['lips'].toDouble(),
                        ),
                        BreakdownBar(
                          label: 'Skin Quality',
                          score: breakdown['skin'].toDouble(),
                        ),
                        BreakdownBar(
                          label: 'Bone Structure',
                          score: breakdown['bone_structure'].toDouble(),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Tips
                  GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Improvement Tips',
                              style: Theme.of(context).textTheme.headlineMedium,
                            ),
                            IconButton(
                              icon: const Icon(Icons.lightbulb_outline, size: 20),
                              onPressed: () {
                                // Track tips viewed
                                ref.read(analyticsServiceProvider).trackTipsViewed();
                              },
                              color: AppColors.neonCyan,
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        ...tips.map((tip) => _buildTip(
                          tip['title'],
                          tip['description'],
                          tip['timeframe'],
                        )),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Action Plans for weak areas
                  if (_hasWeakAreas(breakdown))
                    GlassCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.trending_up, color: AppColors.neonPink, size: 24),
                              const SizedBox(width: 12),
                              Text(
                                'Improvement Plans',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                      color: AppColors.textPrimary,
                                      fontWeight: FontWeight.bold,
                                    ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Get personalized action plans for your weak areas with DIY, OTC, and professional options.',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                          ),
                          const SizedBox(height: 16),
                          ..._getWeakAreas(breakdown).map((area) => Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: OutlinedButton(
                                  onPressed: () {
                                    final score = (breakdown[area] as num).toDouble();
                                    context.push(
                                      '/action-plan?analysisId=${widget.analysisId}&category=$area&currentScore=$score&targetScore=${(score + 1.5).clamp(score, 9.5)}',
                                    );
                                  },
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppColors.neonPink,
                                    side: const BorderSide(color: AppColors.neonPink),
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(area.toUpperCase()),
                                      Icon(Icons.arrow_forward, size: 16),
                                    ],
                                  ),
                                ),
                              )),
                        ],
                      ),
                    ),
                  
                  const SizedBox(height: 32),
                  
                  // Share button
                  PrimaryButton(
                    text: 'Share Results',
                    icon: Icons.share,
                    onPressed: _shareResults,
                  ),
                  
                  const SizedBox(height: 32),
                  
                  // Mental Health Resources Footer
                  GlassCard(
                    child: Column(
                      children: [
                        Row(
                          children: [
                            const Icon(
                              Icons.info_outline,
                              color: AppColors.neonCyan,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'This is just one perspective. Your worth isn\'t defined by a score.',
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                      color: AppColors.textSecondary,
                                    ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        OutlinedButton.icon(
                          onPressed: () {
                            showDialog(
                              context: context,
                              builder: (context) => const MentalHealthResourcesDialog(),
                            );
                          },
                          icon: const Icon(Icons.favorite, size: 18),
                          label: const Text('Mental Health Resources'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.neonGreen,
                            side: const BorderSide(color: AppColors.neonGreen),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 24,
                              vertical: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
          
          // Confetti
          Align(
            alignment: Alignment.topCenter,
            child: ConfettiWidget(
              confettiController: _confettiController,
              blastDirectionality: BlastDirectionality.explosive,
              colors: const [
                AppColors.neonPink,
                AppColors.neonCyan,
                AppColors.neonPurple,
                AppColors.neonGreen,
              ],
            ),
          ),
        ],
      ),
    );
  }

  bool _hasWeakAreas(Map<String, dynamic> breakdown) {
    return breakdown.values.any((score) => (score as num).toDouble() < 7.0);
  }

  List<String> _getWeakAreas(Map<String, dynamic> breakdown) {
    return breakdown.entries
        .where((entry) => (entry.value as num).toDouble() < 7.0)
        .map((entry) => entry.key)
        .toList();
  }

  Widget _buildTip(String title, String description, String timeframe) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: AppColors.neonPink,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.only(left: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  description,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 4),
                Text(
                  'Timeframe: $timeframe',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.neonCyan,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

