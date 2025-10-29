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

    // Handle referral links: blackpill://ref/INVITE-XXXX-YYYY
    // or https://black-pill.app/ref/INVITE-XXXX-YYYY
    if (uri.pathSegments.isNotEmpty && uri.pathSegments[0] == 'ref') {
      if (uri.pathSegments.length > 1) {
        final referralCode = uri.pathSegments[1];
        _handleReferralCode(referralCode);
      }
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

