import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:app_links/app_links.dart';
import 'dart:async';

import '../../config/env_config.dart';
import 'analytics_service.dart';
import 'api_service.dart';

final deepLinkServiceProvider = Provider<DeepLinkService>((ref) {
  return DeepLinkService(ref);
});

class DeepLinkService {
  final ProviderRef ref;
  final AppLinks _appLinks = AppLinks();
  StreamSubscription<Uri>? _linkSubscription;
  BuildContext? _appContext;

  DeepLinkService(this.ref);

  /// Set app context for dialogs
  void setAppContext(BuildContext context) {
    _appContext = context;
  }

  /// Initialize deep link handling
  Future<void> initialize() async {
    // Handle link when app is opened from background
    _linkSubscription = _appLinks.uriLinkStream.listen((uri) {
      if (_appContext != null) {
        _handleDeepLink(uri.toString(), _appContext!);
      }
    });
  }

  /// Handle deep link
  void _handleDeepLink(String link, BuildContext context) {
    print('Deep link received: $link');

    // Handle OAuth callback: blackpill://auth/callback
    // Supabase handles this automatically, but we log it for debugging
    if (link.contains('auth/callback')) {
      print('OAuth callback received - Supabase will handle authentication automatically');
      // Supabase OAuth flow handles this via auth state listener in app.dart
      return;
    }
    // Handle subscription success: blackpill://subscribe/success?session_id=xxx
    else if (link.contains('subscribe/success')) {
      _handleSubscriptionSuccess(link, context);
    }
    // Handle referral links: blackpill://ref/INVITE-XXXX-YYYY or https://black-pill.app/ref/INVITE-XXXX-YYYY
    else if (link.contains('/ref/') || link.contains('blackpill://ref/')) {
      _handleReferralCode(link, context);
    }
    else {
      _showErrorDialog(context, 'Invalid Link', 'The link you opened could not be processed.');
    }
  }

