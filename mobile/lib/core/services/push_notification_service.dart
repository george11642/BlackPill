import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'api_service.dart';

final pushNotificationServiceProvider = Provider<PushNotificationService>((ref) {
  return PushNotificationService(ref);
});

class PushNotificationService {
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final ProviderRef? _ref;

  PushNotificationService(this._ref);

  /// Initialize push notifications
  Future<void> initialize() async {
    // Request permission
    final settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('User granted push notification permission');
    }

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle background messages
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);

    // Get FCM token for backend
    final token = await _fcm.getToken();
    if (token != null) {
      print('FCM Token: $token');
      await _sendTokenToBackend(token);
    }

    // Listen to token refresh
    _fcm.onTokenRefresh.listen((token) async {
      print('FCM Token refreshed: $token');
      await _sendTokenToBackend(token);
    });
  }

  void _handleForegroundMessage(RemoteMessage message) {
    print('Foreground message: ${message.notification?.title}');
    print('Message data: ${message.data}');
  }

  void _handleMessageOpenedApp(RemoteMessage message) {
    print('Message opened app: ${message.notification?.title}');
  }

  Future<void> _sendTokenToBackend(String token) async {
    try {
      final supabase = Supabase.instance.client;
      final session = supabase.auth.currentSession;
      
      if (session == null) {
        print('Cannot send push token: user not authenticated');
        return;
      }

      // Get API service
      final apiService = _ref != null 
        ? _ref!.read(apiServiceProvider) 
        : ApiService();
      
      // Determine platform
      final platform = Platform.isAndroid ? 'android' : 'ios';

      // Send token to backend via API service
      await apiService.sendPushToken(token: token, platform: platform);
      
      print('Push token sent to backend successfully');
    } catch (e) {
      print('Error sending push token to backend: $e');
    }
  }
}

