import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/services/api_service.dart';
import '../../../core/services/analytics_service.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/widgets/glass_card.dart';
import '../../../shared/widgets/primary_button.dart';

class ReferralStatsScreen extends ConsumerStatefulWidget {
  const ReferralStatsScreen({super.key});

  @override
  ConsumerState<ReferralStatsScreen> createState() => _ReferralStatsScreenState();
}

class _ReferralStatsScreenState extends ConsumerState<ReferralStatsScreen> {
  Map<String, dynamic>? _stats;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final apiService = ref.read(apiServiceProvider);
      final stats = await apiService.getReferralStats();
      
      setState(() {
        _stats = stats;
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading stats: ${e.toString()}'),
            backgroundColor: AppColors.neonYellow,
          ),
        );
      }
    }
  }

  void _copyReferralCode() {
    if (_stats?['referral_code'] != null) {
      Clipboard.setData(ClipboardData(text: _stats!['referral_code']));
      ref.read(analyticsServiceProvider).trackReferralLinkCopied();
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Referral code copied!'),
          backgroundColor: AppColors.neonGreen,
        ),
      );
    }
  }

  void _shareReferralLink() {
    if (_stats?['referral_code'] != null) {
      final code = _stats!['referral_code'];
      final link = 'https://blackpill.app/ref/$code';
      
      Share.share(
        'Get 5 free scans on Black Pill! Use my referral code: $code\n\n$link',
      );
      
      ref.read(analyticsServiceProvider).trackShareInitiated('referral');
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

    final totalInvited = _stats?['total_invited'] ?? 0;
    final accepted = _stats?['accepted'] ?? 0;
    final pending = _stats?['pending'] ?? 0;
    final totalBonusScans = _stats?['total_bonus_scans'] ?? 0;
    final inviteStreak = _stats?['invite_streak'] ?? 0;
    final referralCode = _stats?['referral_code'] ?? '';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Referral Stats'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Text(
                'Invite Friends',
                style: Theme.of(context).textTheme.displayMedium,
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 8),
              
              Text(
                'Get 5 free scans for each friend who joins!',
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 32),
              
              // Referral Code Card
              GlassCard(
                child: Column(
                  children: [
                    Text(
                      'Your Referral Code',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    
                    const SizedBox(height: 16),
                    
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 16,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.charcoal,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppColors.neonPink,
                          width: 2,
                        ),
                      ),
                      child: Text(
                        referralCode,
                        style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                          fontFamily: 'monospace',
                          color: AppColors.neonPink,
                        ),
                      ),
                    ),
                    
                    const SizedBox(height: 16),
                    
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _copyReferralCode,
                            icon: const Icon(Icons.copy, size: 20),
                            label: const Text('Copy'),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: AppColors.neonCyan),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _shareReferralLink,
                            icon: const Icon(Icons.share, size: 20),
                            label: const Text('Share'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Stats Grid
              Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      'Total Invited',
                      totalInvited.toString(),
                      Icons.people,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildStatCard(
                      'Accepted',
                      accepted.toString(),
                      Icons.check_circle,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 12),
              
              Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      'Pending',
                      pending.toString(),
                      Icons.hourglass_empty,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildStatCard(
                      'Bonus Scans',
                      totalBonusScans.toString(),
                      Icons.star,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 24),
              
              // Streak Card
              GlassCard(
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: AppColors.primaryGradient,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.local_fire_department,
                        size: 32,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Invite Streak',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          Text(
                            '$inviteStreak days',
                            style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                              color: AppColors.neonPink,
                            ),
                          ),
                        ],
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
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Icon(
            icon,
            color: AppColors.neonCyan,
            size: 32,
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineLarge?.copyWith(
              color: AppColors.neonPink,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

