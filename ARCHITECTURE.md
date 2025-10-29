# Black Pill - System Architecture

Complete technical architecture diagram and flow documentation.

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MOBILE APP (Flutter)                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │   Auth     │  │  Analysis  │  │ Leaderboard│  │  Progress  │       │
│  │  Screens   │  │  Screens   │  │   Screen   │  │   Screen   │       │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘       │
│        │               │               │               │                │
│  ┌─────▼───────────────▼───────────────▼───────────────▼──────────┐    │
│  │           Riverpod State Management (5 Providers)              │    │
│  └─────┬───────────────┬───────────────┬───────────────┬──────────┘    │
│        │               │               │               │                │
│  ┌─────▼──────┐  ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐         │
│  │ Auth       │  │   API     │  │ Analytics │  │Deep Link  │         │
│  │ Service    │  │  Service  │  │  Service  │  │  Service  │         │
│  └────────────┘  └───────────┘  └───────────┘  └───────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
         │                  │                │                │
         │                  │                │                │
    ┌────▼────┐        ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
    │Supabase │        │ Vercel  │     │PostHog  │     │Firebase │
    │  Auth   │        │   API   │     │Analytics│     │   FCM   │
    └────┬────┘        └────┬────┘     └─────────┘     └─────────┘
         │                  │
         │                  │
    ┌────▼──────────────────▼──────┐
    │      Supabase Database       │
    │     + Storage (Images)       │
    └──────────────────────────────┘
                   │
         ┌─────────┼─────────┐
         │         │         │
    ┌────▼──┐ ┌────▼──┐ ┌───▼────┐
    │OpenAI │ │Google │ │ Stripe │
    │ GPT-5 │ │Vision │ │  API   │
    │  Mini │ │  API  │ └────────┘
    └───────┘ └───────┘
```

---

## 📱 Mobile App Architecture

### Layer 1: Presentation (UI)
```
Screens (14 total)
   ├─ Onboarding: Splash
   ├─ Auth: Login, Signup, Password Reset
   ├─ Main: Home (Bottom Nav), Camera, Profile
   ├─ Analysis: Loading, Results
   ├─ Subscription: Paywall
   ├─ Referral: Stats Dashboard
   ├─ Leaderboard: Rankings (Phase 2)
   ├─ Progress: Charts (Phase 2)
   └─ Community: Hub (Phase 2)

Widgets (11 reusable)
   ├─ GlassCard
   ├─ PrimaryButton
   ├─ TextInputField
   ├─ ScoreCircle
   ├─ BreakdownBar
   ├─ LeaderboardItem
   ├─ LeaderboardFilterChips
   ├─ StatCard
   └─ AchievementBadge
```

### Layer 2: State Management
```
Riverpod Providers
   ├─ authServiceProvider
   ├─ apiServiceProvider
   ├─ analyticsServiceProvider
   ├─ deepLinkServiceProvider
   ├─ pushNotificationServiceProvider
   └─ routerProvider
```

### Layer 3: Services (Business Logic)
```
AuthService
   ├─ signUpWithEmail()
   ├─ signInWithEmail()
   ├─ signInWithGoogle()
   ├─ resetPassword()
   └─ signOut()

ApiService (22 methods)
   ├─ analyzeImage()
   ├─ getAnalyses()
   ├─ acceptReferral()
   ├─ createCheckoutSession()
   ├─ getLeaderboard()
   └─ ... 17 more methods

AnalyticsService (37 events)
   ├─ trackOnboardingStarted()
   ├─ trackAnalysisCompleted()
   ├─ trackPaymentSuccess()
   └─ ... 34 more events
```

### Layer 4: Data Layer
```
Supabase Client
   ├─ Auth (Supabase Auth)
   ├─ Database (PostgreSQL)
   └─ Storage (Images)

HTTP Client (Dio)
   ├─ Interceptors (Auth token)
   ├─ Retry logic
   └─ Error handling
