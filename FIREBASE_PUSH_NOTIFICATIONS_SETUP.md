# Firebase Push Notifications - Setup Complete ✅

## Status: FULLY CONFIGURED

Push notifications are now implemented and ready to use!

---

## What was set up

### 1. Firebase Service Account ✅
- **File**: `backend/firebase-service-account.json`
- **Environment Variable**: `GOOGLE_APPLICATION_CREDENTIALS`
- **Location**: `backend/.env` and Vercel environment variables
- **Method**: Full JSON as environment variable (production-ready for Vercel)

### 2. Firebase Admin SDK ✅
- **Package**: `firebase-admin` (installed in backend)
- **Service**: `backend/utils/push-notification-service.js`
- **Functions**:
  - `sendNotificationToUser(userId, title, body, data)` - Send to all devices for a user
  - `sendNotificationToToken(token, title, body, data)` - Send to specific device
  - `initializeFirebase()` - Initialize Admin SDK (auto-called)

### 3. Push Notification Sending ✅
- **Endpoint**: `/api/referral/accept`
- **When**: When a referral is accepted
- **Who**: Both referrer and referee
- **Message to Referrer**: "Friend Joined! 🎉" + "+5 bonus scans"
- **Message to Referee**: "Welcome to Black Pill! 🚀" + referrer name + "+5 free scans"
- **Error Handling**: Non-blocking (referral works even if notifications fail)

---

## How it works

### Step 1: Mobile app sends FCM token
```
Mobile App
  ↓
Firebase Cloud Messaging (generates token)
  ↓
POST /api/user/push-token
  ↓
Database: user_device_tokens table
```

### Step 2: Backend sends notification
```
Referral accepted
  ↓
POST /api/referral/accept
  ↓
Backend queries user_device_tokens table
  ↓
Firebase Admin SDK sends via FCM
  ↓
Mobile app receives push notification
```

---

## Environment Configuration

### Local Development (`backend/.env`)
```bash
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
```

### Vercel (Production)
Environment variables set in Vercel dashboard:
```bash
GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account","project_id":"blackpill-13b8e",...}
```

---

## Files Created/Modified

| File | Status | Purpose |
|------|--------|---------|
| `backend/utils/push-notification-service.js` | ✅ NEW | Firebase Admin SDK integration |
| `backend/api/referral/accept.js` | ✅ UPDATED | Send notifications on referral |
| `backend/.env` | ✅ UPDATED | Firebase credentials config |
| `backend/env.example` | ✅ UPDATED | Firebase config template |
| `backend/firebase-service-account.json` | ✅ PLACED | Service account JSON |
| `backend/package.json` | ✅ UPDATED | firebase-admin added |

---

## Testing

### Local Testing
1. Ensure `backend/firebase-service-account.json` exists
2. Run backend locally: `npm run dev`
3. Accept a referral via API
4. Check console logs for: `"Sent notification to X devices for user Y"`

### Production Testing (Vercel)
1. Ensure `GOOGLE_APPLICATION_CREDENTIALS` env var is set in Vercel
2. Deploy to Vercel: `git push origin main`
3. Accept a referral in production
4. Check Vercel logs for notification status

---

## What Happens

### When referral is accepted:

1. **Database updates**
   - Referral record created
   - Both users get +5 scans
   - `referred_by` link created

2. **Notifications sent**
   - Query `user_device_tokens` table for both users
   - Send via Firebase Cloud Messaging (FCM)
   - iOS: Via Apple Push Notification service (APNs)
   - Android: Via FCM directly
   - Data payload: `{ type: 'referral_accepted', bonus_scans: 5 }`

3. **Mobile receives**
   - Foreground (app open): Shows local notification
   - Background (app closed): System push notification
   - User taps notification → Navigates to referral stats

4. **Analytics tracked**
   - Mobile app tracks: `referral_accepted`, `referral_bonus_received`
   - Backend logs: Success/failure count

---

## Monitoring

### Check notification sending
```javascript
// In logs, you'll see:
"Firebase initialized with credentials from env var"
"Sent notification to 2 devices for user <user_id>"
```

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "No Firebase credentials found" | `GOOGLE_APPLICATION_CREDENTIALS` not set | Add to `.env` or Vercel |
| "No push tokens found for user" | User hasn't enabled notifications | Mobile app needs FCM permission |
| JSON parse error | Env var not valid JSON | Copy raw JSON without line breaks |
| "403 Forbidden" | Invalid service account | Regenerate Firebase credentials |

---

## Next Steps (Optional)

### 1. Add more notification triggers
```javascript
// Payment failed
await sendNotificationToUser(userId, "Payment Failed", "Your subscription couldn't be renewed");

// Subscription renewed
await sendNotificationToUser(userId, "Subscription Renewed", "Your subscription is active!");
```

### 2. Add in-app notification for when app is open
```dart
// Flutter: Show local notification even when app is open
_showLocalNotification(title, body, data);
```

### 3. Monitor notification delivery
```javascript
// Track in analytics
if (response.failureCount > 0) {
  console.log(`${response.failureCount} notifications failed to send`);
  // Send to analytics service
}
```

---

## Files Reference

### Main Service: `backend/utils/push-notification-service.js`
- `initializeFirebase()` - Initialize Admin SDK
- `sendNotificationToUser()` - Send to all user devices
- `sendNotificationToToken()` - Send to specific device

### Updated Endpoint: `backend/api/referral/accept.js`
- Calls `sendNotificationToUser()` for both referrer and referee
- Non-blocking error handling
- 37-line notification code added

### Configuration: `backend/.env`
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to or JSON of service account

---

## Security Notes

- ✅ Service account JSON is in `.gitignore`
- ✅ Vercel env var is stored securely (not in code)
- ✅ Firebase project restricted to your app only
- ✅ Notifications only sent to authenticated users
- ✅ User's device tokens stored in database with RLS

---

## Production Checklist

- [x] Firebase service account created
- [x] `firebase-admin` installed
- [x] Push notification service implemented
- [x] Referral accept endpoint updated
- [x] Notifications non-blocking (referral works without them)
- [x] Environment variables configured
- [x] Error handling in place
- [x] Local testing ready
- [x] Vercel deployment ready

---

## Timeline

**This feature is 100% complete!** 🚀

- ✅ Backend: Push notification service created
- ✅ Mobile: Firebase already configured
- ✅ Database: Token storage already set up
- ✅ Integration: Referral endpoint sending notifications
- ✅ Error handling: Graceful fallback
- ✅ Production ready: Can deploy to Vercel now

---

**Last Updated**: December 20, 2025  
**Status**: Production Ready ✅
