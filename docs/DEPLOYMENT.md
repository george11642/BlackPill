# Deployment Guide

Complete deployment guide for Black Pill application.

## Prerequisites

- Vercel account
- Supabase account
- Stripe account
- Google Cloud Platform account (for Vision API)
- OpenAI account
- Upstash account (for Redis)
- Firebase account (for push notifications)

## 1. Supabase Setup

### Create Project

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Wait for project to be ready (~2 minutes)

### Run Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Or run migrations manually in SQL editor:
# Copy and paste contents of supabase/migrations/*.sql
```

### Configure Storage

1. Go to Storage section
2. Verify `analyses` bucket was created
3. Check policies are in place

### Get Credentials

1. Go to Settings → API
2. Copy:
   - Project URL
   - Anon (public) key
   - Service role key (keep secret!)

## 2. Google Cloud Platform Setup

### Create Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project

### Enable Vision API

1. Go to APIs & Services → Library
2. Search for "Cloud Vision API"
3. Click Enable

### Create Service Account

1. Go to IAM & Admin → Service Accounts
2. Create Service Account
3. Grant role: "Cloud Vision AI User"
4. Create key (JSON)
5. Download and save securely

## 3. Stripe Setup

### Create Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Activate account

### Create Products & Prices

Create products for each tier:

**Basic**
- Monthly: $4.99/month
- Annual: $54.99/year

**Pro**
- Monthly: $9.99/month
- Annual: $109.89/year

**Unlimited**
- Monthly: $19.99/month
- Annual: $219.89/year

Copy the Price IDs for each.

### Configure Webhook

1. Go to Developers → Webhooks
2. Add endpoint: `https://api.black-pill.app/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy webhook signing secret

## 4. Backend Deployment (Vercel)

### Setup Environment Variables

In Vercel dashboard:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-5-mini

GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json

STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
STRIPE_PRICE_BASIC_MONTHLY=price_xxx
STRIPE_PRICE_BASIC_ANNUAL=price_xxx
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_ANNUAL=price_xxx
STRIPE_PRICE_UNLIMITED_MONTHLY=price_xxx
STRIPE_PRICE_UNLIMITED_ANNUAL=price_xxx

REDIS_URL=redis://default:xxx@xxx.upstash.io:xxx

APP_URL=https://black-pill.app
API_BASE_URL=https://api.black-pill.app

NODE_ENV=production
```

### Deploy

```bash
cd backend
npm install
vercel --prod
```

Or connect GitHub repo for automatic deployments.

### Add Google Service Account

Since Vercel doesn't support file uploads easily:

1. Convert service account JSON to base64
2. Add as environment variable
3. Decode in code, or use secrets management

Alternative: Use Google Cloud Secret Manager

## 5. Mobile App Deployment

### iOS Setup

1. Create App ID in Apple Developer
2. Configure capabilities:
   - Push Notifications
   - Sign in with Apple (if using)
3. Create provisioning profiles
4. Configure Firebase (download GoogleService-Info.plist)

### Android Setup

1. Create app in Google Play Console
2. Configure Firebase (download google-services.json)
3. Set up signing keys

### Build & Deploy

```bash
cd mobile

# iOS
flutter build ipa --release
# Upload to App Store Connect via Xcode or Transporter

# Android
flutter build appbundle --release
# Upload to Google Play Console
```

### App Store Submission

**App Store (iOS)**
1. Create app in App Store Connect
2. Fill in metadata, screenshots, privacy policy
3. Submit for review (~1-3 days)

**Google Play (Android)**
1. Create app in Play Console
2. Fill in store listing
3. Submit for review (~1-2 days)

## 6. Firebase Setup (Push Notifications)

### Create Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create project
3. Add iOS app
4. Add Android app
5. Download config files

### Configure Cloud Messaging

1. Upload APNs certificates (iOS)
2. Configure FCM (Android automatically configured)
3. Get server key for backend

## 7. Analytics & Monitoring

### PostHog

1. Create account at [PostHog](https://posthog.com)
2. Create project
3. Copy API key

### Sentry

1. Create account at [Sentry](https://sentry.io)
2. Create projects (one for backend, one for mobile)
3. Copy DSN for each

## 8. Custom Domain (Optional)

### Backend

1. Add domain in Vercel
2. Configure DNS records
3. Wait for SSL certificate

### Deep Links

1. Configure `.well-known/apple-app-site-association`
2. Configure `.well-known/assetlinks.json`