```

---

## 🖥️ Backend Architecture

### Serverless Functions (Vercel)
```
API Routes (22 endpoints)
   ├─ /api/auth/me
   ├─ /api/analyze
   ├─ /api/analyses (list)
   ├─ /api/analyses/:id (get/delete)
   ├─ /api/referral/accept
   ├─ /api/referral/stats
   ├─ /api/subscriptions/create-checkout
   ├─ /api/subscriptions/status
   ├─ /api/subscriptions/cancel
   ├─ /api/webhooks/stripe
   ├─ /api/share/generate-card
   ├─ /api/leaderboard
   ├─ /api/leaderboard/referrals
   ├─ /api/creators/apply
   ├─ /api/creators/dashboard
   ├─ /api/creators/performance
   └─ /api/creators/coupons
```

### Middleware Chain
```
Request
   ↓
1. CORS + Helmet (Security)
   ↓
2. Rate Limiter (Redis)
   ↓
3. Auth Middleware (JWT)
   ↓
4. Route Handler
   ↓
5. Error Handler
   ↓
Response
```

### External Services
```
OpenAI GPT-5 Mini
   ├─ Facial analysis
   ├─ Score calculation
   ├─ Tip generation
   └─ Toxic term filtering

Google Cloud Vision
   ├─ Face detection
   ├─ Landmark extraction
   ├─ Quality validation
   └─ SafeSearch (explicit content)

Stripe
   ├─ Checkout sessions
   ├─ Subscription management
   ├─ Webhooks
   └─ Customer portal
```

---

## 🗄️ Database Architecture

### Core Tables (11 total)

**User Management:**
```
users
   ├─ id (UUID, PK)
   ├─ email (unique)
   ├─ referral_code (unique)
   ├─ tier (free/basic/pro/unlimited)
   ├─ scans_remaining (int)
   └─ referred_by (FK → users)
```

**Content:**
```
analyses
   ├─ id (UUID, PK)
   ├─ user_id (FK → users)
   ├─ score (decimal 3,1)
   ├─ breakdown (JSONB)
   ├─ tips (JSONB)
   ├─ image_url (text)
   └─ is_public (boolean)
```

**Monetization:**
```
subscriptions
   ├─ id (UUID, PK)
   ├─ user_id (FK → users, unique)
   ├─ stripe_customer_id (unique)
   ├─ stripe_subscription_id (unique)
   ├─ tier (basic/pro/unlimited)
   ├─ status (active/canceled/past_due)
   └─ current_period_end (timestamp)
```

**Growth:**
```
referrals
   ├─ id (UUID, PK)
   ├─ from_user_id (FK → users)
   ├─ to_user_id (FK → users)
   ├─ referral_code (text)
   ├─ bonus_scans_given (int)
   └─ status (pending/accepted)
```

**Gamification:**
```
leaderboard_weekly
   ├─ id (UUID, PK)
   ├─ user_id (FK → users)
   ├─ score (decimal 3,1)
   ├─ rank (int)
   └─ week_starting (date)
```

**Creator Economy:**
```
creators
   ├─ id (UUID, PK)
   ├─ user_id (FK → users)
   ├─ affiliate_link (unique)
   ├─ tier (nano/micro/macro)
   ├─ commission_rate (decimal)
   └─ status (pending/approved)

affiliate_clicks
   ├─ id (UUID, PK)
   ├─ creator_id (FK → creators)
   ├─ device_id, ip_address
   └─ created_at

affiliate_conversions
   ├─ id (UUID, PK)
   ├─ creator_id (FK → creators)
   ├─ user_id (FK → users)
   ├─ commission_earned (decimal)
   └─ status (pending/approved/paid)
```

### Security: Row-Level Security (RLS)
```
Every table has RLS policies:
   ├─ Users see only their own data
   ├─ Analyses: owner OR public
   ├─ Subscriptions: owner only
   ├─ Referrals: participants only
   ├─ Leaderboard: public read
   └─ Creators: owner only
```

---

## 🔄 Data Flow: Photo Analysis

```
1. USER ACTION
   User takes/uploads photo
      ↓
2. MOBILE APP
   ├─ ImagePicker captures photo
   ├─ Compress to max 2MB, JPEG 85%
   └─ Navigate to AnalysisLoadingScreen
      ↓
3. UPLOAD TO STORAGE
   ├─ POST to /api/analyze (multipart/form-data)
   ├─ Backend receives image buffer
   ├─ Sharp processes image (resize 1920x1920)
   └─ Upload to Supabase Storage
      ↓
