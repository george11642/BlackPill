import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../config/constants.dart';
import '../../../../core/services/api_service.dart';
import '../../../../core/services/analytics_service.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../shared/widgets/primary_button.dart';

class PaywallScreen extends ConsumerStatefulWidget {
  const PaywallScreen({super.key});

  @override
  ConsumerState<PaywallScreen> createState() => _PaywallScreenState();
}

class _PaywallScreenState extends ConsumerState<PaywallScreen> {
  SubscriptionTier _selectedTier = SubscriptionTier.basic;
  bool _isAnnual = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    ref.read(analyticsServiceProvider).trackPaywallViewed();
  }

  Future<void> _subscribe() async {
    setState(() => _isLoading = true);

    try {
      ref.read(analyticsServiceProvider).trackTierSelected(_selectedTier.name);
      ref.read(analyticsServiceProvider).trackCheckoutStarted();
      
      final apiService = ref.read(apiServiceProvider);
      final checkoutData = await apiService.createCheckoutSession(
        tier: _selectedTier.name,
        interval: _isAnnual ? 'annual' : 'monthly',
      );
      
      // Open Stripe checkout in browser
      final checkoutUrl = Uri.parse(checkoutData['checkout_url']);
      
      if (await canLaunchUrl(checkoutUrl)) {
        await launchUrl(
          checkoutUrl,
          mode: LaunchMode.externalApplication,
        );
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Opening Stripe checkout...'),
              backgroundColor: AppColors.neonCyan,
              duration: Duration(seconds: 2),
            ),
          );
        }
      } else {
        throw Exception('Could not launch checkout URL');
      }
    } catch (e) {
      ref.read(analyticsServiceProvider).trackPaymentFailed(e.toString());
      
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
        title: const Text('Choose Your Plan'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Unlock Your Full Potential',
                style: Theme.of(context).textTheme.displayMedium,
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 8),
              
              Text(
                'Get unlimited scans and AI-powered insights',
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 32),
              
              // Annual/Monthly toggle
              Container(
                decoration: BoxDecoration(
                  color: AppColors.charcoal,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: _buildToggleButton(
                        'Monthly',
                        !_isAnnual,
                        () => setState(() => _isAnnual = false),
                      ),
                    ),
                    Expanded(
                      child: _buildToggleButton(
                        'Annual\n(Save 17%)',
                        _isAnnual,
                        () => setState(() => _isAnnual = true),
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Tier cards
              _buildTierCard(
                tier: SubscriptionTier.basic,
                price: _isAnnual
                    ? AppConstants.basicAnnualPrice
                    : AppConstants.basicMonthlyPrice,
                features: [
                  '5 scans per month',
                  'Full breakdown',
                  'AI improvement tips',
                  'Ad-free experience',
                ],
              ),
              
              const SizedBox(height: 16),
              
              _buildTierCard(
                tier: SubscriptionTier.pro,
                price: _isAnnual
                    ? AppConstants.proAnnualPrice
                    : AppConstants.proMonthlyPrice,
                features: [
                  '20 scans per month',
                  'Everything in Basic',
                  'Priority analysis',
                  'Referral bonuses',
                ],
                isPopular: true,
              ),
              
              const SizedBox(height: 16),
              
              _buildTierCard(
                tier: SubscriptionTier.unlimited,
                price: _isAnnual
                    ? AppConstants.unlimitedAnnualPrice
                    : AppConstants.unlimitedMonthlyPrice,
                features: [
                  'Unlimited scans',
                  'Everything in Pro',
                  'AI coach mode',
                  'Priority support',
                ],
              ),
              
              const SizedBox(height: 32),
              
              // Subscribe button
              PrimaryButton(
                text: 'Subscribe to ${_selectedTier.displayName}',
                onPressed: _isLoading ? null : _subscribe,
                isLoading: _isLoading,
              ),
              
              const SizedBox(height: 16),
              
              // Dismiss button
              TextButton(
                onPressed: () => context.pop(),
                child: const Text('Maybe Later'),
              ),
              
              const SizedBox(height: 16),
              
              // Terms
              Text(
                '7-day money-back guarantee. Cancel anytime.',
                style: Theme.of(context).textTheme.bodySmall,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildToggleButton(String text, bool isSelected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.neonPink : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          text,
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
            color: isSelected ? AppColors.deepBlack : AppColors.textSecondary,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }

  Widget _buildTierCard({
    required SubscriptionTier tier,
    required double price,
    required List<String> features,
    bool isPopular = false,
  }) {
    final isSelected = _selectedTier == tier;
    
    return GestureDetector(
      onTap: () => setState(() => _selectedTier = tier),
      child: Stack(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppColors.neonPink.withOpacity(0.1)
                  : AppColors.darkGray.withOpacity(0.5),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected ? AppColors.neonPink : AppColors.glassBorder,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      tier.displayName,
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '\$${price.toStringAsFixed(2)}',
                          style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                            color: AppColors.neonPink,
                          ),
                        ),
                        Text(
                          _isAnnual ? '/yr' : '/mo',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                ...features.map((feature) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.check_circle,
                        color: AppColors.neonGreen,
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Text(
                        feature,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                )),
              ],
            ),
          ),
          if (isPopular)
            Positioned(
              top: -8,
              right: 20,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'MOST POPULAR',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppColors.deepBlack,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

