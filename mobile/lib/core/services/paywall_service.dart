import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api_service.dart';

final paywallServiceProvider = Provider<PaywallService>((ref) {
  return PaywallService(ref);
});

class PaywallService {
  final Ref _ref;
  static const String _keyFirstScanCompleted = 'first_scan_completed';
  static const String _keyPaywallShown = 'paywall_shown';

  PaywallService(this._ref);

  /// Check if paywall should be shown
  Future<bool> shouldShowPaywall() async {
    try {
      // Get user profile to check scans remaining
      final apiService = _ref.read(apiServiceProvider);
      final profile = await apiService.getUserProfile();
      
      final scansRemaining = profile['scans_remaining'] as int;
      final tier = profile['tier'] as String;
      
      // Don't show for premium users
      if (tier != 'free') {
        return false;
      }
      
      // Check if first scan completed
      final prefs = await SharedPreferences.getInstance();
      final firstScanCompleted = prefs.getBool(_keyFirstScanCompleted) ?? false;
      final paywallShown = prefs.getBool(_keyPaywallShown) ?? false;
      
      // Show after first free scan is used (scans_remaining == 0)
      if (firstScanCompleted && scansRemaining == 0 && !paywallShown) {
        return true;
      }
      
      // Re-show if all scans depleted
      if (scansRemaining == 0) {
        return true;
      }
      
      return false;
    } catch (e) {
      print('Error checking paywall: $e');
      return false;
    }
  }

  /// Mark first scan as completed
  Future<void> markFirstScanCompleted() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyFirstScanCompleted, true);
  }

  /// Mark paywall as shown
  Future<void> markPaywallShown() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyPaywallShown, true);
  }

  /// Reset paywall state (for testing)
  Future<void> resetPaywallState() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyFirstScanCompleted);
    await prefs.remove(_keyPaywallShown);
  }
}


