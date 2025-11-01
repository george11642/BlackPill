const admin = require('firebase-admin');
const { supabaseAdmin } = require('./supabase');

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
  if (admin.apps.length > 0) {
    return; // Already initialized
  }

  try {
    // Try to use service account from environment variable (Vercel/production)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS && 
        process.env.GOOGLE_APPLICATION_CREDENTIALS.startsWith('{')) {
      const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase initialized with credentials from env var');
    } 
    // Fall back to file path (local development)
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log('Firebase initialized with credentials from file path');
    } 
    else {
      console.warn('No Firebase credentials found - push notifications disabled');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
}

/**
 * Send push notification to a user by their user ID
 * @param {string} userId - User ID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data to send with notification
 */
async function sendNotificationToUser(userId, title, body, data = {}) {
  try {
    initializeFirebase();

    // Get user's push tokens from Supabase database
    const { data: tokensData, error: tokensError } = await supabaseAdmin
      .from('user_device_tokens')
      .select('token')
      .eq('user_id', userId);

    if (tokensError) {
      console.error('Error fetching push tokens:', tokensError);
      return { success: false, error: tokensError.message };
    }

    if (!tokensData || tokensData.length === 0) {
      console.log(`No push tokens found for user ${userId}`);
      return { success: false, message: 'No tokens found' };
    }

    const tokens = tokensData.map(row => row.token);

    // Convert data object values to strings for FCM (required)
    const stringifiedData = {};
    for (const [key, value] of Object.entries(data)) {
      stringifiedData[key] = String(value);
    }

    // Send to all tokens
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...stringifiedData,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        notification: {
          sound: 'default',
          channelId: 'default_channel',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: '1',
            'content-available': 1,
          },
        },
      },
    };

    const response = await admin.messaging().sendMulticast({
      ...message,
      tokens,
    });

    console.log(`Sent notification to ${response.successCount} devices for user ${userId}`);
    
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send push notification to a specific FCM token
 * @param {string} token - FCM token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data
 */
async function sendNotificationToToken(token, title, body, data = {}) {
  try {
    initializeFirebase();

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      token,
      android: {
        notification: {
          sound: 'default',
          channelId: 'default_channel',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: '1',
            'content-available': 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);

    console.log(`Successfully sent notification to token: ${response}`);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending notification to token:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendNotificationToUser,
  sendNotificationToToken,
  initializeFirebase,
};
