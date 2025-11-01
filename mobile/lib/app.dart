import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'config/router.dart';
import 'shared/theme/app_theme.dart';
import 'core/services/deep_link_service.dart';
import 'core/services/auth_service.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class BlackPillApp extends ConsumerStatefulWidget {
  const BlackPillApp({super.key});

  @override
  ConsumerState<BlackPillApp> createState() => _BlackPillAppState();
}

class _BlackPillAppState extends ConsumerState<BlackPillApp> {
  @override
  void initState() {
    super.initState();
    
    // Listen for auth state changes to handle OAuth callbacks
    // This ensures user profiles are created when OAuth completes
    Supabase.instance.client.auth.onAuthStateChange.listen((data) {
      final event = data.event;
      final session = data.session;
      
      if (event == AuthChangeEvent.signedIn && session?.user != null) {
        // Handle OAuth callback - create profile if needed
        WidgetsBinding.instance.addPostFrameCallback((_) async {
          final authService = ref.read(authServiceProvider);
          try {
            // Check if profile exists, create if not
            await authService.createUserProfileIfNeeded(session!.user!);
          } catch (e) {
            print('Error handling OAuth callback: $e');
          }
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);
    
    // Set app context for deep links
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(deepLinkServiceProvider).setAppContext(context);
    });

    return MaterialApp.router(
      title: 'Black Pill',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      routerConfig: router,
    );
  }
}