4. FACE DETECTION
   ├─ Google Cloud Vision API
   ├─ Detect faces (must be exactly 1)
   ├─ Extract 68 facial landmarks
   ├─ Validate quality (blur, lighting, angles)
   └─ SafeSearch check (no explicit content)
      ↓
5. AI ANALYSIS
   ├─ OpenAI GPT-5 Mini Vision API
   ├─ Send: image URL + face metrics
   ├─ Receive: score + breakdown + tips
   └─ Validate response (no toxic terms)
      ↓
6. SAVE TO DATABASE
   ├─ Create thumbnail (200x200px)
   ├─ Insert into analyses table
   ├─ Decrement scans_remaining
   └─ Return analysis_id
      ↓
7. MOBILE APP UPDATES
   ├─ Navigate to ResultsScreen
   ├─ Animate score reveal (1500ms)
   ├─ Show confetti if score ≥ 7.5
   ├─ Animate breakdown bars (800ms each)
   └─ Display AI tips

Total Time: 10-30 seconds
```

---

## 💳 Payment Flow: Subscription

```
1. USER SELECTS TIER
   User taps "Subscribe to Pro"
      ↓
2. CREATE CHECKOUT SESSION
   ├─ POST /api/subscriptions/create-checkout
   ├─ Backend calls Stripe API
   ├─ Creates checkout session
   └─ Returns checkout URL
      ↓
3. STRIPE CHECKOUT
   ├─ Redirect to Stripe hosted page
   ├─ User enters payment details
   ├─ Stripe processes payment
   └─ Redirect back to app (success/cancel)
      ↓
4. WEBHOOK RECEIVED
   ├─ Stripe sends webhook to /api/webhooks/stripe
   ├─ Event: checkout.session.completed
   ├─ Verify signature
   └─ Process event
      ↓
5. UPDATE DATABASE
   ├─ Create/update subscription record
   ├─ Update user tier
   ├─ Add monthly scans
   └─ Store Stripe customer ID
      ↓
6. MOBILE APP POLLS
   ├─ GET /api/subscriptions/status
   ├─ Detects tier change
   ├─ Update UI
   └─ Navigate to success screen

Total Time: 2-5 seconds
```

---

## 🎁 Referral Flow

```
1. USER SHARES LINK
   ├─ User taps "Share" in Referral Stats
   ├─ Share: "Get 5 free scans! Use code: INVITE-1234-5678"
   └─ Share URL: https://black-pill.app/ref/INVITE-1234-5678
      ↓
2. FRIEND CLICKS LINK
   ├─ Deep link opens app (or app store)
   ├─ DeepLinkService handles URI
   └─ Extract referral code from path
      ↓
3. FRIEND SIGNS UP
   ├─ Complete signup flow
   ├─ Account created
   └─ User lands on home screen
      ↓
4. ACCEPT REFERRAL
   ├─ POST /api/referral/accept
   ├─ Validate code (not self, not used before)
   ├─ Create referral record
   └─ Add 5 scans to both users
      ↓
5. NOTIFICATIONS SENT
   ├─ Push to referrer: "Your friend joined! +5 scans"
   ├─ Push to referee: "Welcome! You got 5 free scans"
   └─ Both users see updated scan count
      ↓
6. ANALYTICS TRACKED
   ├─ referral_accepted event
   ├─ referral_bonus_received event
   └─ Update conversion metrics

Total Time: Instant
```

---

## 📊 Leaderboard Calculation

```
1. WEEKLY CRON JOB (Sunday 00:00 UTC)
   ├─ Query all public analyses from past week
   ├─ Group by user_id
   └─ Take highest score per user
      ↓
2. RANKING ALGORITHM
   ├─ Sort by score DESC
   ├─ Tie-breaker: earliest created_at
   └─ Assign rank (1, 2, 3, ...)
      ↓
3. SAVE TO LEADERBOARD TABLE
   ├─ Insert into leaderboard_weekly
   ├─ Set week_starting date
   └─ Store rank + score
      ↓
4. MOBILE APP QUERIES
   ├─ GET /api/leaderboard?filter=this_week
   ├─ Returns top 100 users
   └─ App highlights current user rank

Recalculation: Every Sunday at midnight UTC
```

---

## 🔐 Security Architecture

### Authentication Flow
```
1. User Login
   ↓
