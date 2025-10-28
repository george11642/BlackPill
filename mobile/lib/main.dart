import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:firebase_core/firebase_core.dart';

import 'app.dart';
import 'config/env_config.dart';
import 'core/services/deep_link_service.dart';
import 'core/services/push_notification_service.dart';
import 'core/services/analytics_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Initialize environment configuration
  await EnvConfig.load();

  // Initialize Supabase
  await Supabase.initialize(
    url: EnvConfig.supabaseUrl,
    anonKey: EnvConfig.supabaseAnonKey,
  );

  // Initialize Firebase
  await Firebase.initializeApp();

  // Initialize Sentry for error tracking
  await SentryFlutter.init(
    (options) {
      options.dsn = EnvConfig.sentryDsn;
      options.tracesSampleRate = 0.1;
      options.environment = EnvConfig.environment;
    },
    appRunner: () => runApp(
      ProviderScope(
        child: const BlackPillApp(),
        observers: [_AppLifecycleObserver()],
      ),
    ),
  );
}

/// App lifecycle observer to initialize services
class _AppLifecycleObserver extends ProviderObserver {
  @override
  void didAddProvider(
    ProviderBase provider,
    Object? value,
    ProviderContainer container,
  ) {
    // Initialize services on first provider add
    if (provider.name == 'routerProvider') {
      _initializeServices(container);
    }
  }

  Future<void> _initializeServices(ProviderContainer container) async {
    // Initialize analytics
    await container.read(analyticsServiceProvider).initialize();
    
    // Initialize push notifications
    await container.read(pushNotificationServiceProvider).initialize();
    
    // Initialize deep linking
    await container.read(deepLinkServiceProvider).initialize();
  }
}

