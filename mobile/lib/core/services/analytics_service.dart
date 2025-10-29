import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:posthog_flutter/posthog_flutter.dart';

import '../../config/env_config.dart';

final analyticsServiceProvider = Provider<AnalyticsService>((ref) {
  return AnalyticsService();
});

class AnalyticsService {
  late final Posthog _posthog;

  AnalyticsService() {
    _posthog = Posthog();
  }

  Future<void> initialize() async {
    if (EnvConfig.posthogApiKey.isEmpty) return;
    
    await _posthog.setup(
      EnvConfig.posthogApiKey,
      host: EnvConfig.posthogHost,
    );
  }

  void identifyUser(String userId, {Map<String, dynamic>? properties}) {
    _posthog.identify(
      userId: userId,
      userProperties: properties,
    );
  }

  void track(String event, {Map<String, dynamic>? properties}) {
    _posthog.capture(
      eventName: event,
      properties: properties,
    );
  }

  // Onboarding events
  void trackOnboardingStarted() {
    track('onboarding_started');
  }

  void trackOnboardingStepCompleted(String step) {
    track('onboarding_step_completed', properties: {'step': step});
  }

  void trackOnboardingCompleted() {
    track('onboarding_completed');
  }

  // Auth events
  void trackSignupEmailStarted() {
    track('signup_email_started');
  }

  void trackSignupEmailCompleted() {
    track('signup_email_completed');
  }

  void trackSignupGoogleStarted() {
    track('signup_google_started');
  }

  void trackSignupGoogleCompleted() {
    track('signup_google_completed');
  }

  void trackLoginSuccess() {
    track('login_success');
  }

  void trackLoginFailed(String reason) {
    track('login_failed', properties: {'reason': reason});
  }

  void trackAgeVerificationFailed() {
    track('age_verification_failed');
  }

  // Analysis events
  void trackCameraOpened() {
    track('camera_opened');
  }

  void trackPhotoUploaded() {
    track('photo_uploaded');
  }

  void trackAnalysisStarted() {
    track('analysis_started');
  }

  void trackAnalysisCompleted({
    required double score,
    required int durationMs,
  }) {
    track('analysis_completed', properties: {
      'score': score,
      'duration': durationMs,
    });
  }

  void trackAnalysisFailed(String reason) {
    track('analysis_failed', properties: {'reason': reason});
  }

  // Results events
  void trackResultsViewed() {
    track('results_viewed');
  }

  void trackBreakdownExpanded(String category) {
    track('breakdown_expanded', properties: {'category': category});
  }

  void trackTipsViewed() {
    track('tips_viewed');
  }

  // Sharing events
  void trackShareCardViewed() {
    track('share_card_viewed');
  }

  void trackShareInitiated(String platform) {
    track('share_initiated', properties: {'platform': platform});
  }

  void trackShareCompleted(String platform) {
    track('share_completed', properties: {'platform': platform});
  }

  void trackReferralLinkCopied() {
    track('referral_link_copied');
  }

  // Referral events
  void trackReferralCodeEntered() {
    track('referral_code_entered');
  }

  void trackReferralAccepted() {
    track('referral_accepted');
  }

  void trackReferralBonusReceived() {
    track('referral_bonus_received');
  }

  // Subscription events
  void trackPaywallViewed() {
    track('paywall_viewed');
  }

  void trackTierSelected(String tier) {
    track('tier_selected', properties: {'tier': tier});
  }

  void trackCheckoutStarted() {
    track('checkout_started');
  }

  void trackPaymentSuccess({
    required String tier,
    required double amount,
  }) {
    track('payment_success', properties: {
      'tier': tier,
      'amount': amount,
    });
  }

  void trackPaymentFailed(String reason) {
    track('payment_failed', properties: {'reason': reason});
  }

  void trackSubscriptionCanceled() {
    track('subscription_canceled');
  }

  void trackSubscriptionSuccess() {
    track('subscription_success');
  }

  void trackSubscriptionActivated(String tier) {
    track('subscription_activated', properties: {'tier': tier});
  }

  // Community events
  void trackLeaderboardViewed() {
    track('leaderboard_viewed');
  }

  void trackProfileViewed(String userId) {
    track('profile_viewed', properties: {'user_id': userId});
  }

  void trackCommentPosted() {
    track('comment_posted');
  }

  void trackAchievementUnlocked(String badge) {
    track('achievement_unlocked', properties: {'badge': badge});
  }

  // Creator events
  void trackCreatorApplied() {
    track('creator_applied');
  }

  void trackAffiliateLinkClicked(String creatorId) {
    track('affiliate_link_clicked', properties: {'creator_id': creatorId});
  }

  void trackCouponApplied(String code) {
    track('coupon_applied', properties: {'code': code});
  }
}