2. Supabase Auth
   ├─ Validates credentials
   ├─ Issues JWT token
   └─ Token valid for 1 hour
   ↓
3. Token Refresh
   ├─ Auto-refresh before expiry
   ├─ New token issued
   └─ Seamless to user
   ↓
4. API Requests
   ├─ Include: Authorization: Bearer {token}
   ├─ Backend validates with Supabase
   └─ Extract user_id from token
```

### Row-Level Security (RLS)
```
Database Query
   ↓
PostgreSQL checks policy
   ├─ Is auth.uid() = user_id?
   ├─ Is resource public?
   └─ Is user in participants?
   ↓
Return only authorized rows
```

### Rate Limiting
```
API Request
   ↓
Redis Check
   ├─ Key: user_id or IP
   ├─ Current: 3 requests
   ├─ Limit: 5 requests
   ├─ Window: 10 minutes
   └─ Allow: Yes (3 < 5)
   ↓
Increment counter
   ↓
Process request
```

---

## 🎨 UI Rendering Pipeline

### Score Circle Animation
```
1. ResultsScreen mounts
   ↓
2. ScoreCircle widget
   ├─ AnimationController (1500ms)
   ├─ Tween: 0.0 → actual_score
   └─ Curve: easeOutCubic
   ↓
3. AnimatedBuilder
   ├─ Rebuilds 60 times per second
   ├─ Draws gradient border
   └─ Updates score text
   ↓
4. Confetti check
   ├─ if score ≥ 7.5
   └─ ConfettiController.play()

Duration: 1500ms
FPS: 60
```

### Breakdown Bars Animation
```
For each category (6 total):
   ↓
1. Stagger delay (0ms, 100ms, 200ms, ...)
   ↓
2. AnimationController (800ms)
   ├─ Tween: 0.0 → category_score/10
   └─ Curve: easeOutCubic
   ↓
3. AnimatedBuilder
   ├─ Updates width (0% → actual%)
   ├─ Gradient fill
   └─ Glow shadow
   ↓
4. Complete
   └─ All 6 bars fully rendered

Total Duration: 1300ms (500ms stagger + 800ms last bar)
```

---

## 📈 Analytics Pipeline

```
1. USER ACTION
   (e.g., user completes analysis)
      ↓
2. MOBILE APP
   analyticsService.trackAnalysisCompleted(
     score: 7.8,
     durationMs: 15000
   )
      ↓
3. POSTHOG SDK
   ├─ Event: 'analysis_completed'
   ├─ Properties: { score: 7.8, duration: 15000 }
   ├─ User ID: from session
   └─ Device info: OS, version, model
      ↓
4. POSTHOG CLOUD
   ├─ Store event
   ├─ Process in real-time
   └─ Update dashboards
      ↓
5. ANALYTICS DASHBOARD
   ├─ Funnels updated
   ├─ Retention calculated
   ├─ Cohorts analyzed
   └─ Insights generated

Latency: <100ms
```

---

## 🚀 Deployment Architecture

### Production Stack
```
┌─────────────────────────────────────────┐
│          CLOUDFLARE CDN                 │
│  (DNS, DDoS Protection, SSL)            │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────┐      ┌─────▼──────┐
│ Vercel │      │  Supabase  │
│  Edge  │      │   Cloud    │
│Network │      │            │
└───┬────┘      └─────┬──────┘
    │                 │
    │  ┌──────────────┼──────────────┐
    │  │              │              │
┌───▼──▼───┐    ┌────▼────┐    ┌────▼────┐
│ Backend  │    │Database │    │ Storage │
│Functions │    │(Postgres│    │ (S3)    │
└──────────┘    │   RLS)  │    └─────────┘
                └─────────┘

Auto-Scaling:
   ├─ Vercel: Unlimited serverless functions
   ├─ Supabase: Auto-scaling database
   └─ CDN: Global edge network
```

### Mobile Apps
```
┌──────────────┐         ┌──────────────┐
│  App Store   │         │ Google Play  │
│              │         │              │
│   iOS App    │         │ Android App  │
│  (Flutter)   │         │  (Flutter)   │
└──────┬───────┘         └──────┬───────┘
       │                        │
       └────────┬───────────────┘
                │
         ┌──────▼──────┐
         │   User's    │
         │   Device    │
         └─────────────┘
