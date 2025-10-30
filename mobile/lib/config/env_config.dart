import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

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

  // Deep Linking
  static late String deepLinkScheme;
  static late String deepLinkHost;

  // Environment
  static String get environment => kReleaseMode ? 'production' : 'development';

  /// Load environment configuration
  static Future<void> load() async {
    try {
      // Load .env file using flutter_dotenv
      await dotenv.load(fileName: ".env");
      
      // Get values from .env file or use defaults
      supabaseUrl = dotenv.env['SUPABASE_URL'] ?? 'https://your-project.supabase.co';
      supabaseAnonKey = dotenv.env['SUPABASE_ANON_KEY'] ?? 'your-anon-key';
      
      apiBaseUrl = dotenv.env['API_BASE_URL'] ?? 'https://black-pill.app';
      
      stripePublishableKey = dotenv.env['STRIPE_PUBLISHABLE_KEY'] ?? 'pk_test_your_key';
      
      posthogApiKey = dotenv.env['POSTHOG_API_KEY'] ?? '';
      posthogHost = dotenv.env['POSTHOG_HOST'] ?? 'https://app.posthog.com';
      
      deepLinkScheme = dotenv.env['DEEP_LINK_SCHEME'] ?? 'blackpill';
      deepLinkHost = dotenv.env['DEEP_LINK_HOST'] ?? 'black-pill.app';
      
      print('✅ Environment loaded: $supabaseUrl');
    } catch (e) {
      print('⚠️ Error loading .env: $e');
      // Use String.fromEnvironment as fallback
      supabaseUrl = const String.fromEnvironment('SUPABASE_URL', defaultValue: 'https://your-project.supabase.co');
      supabaseAnonKey = const String.fromEnvironment('SUPABASE_ANON_KEY', defaultValue: 'your-anon-key');
      apiBaseUrl = const String.fromEnvironment('API_BASE_URL', defaultValue: 'https://black-pill.app');
      stripePublishableKey = const String.fromEnvironment('STRIPE_PUBLISHABLE_KEY', defaultValue: 'pk_test_your_key');
      posthogApiKey = const String.fromEnvironment('POSTHOG_API_KEY', defaultValue: '');
      posthogHost = const String.fromEnvironment('POSTHOG_HOST', defaultValue: 'https://app.posthog.com');
      deepLinkScheme = const String.fromEnvironment('DEEP_LINK_SCHEME', defaultValue: 'blackpill');
      deepLinkHost = const String.fromEnvironment('DEEP_LINK_HOST', defaultValue: 'black-pill.app');
    }
  }
}

