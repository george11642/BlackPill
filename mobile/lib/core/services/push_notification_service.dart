import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../api_service.dart';

final pushNotificationServiceProvider = Provider<PushNotificationService>((ref) {
  return PushNotificationService();
});

class PushNotificationService {
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

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

    // Initialize local notifications for foreground messages
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings();
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle background messages
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);

    // Get FCM token for backend
    final token = await _fcm.getToken();
    print('FCM Token: $token');
    
    // Send token to backend to store for this user
    if (token != null) {
      await _sendTokenToBackend(token);
    }
    
    // Handle token refresh
    _fcm.onTokenRefresh.listen((newToken) {
      _sendTokenToBackend(newToken);
    });
  }

  /// Handle foreground message
  void _handleForegroundMessage(RemoteMessage message) {
    print('Foreground message: ${message.notification?.title}');

    // Show local notification
    if (message.notification != null) {
      _showLocalNotification(
        message.notification!.title ?? '',
        message.notification!.body ?? '',
        message.data,
      );
    }
  }

  /// Handle message when app is opened from notification
  void _handleMessageOpenedApp(RemoteMessage message) {
    print('Message opened app: ${message.data}');
    
    // Handle navigation based on message data
    if (message.data['type'] == 'referral_accepted') {
      // Navigate to referral stats screen
    } else if (message.data['type'] == 'subscription_renewed') {
      // Navigate to subscription screen
    }
  }

  /// Show local notification
  Future<void> _showLocalNotification(
    String title,
    String body,
    Map<String, dynamic> data,
  ) async {
    const androidDetails = AndroidNotificationDetails(
      'default_channel',
      'Default Notifications',
      channelDescription: 'General notifications from Black Pill',
      importance: Importance.high,
      priority: Priority.high,
    );

    const iosDetails = DarwinNotificationDetails();

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      details,
      payload: data.toString(),
    );
  }

  /// Handle notification tap
  void _onNotificationTapped(NotificationResponse response) {
    print('Notification tapped: ${response.payload}');
    // Handle navigation
  }

  /// Subscribe to topic
  Future<void> subscribeToTopic(String topic) async {
    await _fcm.subscribeToTopic(topic);
  }

  /// Unsubscribe from topic
  Future<void> unsubscribeFromTopic(String topic) async {
    await _fcm.unsubscribeFromTopic(topic);
  }

  /// Send FCM token to backend
  Future<void> _sendTokenToBackend(String token) async {
    try {
      final supabase = Supabase.instance.client;
      final session = supabase.auth.currentSession;
      
      if (session == null) {
        print('Cannot send push token: user not authenticated');
        return;
      }

      // Get API service
      final apiService = ApiService();
      
      // Determine platform
      final platform = _getPlatform();

      // Send token to backend via API service
      await apiService.sendPushToken(token: token, platform: platform);
      
      print('Push token sent to backend successfully');
    } catch (e) {
      print('Error sending push token to backend: $e');
      // Don't throw - this is not critical for app functionality
    }
  }

  /// Get platform identifier
  String _getPlatform() {
    if (Platform.isIOS) {
      return 'ios';
    } else if (Platform.isAndroid) {
      return 'android';
    } else {
      return 'unknown';
    }
  }
}