```

---

## 🔄 Real-Time Features

### Push Notifications
```
Event Trigger (e.g., referral accepted)
   ↓
Backend calls FCM API
   ↓
Firebase Cloud Messaging
   ↓
┌─────────┴──────────┐
│                    │
iOS APNs         Android FCM
   ↓                  ↓
User's Device    User's Device
   ↓                  ↓
Notification appears
```

### Deep Linking
```
User clicks: https://black-pill.app/ref/INVITE-1234-5678
   ↓
┌───────────┴────────────┐
│                        │
App Installed?      Not Installed?
│                        │
Open App            Redirect to
   ↓                App Store
Handle Link             ↓
   ↓              User installs
Accept Referral          ↓
                   Open App
                        ↓
                   Handle Link
```

---

## 📦 Build & Deploy Pipeline

### Backend (Vercel)
```
git push
   ↓
GitHub webhook
   ↓
Vercel
   ├─ Pull latest code
   ├─ npm install
   ├─ Build serverless functions
   ├─ Deploy to edge network
   └─ Update DNS (~30 seconds)
```

### Mobile (Manual)
```
flutter build ipa --release
   ↓
Xcode Archive
   ↓
Upload to App Store Connect
   ↓
TestFlight beta (optional)
   ↓
Submit for review
   ↓
1-3 days review
   ↓
LIVE on App Store ✅
```

---

## 🎯 Scalability

### Current Limits
- Vercel: Unlimited functions, 100GB bandwidth/mo (Pro)
- Supabase: 8GB database, 100GB storage (Pro)
- OpenAI: Rate limited by your API plan
- Google Vision: 1000 free requests/mo, then $1.50/1000

### Scaling Strategy
```
10K MAU → 50K MAU → 200K MAU

Database:
   10K: Supabase Pro ($25/mo)
   50K: Add read replicas ($50/mo)
   200K: Dedicated instance ($100/mo)

Backend:
   10K: Vercel Pro ($20/mo)
   50K: Same (serverless scales)
   200K: Same (serverless scales)

AI Costs:
   10K: ~$500/mo
   50K: ~$2,500/mo
   200K: ~$10,000/mo
   (Optimize with caching)
```

---

## 🛡️ Error Handling

### Mobile App
```
API Call
   ↓
Try-Catch Block
   ├─ Success → Update UI
   └─ Error → 
      ├─ Log to Sentry
      ├─ Show SnackBar to user
      ├─ Retry (if network error)
      └─ Track analytics event
```

### Backend
```
API Request
   ↓
Try-Catch in Handler
   ├─ Success → Return 200
   └─ Error →
      ├─ Log to Sentry (with context)
      ├─ Return appropriate status code
      └─ Generic message to client
```

---

## 📊 Monitoring Stack

```
┌─────────────────────────────────────────┐
│           USER EXPERIENCE               │
└────────┬────────────────────────────────┘
         │
    ┌────┴────┐
    │         │
    │    ┌────▼────┐
    │    │PostHog  │
    │    │Analytics│
    │    └─────────┘
    │         │
    │    ┌────▼────┐
    │    │ Sentry  │
    │    │  Error  │
    │    │Tracking │
    │    └─────────┘
    │         │
    │    ┌────▼────┐
    │    │ Vercel  │
    │    │  Logs   │
    │    └─────────┘
    │         │
    └────┬────┴────┐
         │         │
    ┌────▼────┐ ┌──▼──────┐
    │Supabase │ │ Stripe  │
    │  Logs   │ │Dashboard│
    └─────────┘ └─────────┘

All feed into: Comprehensive monitoring dashboard
```

---

## 🎉 Summary

**Black Pill is a complete, production-ready application with:**

✅ Beautiful mobile app (iOS + Android)
✅ Scalable serverless backend
✅ Secure database with RLS
✅ AI-powered core feature
✅ Viral growth mechanics
✅ Subscription monetization
✅ Creator affiliate program
✅ Social & gamification features
✅ Comprehensive monitoring
✅ Complete documentation

**Ready to launch with ~2 hours of configuration! 🚀**

---

Last Updated: October 27, 2025

