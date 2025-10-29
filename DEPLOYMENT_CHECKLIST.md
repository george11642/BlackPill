# Black Pill - Deployment Checklist

Complete checklist to get Black Pill from code to production.

## 📋 Pre-Deployment Setup

### 1. Supabase Setup ✓
- [ ] Create Supabase project at https://supabase.com
- [ ] Wait for project initialization (~2 minutes)
- [ ] Navigate to Settings → API
- [ ] Copy Project URL
- [ ] Copy Anon (public) key
- [ ] Copy Service Role key (KEEP SECRET!)
- [ ] Run migrations:
  ```bash
  cd supabase
  supabase link --project-ref YOUR_PROJECT_REF
  supabase db push
  ```
- [ ] Verify tables created in Table Editor
- [ ] Check Storage bucket 'analyses' exists

### 2. OpenAI Setup ✓
- [ ] Go to https://platform.openai.com
- [ ] Create account / sign in
- [ ] Go to API Keys section
- [ ] Create new secret key
- [ ] Copy key (starts with sk-)
- [ ] Add billing details
- [ ] Set usage limits (recommended: $100/month)

### 3. Google Cloud Platform ✓
- [ ] Go to https://console.cloud.google.com
- [ ] Create new project
- [ ] Enable Cloud Vision API
- [ ] Go to APIs & Services → Credentials
- [ ] Click "Create Credentials" → "API Key"
- [ ] Copy the API key
- [ ] (Optional) Restrict API key to Cloud Vision API only
- [ ] Note: Keep this API key PRIVATE

### 4. Stripe Setup ✓
- [ ] Create Stripe account at https://dashboard.stripe.com
- [ ] Complete business verification
- [ ] Create 6 products:
  - **Basic Monthly:** $4.99/month recurring
  - **Basic Annual:** $54.99/year recurring
  - **Pro Monthly:** $9.99/month recurring
  - **Pro Annual:** $109.89/year recurring
  - **Unlimited Monthly:** $19.99/month recurring
  - **Unlimited Annual:** $219.89/year recurring
- [ ] Copy all 6 Price IDs
- [ ] Get Secret Key (sk_live_xxx or sk_test_xxx)
- [ ] Set up webhook endpoint (after backend deployed)

### 5. Firebase Setup ✓
- [ ] Go to https://console.firebase.google.com
- [ ] Create new project
- [ ] Add iOS app
  - Enter bundle ID (com.yourcompany.blackpill)
  - Download GoogleService-Info.plist
  - Place in mobile/ios/Runner/
- [ ] Add Android app
  - Enter package name (com.yourcompany.blackpill)
  - Download google-services.json
  - Place in mobile/android/app/
- [ ] Enable Cloud Messaging
- [ ] Upload APNs certificates (iOS)

### 6. Upstash Redis (Optional but Recommended) ✓
- [ ] Go to https://upstash.com
- [ ] Create Redis database
- [ ] Copy connection URL
- [ ] Note: For rate limiting

### 7. PostHog Analytics (Optional) ✓
- [ ] Go to https://posthog.com
- [ ] Create project
- [ ] Copy API key
- [ ] Copy host URL

### 8. Sentry Error Tracking (Optional) ✓
- [ ] Go to https://sentry.io
- [ ] Create account
- [ ] Create project for Backend
- [ ] Create project for Mobile
- [ ] Copy both DSN URLs

---

## 🔧 Backend Deployment

### 1. Configure Environment Variables
Create `.env` in backend folder:

```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_ANON_KEY=eyJhbGc...

# OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-5-mini

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC_MONTHLY=price_...
STRIPE_PRICE_BASIC_ANNUAL=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
STRIPE_PRICE_UNLIMITED_MONTHLY=price_...
STRIPE_PRICE_UNLIMITED_ANNUAL=price_...

# Redis
REDIS_URL=redis://default:xxx@xxx.upstash.io:xxx

# App
APP_URL=https://black-pill.app
API_BASE_URL=https://api.black-pill.app

# Environment
NODE_ENV=production
```

### 2. Deploy to Vercel
```bash
cd backend
npm install
vercel login
vercel --prod
```

- [ ] Deployment successful
- [ ] Note the deployment URL
- [ ] Copy all environment variables to Vercel dashboard
- [ ] Upload Google service account JSON as secret

### 3. Configure Stripe Webhook
- [ ] Go to Stripe Dashboard → Developers → Webhooks
- [ ] Add endpoint: `https://your-backend.vercel.app/api/webhooks/stripe`
- [ ] Select events:
  - checkout.session.completed
  - customer.subscription.created
  - customer.subscription.updated
  - customer.subscription.deleted
  - invoice.paid
  - invoice.payment_failed
- [ ] Copy Webhook Signing Secret
- [ ] Add to Vercel environment variables

---

## 📱 Mobile App Deployment

### 1. Configure Environment
Create `.env` in mobile folder:

