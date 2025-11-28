import { supabaseServer } from '@/lib/supabase/server';
import webpush from 'web-push';

const createClient = () => supabaseServer;

// VAPID keys for web push notifications
// Public key is hardcoded (safe to expose), private key from env
const VAPID_PUBLIC_KEY = 'BBi5AO8EC-pQPs3_ZNHMubkgeGKN7yKO0q3A6NYkRFxIR_pjnSxIAT3mRuGscUrhQiPg1GwBHuxvu04jeAoHoP0';
const VAPID_PRIVATE_KEY = (process.env.VAPID_PRIVATE_KEY || '').trim();
// VAPID requires a contact email (for identification, not sending) - use RESEND_FROM_EMAIL
const VAPID_CONTACT_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@black-pill.app';

// Configure web-push with VAPID keys (lazy initialization to avoid build-time errors)
let vapidConfigured = false;
function configureVapid() {
  if (!vapidConfigured && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    try {
      webpush.setVapidDetails(
        `mailto:${VAPID_CONTACT_EMAIL}`,
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
      );
      vapidConfigured = true;
    } catch (error) {
      console.error('Failed to configure VAPID details:', error);
      throw error;
    }
  }
}

/**
 * Send web push notification using web-push library
 */
async function sendWebPushNotification(
  subscriptionJson: any,
  title: string,
  body: string,
  data?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    configureVapid();
    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon.png',
      badge: '/icon.png',
      data: data || {},
    });

    await webpush.sendNotification(subscriptionJson, payload);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending web push notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to send web push notification',
    };
  }
}

/**
 * Send push notification via Expo Push API (for mobile)
 * Uses Expo's free push notification service - no Firebase needed!
 */
async function sendExpoPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        sound: 'default',
        title,
        body,
        data: data || {},
        priority: 'default',
        channelId: 'default',
      }),
    });

    const result = await response.json();

    if (result.data && result.data.status === 'ok') {
      return { success: true };
    } else {
      return {
        success: false,
        error: result.data?.message || 'Unknown error sending notification',
      };
    }
  } catch (error: any) {
    console.error('Error sending Expo push notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to send notification',
    };
  }
}

/**
 * Send push notification to a user by their user ID
 * Automatically detects if token is Expo (mobile) or Web Push (web)
 */
export async function sendNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const supabase = await createClient();

    // Get user's push token from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('push_token, notification_preferences')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return { success: false, error: 'User not found' };
    }

    if (!profile.push_token) {
      console.log(`No push token found for user ${userId}`);
      return { success: false, message: 'No push token registered' };
    }

    // Check notification preferences
    const prefs = (profile.notification_preferences as any) || {};
    // You can add preference checks here if needed

    // Determine if this is a web push token or Expo token
    let result: { success: boolean; error?: string };
    
    if (profile.push_token.startsWith('WebPushToken[')) {
      // Web push token - extract subscription JSON
      try {
        const tokenData = profile.push_token.replace('WebPushToken[', '').replace(']', '');
        // Use Buffer for Node.js (server-side)
        const subscriptionJson = JSON.parse(Buffer.from(tokenData, 'base64').toString('utf-8'));
        result = await sendWebPushNotification(subscriptionJson, title, body, data);
      } catch (error: any) {
        result = {
          success: false,
          error: `Invalid web push token format: ${error.message}`,
        };
      }
    } else {
      // Expo token (mobile: iOS/Android or Expo web)
      result = await sendExpoPushNotification(profile.push_token, title, body, data);
    }

    if (result.success) {
      return { success: true, message: 'Notification sent successfully' };
    } else {
      return { success: false, error: result.error || 'Failed to send notification' };
    }
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Send push notification to a specific push token
 * Useful for sending to a known token without looking up user
 */
export async function sendNotificationToToken(
  token: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    // Determine if this is a web push token or Expo token
    let result: { success: boolean; error?: string };
    
    if (token.startsWith('WebPushToken[')) {
      // Web push token
      try {
        const tokenData = token.replace('WebPushToken[', '').replace(']', '');
        const subscriptionJson = JSON.parse(Buffer.from(tokenData, 'base64').toString('utf-8'));
        result = await sendWebPushNotification(subscriptionJson, title, body, data);
      } catch (error: any) {
        result = {
          success: false,
          error: `Invalid web push token format: ${error.message}`,
        };
      }
    } else {
      // Expo token
      result = await sendExpoPushNotification(token, title, body, data);
    }

    return result;
  } catch (error: any) {
    console.error('Error sending notification to token:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}