  /// Handle subscription success callback
  Future<void> _handleSubscriptionSuccess(String link, BuildContext context) async {
    try {
      // Extract session ID from URL
      final uri = Uri.parse(link);
      final sessionId = uri.queryParameters['session_id'];

      if (sessionId == null) {
        _showErrorDialog(context, 'Invalid Link', 'Session ID is missing from the subscription link.');
        return;
      }

      // Show loading dialog
      _showLoadingDialog(context, 'Confirming your subscription...');

      // Poll subscription status (wait for webhook to process)
      bool subscriptionConfirmed = false;
      int attempts = 0;
      const maxAttempts = 20; // Increased from 10 to 20 for 40 seconds total
      const delaySeconds = 2;

      while (!subscriptionConfirmed && attempts < maxAttempts) {
        try {
          final apiService = ref.read(apiServiceProvider);
          final status = await apiService.getSubscriptionStatus();

          if (status['status'] == 'active') {
            subscriptionConfirmed = true;
            
            // Close loading dialog and show success
            if (context.mounted) {
              Navigator.of(context).pop();
              _showSuccessDialog(
                context,
                'Subscription Active! 🎉',
                'Your subscription is now active. You have unlimited access to all features!',
                () {
                  Navigator.of(context).pop();
                  // Navigate to home screen
                  Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false);
                },
              );
            }
          }
        } catch (e) {
          print('Error checking subscription status: $e');
        }

        if (!subscriptionConfirmed) {
          attempts++;
          if (attempts < maxAttempts) {
            await Future.delayed(Duration(seconds: delaySeconds));
          }
        }
      }

      if (!subscriptionConfirmed) {
        if (context.mounted) {
          Navigator.of(context).pop(); // Close loading dialog
          _showErrorDialog(
            context,
            'Subscription Confirmation Timeout',
            'Your subscription is being processed. Please check your subscription status in Settings.',
            showRetry: true,
            onRetry: () {
              Navigator.of(context).pop();
              _handleSubscriptionSuccess(link, context);
            },
          );
        }
      }
    } catch (error) {
      if (context.mounted) {
        Navigator.of(context).pop(); // Close loading dialog if open
        _showErrorDialog(
          context,
          'Subscription Error',
          'An error occurred while confirming your subscription: $error',
          showRetry: true,
          onRetry: () {
            Navigator.of(context).pop();
            _handleSubscriptionSuccess(link, context);
          },
        );
      }
    }
  }

  /// Handle referral code acceptance
  Future<void> _handleReferralCode(String link, BuildContext context) async {
    try {
      // Extract referral code from URL
      String? referralCode;
      
      if (link.contains('black-pill.app/ref/')) {
        final parts = link.split('/ref/');
        if (parts.length == 2) {
          referralCode = parts[1].split('?').first;
        }
      } else if (link.contains('blackpill://ref/')) {
        final parts = link.split('blackpill://ref/');
        if (parts.length == 2) {
          referralCode = parts[1];
        }
      }

      if (referralCode == null || referralCode.isEmpty) {
        _showErrorDialog(
          context,
          'Invalid Referral Link',
          'The referral link is not valid. Please check and try again.',
        );
        return;
      }

      // Track referral code entered
      ref.read(analyticsServiceProvider).trackReferralCodeEntered();
      
      // Show loading dialog
      _showLoadingDialog(context, 'Processing your referral...');

      final apiService = ref.read(apiServiceProvider);
      final result = await apiService.acceptReferral(referralCode);
      
      // Close loading dialog
      if (context.mounted) {
        Navigator.of(context).pop();
        
        // Track successful acceptance and bonus received
        ref.read(analyticsServiceProvider).trackReferralAccepted();
        ref.read(analyticsServiceProvider).trackReferralBonusReceived();

        // Show success notification/dialog
        _showSuccessDialog(
          context,
          '${result['referrer_name']} Invited You! 🎁',
          result['message'] ?? 'You received ${result['bonus_scans'] ?? 5} bonus scans!',
          () {
            Navigator.of(context).pop();
            // Navigate to referral stats screen
            Navigator.of(context).pushNamed('/referral-stats');
          },
        );
      }
    } catch (e) {
      if (context.mounted) {
        Navigator.of(context).pop(); // Close loading dialog if open
        
        String errorMessage = 'Failed to process referral. ';
        if (e.toString().contains('already used')) {
          errorMessage += 'You have already used a referral code.';
        } else if (e.toString().contains('own referral')) {
          errorMessage += 'You cannot use your own referral code.';
        } else if (e.toString().contains('not found')) {
          errorMessage += 'This referral code is not valid.';
        } else {
          errorMessage += 'Please try again.';
        }

        _showErrorDialog(
          context,
          'Referral Error',
          errorMessage,
          showRetry: true,
          onRetry: () {
            Navigator.of(context).pop();
            _handleReferralCode(link, context);
          },
        );
      }
    }
  }

  /// Show success dialog
  void _showSuccessDialog(
    BuildContext context,
    String title,
    String message,
    VoidCallback onPressed,
  ) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: Color(0xFF1A1A2E),
        title: Text(
          title,
          style: TextStyle(color: Color(0xFFFF0080), fontWeight: FontWeight.bold),
        ),
        content: Text(
          message,
          style: TextStyle(color: Color(0xFFB8BACC)),
        ),
        actions: [
          TextButton(
            onPressed: onPressed,
            child: Text(
              'Continue',
              style: TextStyle(color: Color(0xFF00D9FF), fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  /// Show error dialog
  void _showErrorDialog(
    BuildContext context,
    String title,
    String message, {
    bool showRetry = false,
    VoidCallback? onRetry,
  }) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: Color(0xFF1A1A2E),
        title: Text(
          title,
          style: TextStyle(color: Color(0xFFFFFF00), fontWeight: FontWeight.bold),
        ),
        content: Text(
          message,
          style: TextStyle(color: Color(0xFFB8BACC)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(
              'Dismiss',
              style: TextStyle(color: Color(0xFF6B6D7F)),
            ),
          ),
          if (showRetry && onRetry != null)
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                onRetry();
              },
              child: Text(
                'Retry',
                style: TextStyle(color: Color(0xFF00D9FF), fontWeight: FontWeight.bold),
              ),
            ),
        ],
      ),
    );
  }

  /// Show loading dialog
  void _showLoadingDialog(BuildContext context, String message) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: Color(0xFF1A1A2E),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFF0080)),
            ),
            SizedBox(height: 16),
            Text(
              message,
              style: TextStyle(color: Color(0xFFB8BACC)),
            ),
          ],
        ),
      ),
    );
  }

  /// Dispose
  void dispose() {
    _linkSubscription?.cancel();
  }
}