```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
API_BASE_URL=https://your-backend.vercel.app
STRIPE_PUBLISHABLE_KEY=pk_live_...
GOOGLE_CLIENT_ID_ANDROID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_ID_IOS=xxx.apps.googleusercontent.com
POSTHOG_API_KEY=phc_...
POSTHOG_HOST=https://app.posthog.com
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
DEEP_LINK_SCHEME=blackpill
DEEP_LINK_HOST=black-pill.app
```

### 2. iOS Preparation
- [ ] Update bundle identifier in Xcode
- [ ] Add GoogleService-Info.plist to Runner
- [ ] Configure capabilities:
  - Push Notifications
  - Associated Domains (for deep linking)
- [ ] Create App ID in Apple Developer
- [ ] Create provisioning profiles
- [ ] Configure deep linking:
  - Add `black-pill.app` to Associated Domains

### 3. Android Preparation
- [ ] Update package name in build.gradle
- [ ] Add google-services.json to android/app/
- [ ] Configure deep linking in AndroidManifest.xml
- [ ] Create keystore for signing:
  ```bash
  keytool -genkey -v -keystore release.keystore -alias blackpill
  ```
- [ ] Configure signing in build.gradle

### 4. Build Apps

**iOS:**
```bash
cd mobile
flutter clean
flutter pub get
flutter build ipa --release
```
- [ ] Open Xcode
- [ ] Archive for distribution
- [ ] Upload to App Store Connect

**Android:**
```bash
cd mobile
flutter clean
flutter pub get
flutter build appbundle --release
```
- [ ] Upload to Google Play Console

### 5. App Store Submission

**iOS (App Store)**
- [ ] Create app in App Store Connect
- [ ] Fill metadata (name, description, keywords)
- [ ] Upload screenshots (6.5", 5.5", iPad)
- [ ] Set category: Health & Fitness
- [ ] Privacy policy URL: https://black-pill.app/privacy
- [ ] Age rating: 17+ (mature content)
- [ ] Submit for review

**Android (Google Play)**
- [ ] Create app in Play Console
- [ ] Fill store listing
- [ ] Upload screenshots
- [ ] Set category: Health & Fitness
- [ ] Content rating: Mature 17+
- [ ] Privacy policy URL
- [ ] Submit for review

---

## 🌐 Domain & Deep Linking

### 1. Domain Setup
- [ ] Purchase domain: black-pill.app
- [ ] Point to Vercel (backend)
- [ ] Configure SSL (Vercel automatic)

### 2. Deep Linking Files

**iOS:** Create `.well-known/apple-app-site-association`
```json
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "TEAM_ID.com.yourcompany.blackpill",
      "paths": ["/ref/*", "/subscribe/*"]
    }]
  }
}
```

**Android:** Create `.well-known/assetlinks.json`
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.yourcompany.blackpill",
    "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
  }
}]
```

- [ ] Upload both files to website root
- [ ] Verify in Apple/Google consoles

---

## ✅ Post-Deployment

### 1. Verification
- [ ] Test signup flow
- [ ] Test photo analysis
- [ ] Test subscription purchase (use test card)
- [ ] Test referral link
- [ ] Test deep linking
- [ ] Test push notifications
- [ ] Check Sentry for errors
- [ ] Check PostHog for events

### 2. Monitoring
- [ ] Set up Sentry alerts
- [ ] Configure Vercel alerts
- [ ] Set up Supabase monitoring
- [ ] Check Stripe dashboard

### 3. Marketing
- [ ] Prepare Product Hunt launch
- [ ] Create social media accounts
- [ ] Write blog post
- [ ] Reach out to influencers
- [ ] Submit to app directories

---

## 💰 Expected Monthly Costs (10K MAU)

- Vercel Pro: $20
- Supabase Pro: $25
- OpenAI API: $500 (depends on usage)
- Google Cloud Vision: $150
- Upstash Redis: $10
- Firebase: $0 (free tier)
- Stripe fees: 2.9% + $0.30 per transaction
- Domain: $12/year

**Total:** ~$705/month + transaction fees

---

## 🆘 Support Contacts

**Technical Issues:**
- Supabase: https://supabase.com/docs
- Vercel: https://vercel.com/docs
- Flutter: https://flutter.dev/docs

**Business:**
- Email: support@black-pill.app
- Status: https://status.black-pill.app (set up with Statuspage.io)

---

## 🎊 Launch Day Checklist

### T-1 Day
- [ ] All tests passing
- [ ] All environments configured
- [ ] Monitoring active
- [ ] Support email ready
- [ ] Marketing materials ready

### Launch Day
- [ ] Apps approved in stores
- [ ] Backend deployed
- [ ] Database migrated
- [ ] Post on Product Hunt
- [ ] Tweet announcement
- [ ] Email beta users
- [ ] Monitor closely

### T+1 Day
- [ ] Review analytics
- [ ] Check error rates
- [ ] Monitor conversion
- [ ] Respond to feedback
- [ ] Fix critical bugs

---

**You're ready to launch! 🚀**

