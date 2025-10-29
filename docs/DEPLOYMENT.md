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

## Backend Deployment (Express.js on Vercel)

### Prerequisites
- Vercel account (https://vercel.com)
- GitHub repository connected to Vercel
- Environment variables configured

### Production URL
```
https://api.black-pill.app
```

### Environment Variables for Production
Copy all variables from `backend/env.example` and set them in Vercel:

```env
# Supabase Configuration
SUPABASE_URL=https://wzsxpxwwgaqiaoxdyhnf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
SUPABASE_ANON_KEY=your-production-anon-key

# OpenAI Configuration
OPENAI_API_KEY=your-production-openai-key
OPENAI_MODEL=gpt-5-mini

# Google Cloud Vision
GOOGLE_CLOUD_PROJECT_ID=your-production-project-id
GOOGLE_CLOUD_API_KEY=your-production-google-api-key

# Stripe Configuration (use production keys)
STRIPE_SECRET_KEY=sk_live_your_production_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret

# Production URLs
APP_URL=https://black-pill.app
API_BASE_URL=https://api.black-pill.app

# Redis (Upstash for production)
REDIS_URL=redis://default:production-password@host:port

# Resend Email
RESEND_API_KEY=your-production-resend-key

# Security
JWT_SECRET=your-production-jwt-secret
CRON_SECRET=your-production-cron-secret

# Environment
NODE_ENV=production
```

### Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push origin main
   ```

2. **Vercel Auto-Deployment**
   - Vercel will automatically build and deploy on push to main
   - Check deployment status at https://vercel.com

3. **Verify Deployment**
   ```bash
   curl https://api.black-pill.app/api/auth/me
   ```

### Production Features
- Auto-scaling serverless functions
- Global CDN distribution
- Built-in SSL/TLS certificates
- GitHub integration for CI/CD
- Environment variable management
- Real-time deployment logs

---

## Mobile Deployment (Flutter to App Store & Google Play)

### Production API Configuration
The mobile app automatically connects to the production backend:

```dart
// mobile/lib/config/env_config.dart
apiBaseUrl = 'https://api.black-pill.app'
```

### Build for iOS

```bash
cd mobile

# Build iOS app
flutter build ios --release

# Upload to App Store using Xcode
open ios/Runner.xcworkspace
```

### Build for Android

```bash
cd mobile

# Build APK
flutter build apk --release

# Or build App Bundle (recommended for Google Play)
flutter build appbundle --release

# Upload to Google Play Console
# - Open Google Play Console
# - Create new release
# - Upload generated AAB file
```

### App Configuration for Production
All apps automatically use:
- **API Base**: https://api.black-pill.app
- **Supabase**: https://wzsxpxwwgaqiaoxdyhnf.supabase.co
- **Analytics**: PostHog production
- **Error Tracking**: Sentry production
- **Push Notifications**: Firebase Cloud Messaging production

---

## Database (Supabase)

### Production Database Status
✅ **All 16 tables migrated**
✅ **Row-Level Security (RLS) policies active**
✅ **Storage buckets configured**
✅ **Auto-update triggers enabled**

### Connection String
```
postgresql://[user]:[password]@db.wzsxpxwwgaqiaoxdyhnf.supabase.co:5432/postgres
```

### Backups
Supabase automatically handles:
- Daily backups
- Point-in-time recovery (7 days)
- Automated failover

---

## Production Monitoring

### Error Tracking (Sentry)
- All errors automatically reported
- Set `SENTRY_DSN` in environment

### Analytics (PostHog)
- User behavior tracking
- Funnel analysis
- Feature usage metrics

### Health Checks
```bash
# Backend health
curl https://api.black-pill.app/api/auth/me

# Database connection
# Check Supabase dashboard at https://supabase.com

# Analytics
# Check PostHog at https://posthog.com
```

---

## Rollback Procedure

### Backend Rollback
1. Go to Vercel dashboard
2. Select deployment to rollback to
3. Click "Promote to Production"

### Database Rollback
1. Go to Supabase dashboard
2. Navigate to "Backups"
3. Select snapshot to restore
4. Confirm restoration

---

## Cost Optimization

### Vercel (Backend)
- Free tier includes 100GB bandwidth/month
- Pro: $20/month for additional features

### Supabase (Database)
- Free tier: 500MB storage, 1GB egress
- Pro: $25/month for 8GB storage, 250GB egress

### Third-Party Services
- OpenAI: ~$0.50-2 per 1M tokens
- Google Cloud Vision: $1-4 per 1000 requests
- Stripe: 2.9% + $0.30 per transaction
- Resend: $0.20 per email
- Redis (Upstash): Pay-per-request

---

## Security Checklist

- [ ] All API keys rotated and stored securely
- [ ] HTTPS enabled on all endpoints
- [ ] Database backups verified
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Error messages don't leak sensitive info
- [ ] JWT tokens use secure signing
- [ ] Stripe webhooks verified
- [ ] OAuth credentials secure
- [ ] Environment variables not exposed