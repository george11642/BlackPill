import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/services/analytics_service.dart';
import '../../../../shared/theme/app_colors.dart';

class BreakdownBar extends ConsumerStatefulWidget {
  final String label;
  final double score;

  const BreakdownBar({
    super.key,
    required this.label,
    required this.score,
  });

  @override
  ConsumerState<BreakdownBar> createState() => _BreakdownBarState();
}

class _BreakdownBarState extends ConsumerState<BreakdownBar>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;
  bool _isExpanded = false;

  @override
  void initState() {
    super.initState();
    
    _controller = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    
    _animation = Tween<double>(
      begin: 0,
      end: widget.score / 10,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeOutCubic,
      ),
    );
    
    Future.delayed(Duration(milliseconds: _getDelay()), () {
      if (mounted) {
        _controller.forward();
      }
    });
  }

  int _getDelay() {
    // Stagger the animations
    switch (widget.label) {
      case 'Symmetry':
        return 0;
      case 'Jawline':
        return 100;
      case 'Eyes':
        return 200;
      case 'Lips':
        return 300;
      case 'Skin Quality':
        return 400;
      case 'Bone Structure':
        return 500;
      default:
        return 0;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: GestureDetector(
        onTap: () {
          setState(() => _isExpanded = !_isExpanded);
          if (_isExpanded) {
            ref.read(analyticsServiceProvider).trackBreakdownExpanded(widget.label);
          }
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    widget.label,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ),
                Row(
                  children: [
                    Text(
                      widget.score.toStringAsFixed(1),
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: AppColors.neonPink,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Icon(
                      _isExpanded ? Icons.expand_less : Icons.expand_more,
                      color: AppColors.textTertiary,
                      size: 20,
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 8),
            AnimatedBuilder(
              animation: _animation,
              builder: (context, child) {
                return Container(
                  height: 8,
                  decoration: BoxDecoration(
                    color: AppColors.charcoal,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: FractionallySizedBox(
                    alignment: Alignment.centerLeft,
                    widthFactor: _animation.value,
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: AppColors.primaryGradient,
                        borderRadius: BorderRadius.circular(4),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.neonPink.withOpacity(0.5),
                            blurRadius: 8,
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
            if (_isExpanded) ...[
              const SizedBox(height: 12),
              Text(
                _getCategoryDescription(widget.label),
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _getCategoryDescription(String category) {
    switch (category) {
      case 'Symmetry':
        return 'Measures facial symmetry and proportion balance between left and right sides.';
      case 'Jawline':
        return 'Evaluates jaw definition, angle, and overall lower face structure.';
      case 'Eyes':
        return 'Assesses eye shape, size, spacing, and overall eye area aesthetics.';
      case 'Lips':
        return 'Analyzes lip fullness, symmetry, and proportion to face.';
      case 'Skin Quality':
        return 'Evaluates skin clarity, texture, and overall complexion.';
      case 'Bone Structure':
        return 'Assesses cheekbones, facial contours, and overall bone prominence.';
      default:
        return 'Tap to collapse this section.';
    }
  }
}

