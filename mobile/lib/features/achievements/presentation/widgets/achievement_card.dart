import 'package:flutter/material.dart';
import 'package:confetti/confetti.dart';
import '../../../../shared/theme/app_colors.dart';

class AchievementCard extends StatefulWidget {
  final Map<String, dynamic> achievement;

  const AchievementCard({
    super.key,
    required this.achievement,
  });

  @override
  State<AchievementCard> createState() => _AchievementCardState();
}

class _AchievementCardState extends State<AchievementCard> {
  late ConfettiController _confettiController;

  @override
  void initState() {
    super.initState();
    _confettiController = ConfettiController(duration: const Duration(seconds: 2));
  }

  @override
  void dispose() {
    _confettiController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final unlocked = widget.achievement['unlocked'] ?? false;
    final emoji = widget.achievement['emoji'] ?? '🏆';
    final name = widget.achievement['name'] ?? 'Unknown';

    return Stack(
      children: [
        Container(
          decoration: BoxDecoration(
            color: unlocked ? AppColors.darkGray : AppColors.charcoal,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: unlocked ? AppColors.neonPink : AppColors.glassBorder,
              width: unlocked ? 2 : 1,
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                emoji,
                style: TextStyle(
                  fontSize: unlocked ? 48 : 32,
                  opacity: unlocked ? 1.0 : 0.5,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                name,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: unlocked ? AppColors.textPrimary : AppColors.textTertiary,
                  fontWeight: unlocked ? FontWeight.bold : FontWeight.normal,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              if (!unlocked) ...[
                const SizedBox(height: 4),
                Icon(
                  Icons.lock,
                  size: 16,
                  color: AppColors.textTertiary,
                ),
              ],
            ],
          ),
        ),
        if (unlocked)
          Align(
            alignment: Alignment.topRight,
            child: Padding(
              padding: const EdgeInsets.all(4),
              child: Icon(
                Icons.check_circle,
                size: 20,
                color: AppColors.neonGreen,
              ),
            ),
          ),
      ],
    );
  }
}

