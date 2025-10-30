import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'config/router.dart';
import 'shared/theme/app_theme.dart';
import 'core/services/deep_link_service.dart';

class BlackPillApp extends ConsumerWidget {
  const BlackPillApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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

