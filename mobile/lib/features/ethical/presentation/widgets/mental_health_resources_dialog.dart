import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/glass_card.dart';

class MentalHealthResourcesDialog extends StatelessWidget {
  const MentalHealthResourcesDialog({super.key});

  final List<Map<String, dynamic>> _resources = const [
    {
      'name': 'NAMI Helpline',
      'phone': '1-800-950-6264',
      'description': 'National Alliance on Mental Illness',
      'available': 'Mon-Fri, 10am-10pm ET',
      'type': 'phone',
    },
    {
      'name': 'Crisis Text Line',
      'sms': 'Text HOME to 741741',
      'description': '24/7 crisis support via text',
      'available': '24/7',
      'type': 'sms',
    },
    {
      'name': 'BDD Support',
      'url': 'https://bdd.iocdf.org',
      'description': 'Body Dysmorphic Disorder Foundation',
      'available': 'Online resources',
      'type': 'url',
    },
    {
      'name': '7 Cups',
      'url': 'https://www.7cups.com',
      'description': 'Free emotional support chat',
      'available': '24/7',
      'type': 'url',
    },
    {
      'name': 'BetterHelp',
      'url': 'https://www.betterhelp.com',
      'description': 'Professional online therapy',
      'available': 'Paid service, financial aid available',
      'type': 'url',
    },
  ];

  Future<void> _handleResourceTap(Map<String, dynamic> resource) async {
    try {
      if (resource['type'] == 'phone' && resource['phone'] != null) {
        final uri = Uri.parse('tel:${resource['phone']}');
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri);
        }
      } else if (resource['type'] == 'sms' && resource['sms'] != null) {
        // For SMS, we can't auto-send, but we can show instructions
        // In a real app, you might copy the number to clipboard
      } else if (resource['type'] == 'url' && resource['url'] != null) {
        final uri = Uri.parse(resource['url']);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
      }
    } catch (e) {
      // Handle error silently
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      child: GlassCard(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.favorite,
                  color: AppColors.neonGreen,
                  size: 32,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Mental Health Resources',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: AppColors.textSecondary),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Text(
              'If you\'re struggling with body image or mental health, help is available. '
              'These resources provide confidential support.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
            const SizedBox(height: 24),
            ..._resources.map((resource) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _buildResourceCard(context, resource),
                )),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResourceCard(BuildContext context, Map<String, dynamic> resource) {
    IconData icon;
    String actionText;
    
    if (resource['type'] == 'phone') {
      icon = Icons.phone;
      actionText = resource['phone'] ?? '';
    } else if (resource['type'] == 'sms') {
      icon = Icons.sms;
      actionText = resource['sms'] ?? '';
    } else {
      icon = Icons.open_in_new;
      actionText = 'Visit Website';
    }

    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: InkWell(
        onTap: () => _handleResourceTap(resource),
        borderRadius: BorderRadius.circular(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: AppColors.neonCyan, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    resource['name'],
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              resource['description'],
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              resource['available'],
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textTertiary,
                    fontSize: 12,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              actionText,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.neonCyan,
                    fontWeight: FontWeight.w500,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}



