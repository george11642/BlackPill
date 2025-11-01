import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/services/api_service.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../shared/widgets/primary_button.dart';

class ActionPlanScreen extends ConsumerStatefulWidget {
  final String analysisId;
  final String category;
  final double currentScore;
  final double targetScore;

  const ActionPlanScreen({
    super.key,
    required this.analysisId,
    required this.category,
    required this.currentScore,
    required this.targetScore,
  });

  @override
  ConsumerState<ActionPlanScreen> createState() => _ActionPlanScreenState();
}

class _ActionPlanScreenState extends ConsumerState<ActionPlanScreen> {
  Map<String, dynamic>? _actionPlan;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadActionPlan();
  }

  Future<void> _loadActionPlan() async {
    try {
      // Generate routine which includes action plans
      final apiService = ref.read(apiServiceProvider);
      final result = await apiService.generateRoutine(
        analysisId: widget.analysisId,
        focusAreas: [widget.category],
        timeCommitment: 'medium',
      );

      // Action plans are returned in the response
      final actionPlans = result['actionPlans'] as List<dynamic>? ?? [];
      final planForCategory = actionPlans.firstWhere(
        (plan) => plan['category'] == widget.category,
        orElse: () => null,
      );

      if (planForCategory != null) {
        setState(() {
          _actionPlan = planForCategory as Map<String, dynamic>;
          _isLoading = false;
        });
      } else {
        // Fallback: create basic plan from scores
        setState(() {
          _actionPlan = {
            'category': widget.category,
            'currentScore': widget.currentScore,
            'targetScore': widget.targetScore,
            'severity': widget.currentScore < 5 ? 'severe' : widget.currentScore < 6.5 ? 'moderate' : 'mild',
            'diy': {
              'title': 'DIY Approach',
              'routine': [],
              'estimatedCost': 'TBD',
              'timeToResults': '8-12 weeks',
              'effectiveness': 'medium',
            },
            'otc': {
              'title': 'OTC Products',
              'products': [],
              'estimatedCost': 'TBD',
              'timeToResults': '4-8 weeks',
              'effectiveness': 'high',
            },
            'professional': {
              'title': 'Professional Treatments',
              'treatments': [],
              'estimatedCost': 'TBD',
              'timeToResults': '2-6 months',
              'effectiveness': 'very high',
            },
          };
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load action plan: ${e.toString()}'),
            backgroundColor: AppColors.neonYellow,
          ),
        );
      }
    }
  }

  String _getSeverityColor(String severity) {
    switch (severity) {
      case 'severe':
        return 'red';
      case 'moderate':
        return 'orange';
      case 'mild':
        return 'yellow';
      default:
        return 'gray';
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: AppColors.deepBlack,
        appBar: AppBar(
          title: const Text('Action Plan'),
          backgroundColor: AppColors.darkGray,
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_actionPlan == null) {
      return Scaffold(
        backgroundColor: AppColors.deepBlack,
        appBar: AppBar(
          title: const Text('Action Plan'),
          backgroundColor: AppColors.darkGray,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: AppColors.neonYellow),
              const SizedBox(height: 16),
              Text(
                'Action plan not available',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 24),
              PrimaryButton(
                text: 'Go Back',
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
        ),
      );
    }

    final severity = _actionPlan!['severity'] as String;
    final severityColor = _getSeverityColor(severity);

    return Scaffold(
      backgroundColor: AppColors.deepBlack,
      appBar: AppBar(
        title: const Text('Improvement Plan'),
        backgroundColor: AppColors.darkGray,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Header Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: severityColor == 'red'
                      ? [Colors.red.shade400, Colors.orange.shade400]
                      : severityColor == 'orange'
                          ? [Colors.orange.shade400, Colors.yellow.shade400]
                          : [Colors.yellow.shade400, Colors.green.shade400],
                ),
              ),
              child: Column(
                children: [
                  const Icon(Icons.warning_amber_rounded, size: 48, color: Colors.white),
                  const SizedBox(height: 12),
                  Text(
                    '${severity.toUpperCase()} ${widget.category.toUpperCase()} ISSUES',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Current: ${widget.currentScore.toStringAsFixed(1)}/10 → Target: ${widget.targetScore.toStringAsFixed(1)}/10',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),

            // DIY Approach
            Padding(
              padding: const EdgeInsets.all(20),
              child: _ApproachCard(
                title: 'DIY APPROACH',
                cost: _actionPlan!['diy']['estimatedCost'],
                time: _actionPlan!['diy']['timeToResults'],
                effectiveness: _actionPlan!['diy']['effectiveness'],
                items: (_actionPlan!['diy']['routine'] as List<dynamic>)
                    .map((e) => e.toString())
                    .toList(),
                science: _actionPlan!['diy']['scienceBacking'],
                color: AppColors.neonCyan,
                icon: Icons.home,
                onTap: () {
                  // Navigate to routine builder with DIY approach
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Adding DIY routine...'),
                      backgroundColor: AppColors.neonGreen,
                    ),
                  );
                },
              ),
            ),

            // OTC Products
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: _ApproachCard(
                title: 'OTC PRODUCTS',
                cost: _actionPlan!['otc']['estimatedCost'],
                time: _actionPlan!['otc']['timeToResults'],
                effectiveness: _actionPlan!['otc']['effectiveness'],
                items: (_actionPlan!['otc']['products'] as List<dynamic>)
                    .map((p) => '${p['name']} (\$${p['price']}) - ${p['purpose']}')
                    .toList(),
                science: _actionPlan!['otc']['scienceBacking'],
                color: AppColors.neonPurple,
                icon: Icons.shopping_bag,
                onTap: () {
                  // Navigate to marketplace
                  context.push('/products?category=${widget.category}');
                },
              ),
            ),

            // Professional Treatments
            Padding(
              padding: const EdgeInsets.all(20),
              child: _ApproachCard(
                title: 'PROFESSIONAL TREATMENTS',
                cost: _actionPlan!['professional']['estimatedCost'],
                time: _actionPlan!['professional']['timeToResults'],
                effectiveness: _actionPlan!['professional']['effectiveness'],
                items: (_actionPlan!['professional']['treatments'] as List<dynamic>)
                    .map((t) => '${t['name']} (${t['sessions']} sessions @ ${t['costPerSession']}) - ${t['description']}')
                    .toList(),
                science: _actionPlan!['professional']['warning'],
                color: AppColors.neonGreen,
                icon: Icons.local_hospital,
                warning: true,
                onTap: () {
                  // Show professional finder or disclaimer
                  showDialog(
                    context: context,
                    builder: (context) => AlertDialog(
                      backgroundColor: AppColors.darkGray,
                      title: const Text('Professional Consultation'),
                      content: Text(
                        'For professional treatments, please consult a board-certified dermatologist or licensed professional. '
                        'This information is for educational purposes only and does not constitute medical advice.',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context),
                          child: const Text('Close'),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),

            // Recommendation
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
              child: GlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.lightbulb_outline, color: AppColors.neonYellow, size: 24),
                        const SizedBox(width: 12),
                        Text(
                          'Recommendation',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Start with OTC approach for 8 weeks. If <30% improvement, consult professional.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ApproachCard extends StatelessWidget {
  final String title;
  final String cost;
  final String time;
  final String effectiveness;
  final List<String> items;
  final String science;
  final Color color;
  final IconData icon;
  final bool warning;
  final VoidCallback onTap;

  const _ApproachCard({
    required this.title,
    required this.cost,
    required this.time,
    required this.effectiveness,
    required this.items,
    required this.science,
    required this.color,
    required this.icon,
    this.warning = false,
    required this.onTap,
  });

  int _getEffectivenessStars(String effectiveness) {
    switch (effectiveness) {
      case 'low':
        return 1;
      case 'medium':
        return 3;
      case 'high':
        return 4;
      case 'very high':
        return 5;
      default:
        return 3;
    }
  }

  @override
  Widget build(BuildContext context) {
    final stars = _getEffectivenessStars(effectiveness);

    return GlassCard(
      margin: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Meta Info
          Row(
            children: [
              _buildMetaChip(Icons.attach_money, cost, AppColors.neonGreen),
              const SizedBox(width: 8),
              _buildMetaChip(Icons.access_time, time, AppColors.neonCyan),
              const SizedBox(width: 8),
              _buildMetaChip(Icons.star, '⭐' * stars, AppColors.neonYellow),
            ],
          ),
          const SizedBox(height: 20),

          // Items List
          ...items.map((item) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.check_circle,
                      color: AppColors.neonGreen,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        item,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppColors.textSecondary,
                            ),
                      ),
                    ),
                  ],
                ),
              )),

          const SizedBox(height: 16),

          // Science Backing
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.charcoal.withOpacity(0.5),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.science, color: AppColors.neonCyan, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    science,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                          fontStyle: FontStyle.italic,
                        ),
                  ),
                ),
              ],
            ),
          ),

          if (warning) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.neonYellow.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.neonYellow, width: 1),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber, color: AppColors.neonYellow, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Professional consultation required',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.neonYellow,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 20),

          // Action Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: onTap,
              icon: Icon(icon, size: 20),
              label: Text(
                title == 'DIY APPROACH'
                    ? 'Start DIY Routine'
                    : title == 'OTC PRODUCTS'
                        ? 'Shop These Products'
                        : 'Find Professional',
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: color.withOpacity(0.2),
                foregroundColor: color,
                side: BorderSide(color: color, width: 2),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetaChip(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

