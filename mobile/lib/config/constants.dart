/// App-wide constants
class AppConstants {
  // App Info
  static const String appName = 'Black Pill';
  static const String appTagline = 'Be Honest About Yourself';
  
  // Analysis
  static const int minImageSize = 640;
  static const int maxImageSizeMB = 2;
  static const double minFaceOccupancy = 0.4;
  static const double maxFaceOccupancy = 0.6;
  static const int jpegQuality = 85;
  
  // Scoring
  static const double minScore = 1.0;
  static const double maxScore = 10.0;
  static const double confettiThreshold = 7.5;
  
  // Subscriptions
  static const int freeScans = 1;
  static const int basicScansPerMonth = 5;
  static const int proScansPerMonth = 20;
  static const int referralBonusScans = 5;
  
  // Pricing
  static const double basicMonthlyPrice = 4.99;
  static const double basicAnnualPrice = 54.99;
  static const double proMonthlyPrice = 9.99;
  static const double proAnnualPrice = 109.89;
  static const double unlimitedMonthlyPrice = 19.99;
  static const double unlimitedAnnualPrice = 219.89;
  
  // Referral
  static const String referralCodePrefix = 'INVITE';
  static const int maxReferralsPerMonth = 50;
  static const int maxReferralsPerDevice = 1;
  static const int referralDeviceWindowDays = 30;
  
  // Rate Limiting
  static const int authRateLimit = 5;
  static const int authRateLimitWindowMinutes = 15;
  static const int analysisFreeRateLimit = 5;
  static const int analysisPremiumRateLimit = 20;
  static const int analysisRateLimitWindowMinutes = 10;
  
  // Cache Duration
  static const Duration profileCacheDuration = Duration(hours: 1);
  static const Duration analysisCacheDuration = Duration(minutes: 5);
  static const Duration leaderboardCacheDuration = Duration(minutes: 30);
  
  // Animation Durations
  static const Duration fastAnimation = Duration(milliseconds: 200);
  static const Duration normalAnimation = Duration(milliseconds: 300);
  static const Duration slowAnimation = Duration(milliseconds: 500);
  static const Duration confettiAnimation = Duration(milliseconds: 800);
  
  // Image Generation
  static const int shareCardWidth = 1080;
  static const int shareCardHeight = 1920;
  static const int qrCodeSize = 120;
  
  // Retry Configuration
  static const int maxRetries = 3;
  static const Duration retryDelay = Duration(seconds: 1);
  
  // Support
  static const String supportEmail = 'support@blackpill.app';
  static const String privacyPolicyUrl = 'https://blackpill.app/privacy';
  static const String termsOfServiceUrl = 'https://blackpill.app/terms';
}

/// Subscription tier enum
enum SubscriptionTier {
  free,
  basic,
  pro,
  unlimited;

  String get displayName {
    switch (this) {
      case SubscriptionTier.free:
        return 'Free';
      case SubscriptionTier.basic:
        return 'Basic';
      case SubscriptionTier.pro:
        return 'Pro';
      case SubscriptionTier.unlimited:
        return 'Unlimited';
    }
  }
  
  int get scansPerMonth {
    switch (this) {
      case SubscriptionTier.free:
        return AppConstants.freeScans;
      case SubscriptionTier.basic:
        return AppConstants.basicScansPerMonth;
      case SubscriptionTier.pro:
        return AppConstants.proScansPerMonth;
      case SubscriptionTier.unlimited:
        return -1; // Unlimited
    }
  }
}

/// Analysis breakdown categories
enum BreakdownCategory {
  symmetry,
  jawline,
  eyes,
  lips,
  skin,
  boneStructure;

  String get displayName {
    switch (this) {
      case BreakdownCategory.symmetry:
        return 'Symmetry';
      case BreakdownCategory.jawline:
        return 'Jawline';
      case BreakdownCategory.eyes:
        return 'Eyes';
      case BreakdownCategory.lips:
        return 'Lips';
      case BreakdownCategory.skin:
        return 'Skin Quality';
      case BreakdownCategory.boneStructure:
        return 'Bone Structure';
    }
  }
}

