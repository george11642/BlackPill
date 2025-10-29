import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Environment configuration for the app
/// Values are loaded from .env file or environment variables
class EnvConfig {
  // Supabase
  static late String supabaseUrl;
  static late String supabaseAnonKey;

  // API
  static late String apiBaseUrl;

  // Stripe
  static late String stripePublishableKey;

  // PostHog
  static late String posthogApiKey;
  static late String posthogHost;

  // Sentry
  static late String sentryDsn;

  // Deep Linking
  static late String deepLinkScheme;
  static late String deepLinkHost;

  // Environment
  static String get environment => kReleaseMode ? 'production' : 'development';

  /// Load environment configuration
  static Future<void> load() async {
    try {
      // In a real app, you'd use a package like flutter_dotenv
      // For now, we'll set default values
      // You should replace these with your actual values or load from .env
      
      supabaseUrl = const String.fromEnvironment(
        'SUPABASE_URL',
        defaultValue: 'https://your-project.supabase.co',
      );
      
      supabaseAnonKey = const String.fromEnvironment(
        'SUPABASE_ANON_KEY',
        defaultValue: 'your-anon-key',
      );
      
      apiBaseUrl = const String.fromEnvironment(
        'API_BASE_URL',
        defaultValue: 'https://black-pill.app',
      );
      
      stripePublishableKey = const String.fromEnvironment(
        'STRIPE_PUBLISHABLE_KEY',
        defaultValue: 'pk_test_your_key',
      );
      
      posthogApiKey = const String.fromEnvironment(
        'POSTHOG_API_KEY',
        defaultValue: '',
      );
      
      posthogHost = const String.fromEnvironment(
        'POSTHOG_HOST',
        defaultValue: 'https://app.posthog.com',
      );
      
      sentryDsn = const String.fromEnvironment(
        'SENTRY_DSN',
        defaultValue: '',
      );
      
      deepLinkScheme = const String.fromEnvironment(
        'DEEP_LINK_SCHEME',
        defaultValue: 'blackpill',
      );
      
      deepLinkHost = const String.fromEnvironment(
        'DEEP_LINK_HOST',
        defaultValue: 'black-pill.app',
      );
    } catch (e) {
      debugPrint('Error loading environment config: $e');
      rethrow;
    }
  }
}

