# External Integrations

## Database: Supabase PostgreSQL

### Connection
- **URL**: `SUPABASE_URL` env variable
- **Client**: `@supabase/supabase-js` v2.83.0
- **Project**: wzsxpxwwgaqiaoxdyhnf.supabase.co

### Key Tables (25+ migrations)
| Table | Purpose |
|-------|---------|
| users | Extended auth.users with tiers, scans |
| analyses | Face analysis results |
| subscriptions | Stripe subscription data |
| routines | Custom routines with tasks |
| goals | User goals with tracking |
| challenges | Community challenges |
| achievements | User achievement unlocks |
| ai_coach_conversations | Chat history |
| ai_coach_messages | Individual messages |
| products | Marketplace products |
| referrals | Affiliate tracking |
| timelapses | Generated videos |

### Storage Buckets
- `analyses` - Private analysis photos (signed URLs)
- `challenge-photos` - Challenge proof images

### Row Level Security
- All tables have RLS policies
- User-scoped access via `auth.uid()`

## Authentication: Supabase Auth

### Methods
- Email/Password
- Apple OAuth (`expo-apple-authentication`)
- Google OAuth

### Session Storage
- **Native**: `expo-secure-store` (encrypted)
- **Web**: `localStorage`

### Configuration
```typescript
export const supabase = createClient(url, key, {
  auth: {
    storage: isWeb ? localStorageAdapter : secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
  }
});
```

## Payments: Stripe (Web)

### Configuration
| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Server-side API |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification |

### API Version
- `2023-10-16`

### Operations (Edge Function)
- `create-checkout` - Create checkout session
- `cancel` - Cancel subscription
- `status` - Check subscription status
- Webhook handling for events

## Payments: RevenueCat (Mobile)

### SDK
- `react-native-purchases` v8.2.0

### Configuration
- **Project ID**: `2943af5e`
- **Bundle ID**: `com.blackpill.blackpill`

### Products
| Product ID | Price |
|------------|-------|
| `pro_monthly` | $12.99/mo |
| `pro_yearly` | $119.99/yr |
| `elite_monthly` | $19.99/mo |
| `elite_yearly` | $199.99/yr |

### Webhook
- Endpoint: `/functions/v1/webhooks?provider=revenuecat`

## AI: OpenAI

### SDK Versions
- Web: `openai` v6.9.1
- Edge Functions: `openai@4.20.1` (Deno)

### Model
- Default: `gpt-4o`
- Configurable via `OPENAI_MODEL` env var

### Operations (Edge Function: `/functions/v1/ai`)
| Action | Purpose |
|--------|---------|
| `analyze` | Face analysis with Vision API |
| `coach` | AI chat conversations |
| `recommend` | Product recommendations |
| `insights` | User insights generation |
| `routines` | Routine suggestions |
| `transform` | Image transformations |

### Analysis Categories
- Symmetry, jawline, eyes, lips, skin, bone structure, hair

## Email: Resend

### SDK
- `resend` v6.5.0

### Configuration
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` (noreply@black-pill.app)

### Use Cases
- Welcome emails
- Subscription confirmations
- Password reset
- Notification digests

## Push Notifications

### Web
- `web-push` v3.6.7
- VAPID keys for authentication
- Tokens stored in `push_notification_tokens`

### Mobile
- `expo-notifications`
- Expo push service

## Rate Limiting: Upstash Redis

### SDKs
- `@upstash/ratelimit` v2.0.7
- `@upstash/redis` v1.35.7
- `ioredis` v5.8.2

### Configuration
- `REDIS_URL` (TLS required)

### Use Cases
- API rate limiting
- Abuse prevention

## Image CDN: Cloudinary

### SDK
- `cloudinary` v2.8.0

### Use Cases
- Image transformations
- CDN delivery
- Optimization

## Media Processing: FFmpeg

### SDK
- `@ffmpeg/ffmpeg` v0.12.15

### Use Cases
- Timelapse video generation
- Video encoding

## Error Tracking: Sentry

### SDK
- `@sentry/react-native` v7.2.0

### Platform
- Mobile only

## Edge Functions Summary

| Function | Purpose | External APIs |
|----------|---------|---------------|
| `/ai` | AI operations | OpenAI |
| `/stripe` | Payment processing | Stripe |
| `/affiliate` | Referral tracking | - |
| `/webhooks` | Webhook handlers | Stripe, RevenueCat |
| `/cron` | Scheduled jobs | - |
| `/admin` | Admin operations | - |
| `/share` | Social sharing | - |
| `/timelapse` | Video generation | - |

## Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `daily-morning` | 08:00 | Routine reminders |
| `daily-evening` | 20:00 | Evening reminders |
| `check-renewals` | 00:00 | Subscription reminders |
| `recalculate-leaderboard` | Sunday 00:00 | Weekly rankings |
| `generate-insights` | Weekly | AI insights |
| `goal-reminders` | Daily | Goal deadlines |

## Environment Variables

### Mobile
```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_APP_URL
EXPO_PUBLIC_REVENUECAT_PROJECT_ID
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID
```

### Web
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
OPENAI_API_KEY
RESEND_API_KEY
VAPID_PRIVATE_KEY
REDIS_URL
```
