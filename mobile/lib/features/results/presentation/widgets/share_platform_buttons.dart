import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/services/analytics_service.dart';
import '../../../../shared/theme/app_colors.dart';

class SharePlatformButtons extends StatelessWidget {
  final String shareUrl;
  final String message;
  final AnalyticsService analyticsService;

  const SharePlatformButtons({
    super.key,
    required this.shareUrl,
    required this.message,
    required this.analyticsService,
  });

  Future<void> _shareToWhatsApp() async {
    analyticsService.trackShareInitiated('whatsapp');
    
    final encodedMessage = Uri.encodeComponent(message);
    final whatsappUrl = 'whatsapp://send?text=$encodedMessage';
    
    if (await canLaunchUrl(Uri.parse(whatsappUrl))) {
      await launchUrl(Uri.parse(whatsappUrl));
      analyticsService.trackShareCompleted('whatsapp');
    } else {
      // Fallback to web WhatsApp
      final webUrl = 'https://wa.me/?text=$encodedMessage';
      await launchUrl(Uri.parse(webUrl), mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _shareToInstagram() async {
    analyticsService.trackShareInitiated('instagram');
    
    // Instagram doesn't support direct sharing via URL
    // Copy to clipboard and open Instagram
    await Clipboard.setData(ClipboardData(text: message));
    
    final instagramUrl = 'instagram://';
    if (await canLaunchUrl(Uri.parse(instagramUrl))) {
      await launchUrl(Uri.parse(instagramUrl));
      analyticsService.trackShareCompleted('instagram');
    }
  }

  Future<void> _shareToTikTok() async {
    analyticsService.trackShareInitiated('tiktok');
    
    // TikTok doesn't support direct sharing via URL
    // Copy to clipboard and open TikTok
    await Clipboard.setData(ClipboardData(text: message));
    
    final tiktokUrl = 'tiktok://';
    if (await canLaunchUrl(Uri.parse(tiktokUrl))) {
      await launchUrl(Uri.parse(tiktokUrl));
      analyticsService.trackShareCompleted('tiktok');
    }
  }

  Future<void> _shareToiMessage() async {
    analyticsService.trackShareInitiated('imessage');
    
    final encodedMessage = Uri.encodeComponent(message);
    final smsUrl = 'sms:&body=$encodedMessage';
    
    if (await canLaunchUrl(Uri.parse(smsUrl))) {
      await launchUrl(Uri.parse(smsUrl));
      analyticsService.trackShareCompleted('imessage');
    }
  }

  Future<void> _copyLink(BuildContext context) async {
    await Clipboard.setData(ClipboardData(text: shareUrl));
    analyticsService.trackReferralLinkCopied();
    
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Link copied to clipboard!'),
          backgroundColor: AppColors.neonGreen,
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Share on',
          style: Theme.of(context).textTheme.titleMedium,
          textAlign: TextAlign.center,
        ),
        
        const SizedBox(height: 16),
        
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _buildPlatformButton(
              context,
              'iMessage',
              Icons.message,
              AppColors.neonGreen,
              _shareToiMessage,
            ),
            _buildPlatformButton(
              context,
              'WhatsApp',
              Icons.chat,
              AppColors.neonGreen,
              _shareToWhatsApp,
            ),
            _buildPlatformButton(
              context,
              'Instagram',
              Icons.photo_camera,
              AppColors.neonPurple,
              _shareToInstagram,
            ),
            _buildPlatformButton(
              context,
              'TikTok',
              Icons.music_note,
              AppColors.neonCyan,
              _shareToTikTok,
            ),
          ],
        ),
        
        const SizedBox(height: 16),
        
        // Copy link button
        OutlinedButton.icon(
          onPressed: () => _copyLink(context),
          icon: const Icon(Icons.link),
          label: const Text('Copy Link'),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            side: const BorderSide(color: AppColors.neonCyan, width: 2),
          ),
        ),
      ],
    );
  }

  Widget _buildPlatformButton(
    BuildContext context,
    String label,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return Column(
      children: [
        GestureDetector(
          onTap: onTap,
          child: Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              shape: BoxShape.circle,
              border: Border.all(color: color, width: 2),
            ),
            child: Icon(icon, color: color, size: 28),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}


