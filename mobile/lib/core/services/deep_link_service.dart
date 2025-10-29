import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uni_links/uni_links.dart';
import 'package:app_links/app_links.dart';
import 'dart:async';

import '../../config/env_config.dart';
import 'api_service.dart';
import 'analytics_service.dart';

final deepLinkServiceProvider = Provider<DeepLinkService>((ref) {
  return DeepLinkService(ref);
});

class DeepLinkService {
  final Ref _ref;
  final _appLinks = AppLinks();
  StreamSubscription? _linkSubscription;

  DeepLinkService(this._ref);

  /// Initialize deep link handling
  Future<void> initialize() async {
    // Handle links when app is already running
    _linkSubscription = _appLinks.uriLinkStream.listen(
      _handleDeepLink,
      onError: (err) {
        print('Deep link error: $err');
      },
    );

    // Handle initial link when app is launched from link
    try {
      final initialUri = await _appLinks.getInitialAppLink();
      if (initialUri != null) {
        _handleDeepLink(initialUri);
      }
    } catch (e) {
      print('Failed to get initial link: $e');
    }
  }

  /// Handle deep link
  void _handleDeepLink(Uri uri) {
    print('Received deep link: $uri');

    // Handle subscription success: blackpill://subscribe/success?session_id=xxx
    if (uri.pathSegments.isNotEmpty && uri.pathSegments[0] == 'subscribe') {
      if (uri.pathSegments.length > 1 && uri.pathSegments[1] == 'success') {
        final sessionId = uri.queryParameters['session_id'];
        if (sessionId != null) {
          _handleSubscriptionSuccess(sessionId);
        }
      }
      return;
    }

    // Handle referral links: blackpill://ref/INVITE-XXXX-YYYY
    // or https://black-pill.app/ref/INVITE-XXXX-YYYY
    if (uri.pathSegments.isNotEmpty && uri.pathSegments[0] == 'ref') {
      if (uri.pathSegments.length > 1) {
        final referralCode = uri.pathSegments[1];
        _handleReferralCode(referralCode);
      }
    }
  }

  /// Handle subscription success
  Future<void> _handleSubscriptionSuccess(String sessionId) async {
    try {
      print('Handling subscription success for session: $sessionId');
      
      // Track subscription success
      _ref.read(analyticsServiceProvider).trackSubscriptionSuccess();
      
      final apiService = _ref.read(apiServiceProvider);
      
      // Poll subscription status until it's active
      // This ensures the webhook has processed the subscription
      bool subscriptionActive = false;
      int pollAttempts = 0;
      const maxPollAttempts = 10;
      const pollInterval = Duration(seconds: 2);
      
      while (!subscriptionActive && pollAttempts < maxPollAttempts) {
        await Future.delayed(pollInterval);
        pollAttempts++;
        
        try {
          final status = await apiService.getSubscriptionStatus();
          final tier = status['tier'] as String?;
          final isActive = tier != null && tier != 'free';
          
          if (isActive) {
            subscriptionActive = true;
            print('Subscription is now active: $tier');
            
            // Track successful subscription activation
            _ref.read(analyticsServiceProvider).trackSubscriptionActivated(tier!);
            
            // TODO: Navigate to subscription success screen or show success message
            // This should trigger a UI update to show premium features are unlocked
            break;
          }
        } catch (e) {
          print('Error polling subscription status: $e');
          // Continue polling
        }
      }
      
      if (!subscriptionActive) {
        print('Subscription not activated after $maxPollAttempts attempts');
        // TODO: Show error message or retry option
      }
      
    } catch (e) {
      print('Failed to handle subscription success: $e');
      // TODO: Show error message to user
    }
  }

  /// Handle referral code acceptance
  Future<void> _handleReferralCode(String code) async {
    try {
      // Track referral code entered
      _ref.read(analyticsServiceProvider).trackReferralCodeEntered();
      
      final apiService = _ref.read(apiServiceProvider);
      final result = await apiService.acceptReferral(code);
      
      // Track successful acceptance and bonus received
      _ref.read(analyticsServiceProvider).trackReferralAccepted();
      _ref.read(analyticsServiceProvider).trackReferralBonusReceived();
      
      // TODO: Show notification/dialog to user about bonus scans
      print('Referral accepted: ${result['message']}');
      
    } catch (e) {
      print('Failed to accept referral: $e');
    }
  }

  /// Dispose
  void dispose() {
    _linkSubscription?.cancel();
  }
}

