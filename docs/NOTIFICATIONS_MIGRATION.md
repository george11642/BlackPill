# Push Notifications Migration: Firebase → Expo Push API

## Overview

BlackPill has been migrated from Firebase Cloud Messaging (FCM) to Expo Push Notifications API, matching SmileScore's implementation. This eliminates the need for Firebase entirely.

## Benefits

1. **No Firebase Required** - Expo Push API is free and works natively with Expo/React Native
2. **Simpler Setup** - No service account JSON files or Firebase project configuration
3. **Better Integration** - Works seamlessly with Expo's notification system
4. **Web Support** - Uses web-push library with VAPID keys for web notifications
5. **Cost Effective** - Expo Push API is free for reasonable usage

## How It Works

### Mobile (iOS/Android)

1. **Client Side**: Uses `expo-notifications` to register for push tokens
2. **Token Storage**: Tokens are stored in `profiles.push_token` in Supabase
3. **Server Side**: Sends notifications via Expo Push API (`https://exp.host/--/api/v2/push/send`)

### Web

1. **Client Side**: Uses native browser Push API with VAPID keys
2. **Token Storage**: Web push subscriptions stored as `WebPushToken[...]` format in `profiles.push_token`
3. **Server Side**: Uses `web-push` library with VAPID keys to send notifications

## Implementation Details

### Mobile Token Registration

```typescript
// mobile/lib/notifications/pushToken.ts
import * as Notifications from 'expo-notifications';

const tokenData = await Notifications.getExpoPushTokenAsync({
  projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
});
// Token format: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
```

### Web Token Registration

```typescript
// Uses native browser Push API
// Subscription stored as: WebPushToken[base64-encoded-json]
```

### Sending Notifications

```typescript
// web/lib/notifications/push.ts
import { sendNotificationToUser } from '@/lib/notifications/push';

await sendNotificationToUser(userId, 'Title', 'Body', { type: 'task_reminder' });
```

The function automatically detects:
- Expo tokens (mobile) → Uses Expo Push API
- WebPushToken format → Uses web-push library

## Environment Variables

### Removed
- `FIREBASE_SERVICE_ACCOUNT` - No longer needed
- `GOOGLE_APPLICATION_CREDENTIALS` - No longer needed

### Added (for Web Push)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Public VAPID key for web push
- `VAPID_PRIVATE_KEY` - Private VAPID key for web push

### Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

## Database Schema

Push tokens are stored in `profiles.push_token`:
- Expo tokens: `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`
- Web tokens: `WebPushToken[base64-encoded-subscription-json]`

## Migration Checklist

- [x] Replace Firebase Admin SDK with Expo Push API
- [x] Update `web/lib/notifications/push.ts`
- [x] Update `web/app/api/user/push-token/route.ts` to use `profiles.push_token`
- [x] Remove `firebase-admin` from `package.json`
- [x] Remove `firebase-service-account.json` file
- [x] Update environment variable documentation
- [x] Update `.gitignore` to remove Firebase references

## Testing

1. **Mobile**: Register push token and send test notification
2. **Web**: Register web push subscription and send test notification
3. **Verify**: Check that notifications arrive on both platforms

## References

- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [SmileScore Implementation](./MIGRATION_GUIDE.md)

