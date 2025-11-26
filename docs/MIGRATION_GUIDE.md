# BlackPill Structure Migration Guide

**Version:** 1.0  
**Date:** January 2025  
**Status:** In Progress

## Overview

This guide documents the migration of BlackPill from a Flutter + Express.js architecture to React Native/Expo + Next.js API routes, matching SmileScore's unified structure.

## Table of Contents

1. [Architecture Comparison](#architecture-comparison)
2. [Migration Phases](#migration-phases)
3. [Feature Mapping](#feature-mapping)
4. [API Endpoint Migration](#api-endpoint-migration)
5. [Environment Variables](#environment-variables)
6. [Deployment Configuration](#deployment-configuration)
7. [Testing Strategy](#testing-strategy)
8. [Rollback Plan](#rollback-plan)

---

## Architecture Comparison

### Current Architecture (Before Migration)

```
BlackPill/
├── mobile/                    # Flutter (Dart)
│   ├── lib/
│   │   ├── features/         # 23+ feature modules
│   │   ├── core/             # Core utilities
│   │   └── config/           # Configuration
│   ├── android/              # Android native code
│   ├── ios/                  # iOS native code
│   └── pubspec.yaml         # Flutter dependencies
├── backend/                  # Express.js API (separate Vercel project)
│   ├── api/                  # 50+ API endpoints
│   ├── utils/                # Business logic
│   ├── middleware/           # Auth, rate limiting
│   └── vercel.json          # Backend deployment config
├── web/                      # Next.js Pages Router (creator dashboard)
│   ├── src/
│   │   ├── pages/           # Pages Router pages
│   │   └── components/      # React components
│   └── vercel.json          # Web deployment config
└── supabase/                 # Database migrations
```

**Issues:**
- Two separate Vercel projects (backend + web)
- Flutter mobile app cannot share code with web
- Express.js backend requires separate deployment
- No unified build process

### Target Architecture (After Migration)

```
BlackPill/
├── mobile/                    # React Native/Expo (TypeScript)
│   ├── app/                  # Expo Router app directory
│   ├── components/           # Reusable UI components
│   ├── lib/                  # Business logic, API clients
│   ├── screens/              # Screen components
│   ├── app.json             # Expo configuration
│   └── package.json         # React Native dependencies
├── web/                      # Next.js App Router + APIs
│   ├── app/
│   │   ├── api/             # All API routes (migrated from backend/)
│   │   ├── (marketing)/     # Landing, pricing pages
│   │   ├── dashboard/       # User dashboard
│   │   └── app/             # Expo web static files
│   ├── scripts/
│   │   └── build-expo-web.js # Expo web build script
│   └── package.json
├── supabase/                 # Database migrations (unchanged)
├── docs/
│   ├── PRD.md
│   └── MIGRATION_GUIDE.md
└── vercel.json              # Single Vercel project config
```

**Benefits:**
- Single Vercel project deployment
- Code sharing between mobile and web
- Unified build process
- Next.js API routes (serverless functions)
- Expo web app served from same domain

---

## Migration Phases

### Phase 1: Project Setup and Documentation ✅

**Status:** Complete

- [x] Create migration guide document
- [x] Document current architecture
- [x] Plan new structure

### Phase 2: Mobile App Migration (Flutter → React Native/Expo)

**Status:** ✅ Complete

#### 2.1 Initialize Expo Project

**Steps:**
1. Create new `mobile/` directory
2. Initialize Expo project: `npx create-expo-app@latest mobile --template blank-typescript`
3. Configure `app.json` for iOS, Android, and Web
4. Set up TypeScript configuration
5. Install core dependencies

**Dependencies to Install:**
```json
{
  "@expo/vector-icons": "^14.0.0",
  "@react-navigation/native": "^7.1.20",
  "@react-navigation/native-stack": "^7.6.3",
  "@supabase/supabase-js": "^2.83.0",
  "expo": "~54.0.25",
  "expo-camera": "~17.0.9",
  "expo-image-picker": "~17.0.8",
  "expo-notifications": "~0.32.13",
  "expo-secure-store": "~15.0.7",
  "expo-web-browser": "~15.0.9",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "react-native-purchases": "^8.2.0"
}
```

#### 2.2 Core Infrastructure Setup

**Auth System:**
- Port Supabase auth from Flutter (`mobile/lib/config/supabase_client.dart`)
- Use `@supabase/supabase-js` with `expo-secure-store` for token storage
- Implement Google OAuth via Supabase Auth

**State Management:**
- Replace Riverpod with React Context + hooks
- Create auth context, user context, subscription context
- Use React Query for API data fetching

**Navigation:**
- Replace go_router with Expo Router
- Set up file-based routing in `mobile/app/`
- Configure deep linking for referral codes

**Theme System:**
- Create theme configuration matching Flutter design
- Colors: Deep Black (#0F0F1E), Pink (#FF0080), Cyan (#00D9FF), Purple (#B700FF)
- Typography: Inter font family
- Component styles: Glass cards, gradient buttons

#### 2.3 Screen Migration Checklist

**Authentication & Onboarding (4 screens):**
- [x] `screens/SplashScreen.tsx` - App splash with logo
- [x] `screens/LoginScreen.tsx` - Email/password + Google OAuth
- [x] `screens/SignupScreen.tsx` - Registration with age verification
- [x] `screens/OnboardingScreen.tsx` - Permissions and disclaimers

**Core Analysis (3 screens):**
- [x] `screens/HomeScreen.tsx` - Main dashboard with bottom tabs
- [x] `screens/CameraScreen.tsx` - Photo capture with quality checks
- [x] `screens/AnalysisResultScreen.tsx` - Score display with 6-dimension breakdown

**Progress & History (3 screens):**
- [x] `screens/HistoryScreen.tsx` - Photo gallery with timeline
- [x] `screens/ComparisonScreen.tsx` - Before/after comparison
- [x] `screens/ProgressScreen.tsx` - Charts and analytics

**Routines & Habits (3 screens):**
- [x] `screens/RoutinesScreen.tsx` - Routine list
- [x] `screens/RoutineDetailScreen.tsx` - Routine tasks and schedule
- [x] `screens/TasksScreen.tsx` - Daily checklist

**Social & Gamification (3 screens):**
- [x] `screens/LeaderboardScreen.tsx` - Rankings and filters
- [x] `screens/AchievementsScreen.tsx` - Badge collection
- [x] `screens/ShareScreen.tsx` - Share card generation

**Challenges & Wellness (3 screens):**
- [x] `screens/ChallengesScreen.tsx` - Available challenges
- [x] `screens/ChallengeDetailScreen.tsx` - Challenge progress
- [x] `screens/WellnessScreen.tsx` - Health data integration

**Settings & Profile (4 screens):**
- [x] `screens/ProfileScreen.tsx` - User profile
- [x] `screens/SettingsScreen.tsx` - App settings
- [x] `screens/SubscriptionScreen.tsx` - Subscription management
- [x] `screens/EthicalSettingsScreen.tsx` - Privacy and wellness controls

**AI Coach (1 screen):**
- [x] `screens/AICoachScreen.tsx` - Chat interface with conversation history

**Total: 24 screens migrated ✅**

### Phase 3: Backend Migration (Express.js → Next.js API Routes)

**Status:** ✅ Complete

#### 3.1 API Endpoint Migration Map

| Express.js Route | Next.js Route | Status |
|-----------------|---------------|--------|
| `backend/api/analyze/index.js` | `web/app/api/analyze/route.ts` | ⏳ |
| `backend/api/auth/me.js` | `web/app/api/auth/me/route.ts` | ⏳ |
| `backend/api/subscriptions/create-checkout.js` | `web/app/api/subscriptions/create-checkout/route.ts` | ⏳ |
| `backend/api/subscriptions/status.js` | `web/app/api/subscriptions/status/route.ts` | ⏳ |
| `backend/api/subscriptions/cancel.js` | `web/app/api/subscriptions/cancel/route.ts` | ⏳ |
| `backend/api/routines/list.js` | `web/app/api/routines/list/route.ts` | ⏳ |
| `backend/api/routines/generate.js` | `web/app/api/routines/generate/route.ts` | ⏳ |
| `backend/api/routines/complete-task.js` | `web/app/api/routines/complete-task/route.ts` | ⏳ |
| `backend/api/routines/today.js` | `web/app/api/routines/today/route.ts` | ⏳ |
| `backend/api/routines/stats.js` | `web/app/api/routines/stats/route.ts` | ⏳ |
| `backend/api/routines/update.js` | `web/app/api/routines/update/route.ts` | ⏳ |
| `backend/api/routines/delete.js` | `web/app/api/routines/delete/route.ts` | ⏳ |
| `backend/api/routines/tasks.js` | `web/app/api/routines/tasks/route.ts` | ⏳ |
| `backend/api/analyses/index.js` | `web/app/api/analyses/route.ts` | ⏳ |
| `backend/api/analyses/history.js` | `web/app/api/analyses/history/route.ts` | ⏳ |
| `backend/api/analyses/[id].js` | `web/app/api/analyses/[id]/route.ts` | ⏳ |
| `backend/api/referral/accept.js` | `web/app/api/referral/accept/route.ts` | ⏳ |
| `backend/api/referral/stats.js` | `web/app/api/referral/stats/route.ts` | ⏳ |
| `backend/api/share/generate-card.js` | `web/app/api/share/generate-card/route.ts` | ⏳ |
| `backend/api/leaderboard/index.js` | `web/app/api/leaderboard/route.ts` | ⏳ |
| `backend/api/leaderboard/referrals.js` | `web/app/api/leaderboard/referrals/route.ts` | ⏳ |
| `backend/api/achievements/list.js` | `web/app/api/achievements/list/route.ts` | ⏳ |
| `backend/api/achievements/unlock.js` | `web/app/api/achievements/unlock/route.ts` | ⏳ |
| `backend/api/challenges/list.js` | `web/app/api/challenges/list/route.ts` | ⏳ |
| `backend/api/challenges/join.js` | `web/app/api/challenges/join/route.ts` | ⏳ |
| `backend/api/challenges/my-challenges.js` | `web/app/api/challenges/my-challenges/route.ts` | ⏳ |
| `backend/api/challenges/checkin.js` | `web/app/api/challenges/checkin/route.ts` | ⏳ |
| `backend/api/checkins/checkin.js` | `web/app/api/checkins/checkin/route.ts` | ⏳ |
| `backend/api/checkins/status.js` | `web/app/api/checkins/status/route.ts` | ⏳ |
| `backend/api/comparisons/compare.js` | `web/app/api/comparisons/compare/route.ts` | ⏳ |
| `backend/api/community/public-analyses.js` | `web/app/api/community/public-analyses/route.ts` | ⏳ |
| `backend/api/community/comments.js` | `web/app/api/community/comments/route.ts` | ⏳ |
| `backend/api/community/vote.js` | `web/app/api/community/vote/route.ts` | ⏳ |
| `backend/api/creators/apply.js` | `web/app/api/creators/apply/route.ts` | ⏳ |
| `backend/api/creators/dashboard.js` | `web/app/api/creators/dashboard/route.ts` | ⏳ |
| `backend/api/creators/performance.js` | `web/app/api/creators/performance/route.ts` | ⏳ |
| `backend/api/creators/coupons.js` | `web/app/api/creators/coupons/route.ts` | ⏳ |
| `backend/api/ai-coach/chat.js` | `web/app/api/ai-coach/chat/route.ts` | ⏳ |
| `backend/api/ai-coach/conversations.js` | `web/app/api/ai-coach/conversations/route.ts` | ⏳ |
| `backend/api/ai-coach/messages.js` | `web/app/api/ai-coach/messages/route.ts` | ⏳ |
| `backend/api/goals/create.js` | `web/app/api/goals/create/route.ts` | ⏳ |
| `backend/api/goals/list.js` | `web/app/api/goals/list/route.ts` | ⏳ |
| `backend/api/goals/update-progress.js` | `web/app/api/goals/update-progress/route.ts` | ⏳ |
| `backend/api/insights/generate.js` | `web/app/api/insights/generate/route.ts` | ⏳ |
| `backend/api/insights/list.js` | `web/app/api/insights/list/route.ts` | ⏳ |
| `backend/api/insights/mark-viewed.js` | `web/app/api/insights/mark-viewed/route.ts` | ⏳ |
| `backend/api/products/list.js` | `web/app/api/products/list/route.ts` | ⏳ |
| `backend/api/products/recommend.js` | `web/app/api/products/recommend/route.ts` | ⏳ |
| `backend/api/products/click.js` | `web/app/api/products/click/route.ts` | ⏳ |
| `backend/api/scoring/methodology.js` | `web/app/api/scoring/methodology/route.ts` | ⏳ |
| `backend/api/scoring/preferences.js` | `web/app/api/scoring/preferences/route.ts` | ⏳ |
| `backend/api/scoring/recalculate.js` | `web/app/api/scoring/recalculate/route.ts` | ⏳ |
| `backend/api/ethical/settings.js` | `web/app/api/ethical/settings/route.ts` | ⏳ |
| `backend/api/ethical/acknowledge-disclaimers.js` | `web/app/api/ethical/acknowledge-disclaimers/route.ts` | ⏳ |
| `backend/api/ethical/wellness-check.js` | `web/app/api/ethical/wellness-check/route.ts` | ⏳ |
| `backend/api/ethical/resources.js` | `web/app/api/ethical/resources/route.ts` | ⏳ |
| `backend/api/wellness/data.js` | `web/app/api/wellness/data/route.ts` | ⏳ |
| `backend/api/wellness/sync.js` | `web/app/api/wellness/sync/route.ts` | ⏳ |
| `backend/api/wellness/correlations.js` | `web/app/api/wellness/correlations/route.ts` | ⏳ |
| `backend/api/user/export.js` | `web/app/api/user/export/route.ts` | ⏳ |
| `backend/api/user/push-token.js` | `web/app/api/user/push-token/route.ts` | ⏳ |
| `backend/api/admin/review-queue.js` | `web/app/api/admin/review-queue/route.ts` | ⏳ |
| `backend/api/admin/review-action.js` | `web/app/api/admin/review-action/route.ts` | ⏳ |
| `backend/api/webhooks/stripe.js` | `web/app/api/webhooks/stripe/route.ts` | ⏳ |
| `backend/api/cron/check-renewals.js` | `web/app/api/cron/check-renewals/route.ts` | ⏳ |
| `backend/api/cron/recalculate-leaderboard.js` | `web/app/api/cron/recalculate-leaderboard/route.ts` | ⏳ |

**Total: 60+ endpoints to migrate**

#### 3.2 Business Logic Migration

**Utils to Migrate:**
- `backend/utils/openai-client.js` → `web/lib/openai/client.ts`
- `backend/utils/google-vision.js` → `web/lib/vision/client.ts`
- `backend/utils/supabase.js` → `web/lib/supabase/client.ts`
- `backend/utils/photo-verification.js` → `web/lib/vision/photo-verification.ts`
- `backend/utils/moderation.js` → `web/lib/moderation/client.ts`
- `backend/utils/share-card-generator.js` → `web/lib/share-card/generator.ts`
- `backend/utils/push-notification-service.js` → `web/lib/notifications/push.ts`
- `backend/utils/email-service.js` → `web/lib/emails/service.ts`
- `backend/utils/cache.js` → `web/lib/cache/client.ts`
- `backend/utils/fallback-scoring.js` → `web/lib/scoring/fallback.ts`

**Middleware to Migrate:**
- `backend/middleware/auth.js` → `web/lib/auth/middleware.ts`
- `backend/middleware/rate-limit.js` → `web/lib/rate-limit/middleware.ts`
- `backend/middleware/error-handler.js` → `web/lib/errors/handler.ts`
- `backend/middleware/request-id.js` → `web/lib/middleware/request-id.ts`

#### 3.3 Webhook & Cron Migration

**Webhooks:**
- Stripe webhook handler → `web/app/api/webhooks/stripe/route.ts`
- Use Vercel's webhook signature verification

**Cron Jobs:**
- Move to `vercel.json` crons configuration
- `check-renewals` → Daily at midnight UTC
- `recalculate-leaderboard` → Weekly on Sunday at midnight UTC

### Phase 4: Web App Updates

**Status:** ✅ Complete

#### 4.1 Upgrade to Next.js App Router

**Current Structure (Pages Router):**
```
web/src/
├── pages/
│   ├── index.tsx
│   ├── pricing.tsx
│   └── dashboard/
└── components/
```

**Target Structure (App Router):**
```
web/app/
├── page.tsx                    # Landing page
├── pricing/
│   └── page.tsx
├── dashboard/
│   └── page.tsx
└── api/                        # API routes
```

**Migration Steps:**
1. Create `web/app/` directory
2. Move pages to App Router structure
3. Update routing logic
4. Migrate layouts and metadata
5. Update links and navigation

#### 4.2 Integrate Expo Web Build

**Create `web/scripts/build-expo-web.js`:**
- Builds Expo web app from `mobile/` directory
- Outputs static files to `web/public/app/`
- Runs during Vercel build process

**Update `web/package.json`:**
```json
{
  "scripts": {
    "build": "npm run build:expo && next build",
    "build:expo": "node scripts/build-expo-web.js"
  }
}
```

**Create Next.js route handler for `/app`:**
- Serves Expo web static files
- Handles client-side routing

#### 4.3 Marketing Site Updates

**Pages to Create/Update:**
- Landing page (`web/app/page.tsx`)
- Pricing page (`web/app/pricing/page.tsx`)
- "Try Web App" button → `/app` route
- Creator dashboard (existing)
- Auth pages (login, signup)

### Phase 5: Deployment Consolidation

**Status:** ✅ Complete

#### 5.1 Single Vercel Configuration

**Create root `vercel.json`:**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd mobile && npm install && cd ../web && npm install && npm run build",
  "outputDirectory": "web/.next",
  "installCommand": "echo 'Dependencies installed in buildCommand'",
  "crons": [
    {
      "path": "/api/cron/check-renewals",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/recalculate-leaderboard",
      "schedule": "0 0 * * 0"
    }
  ]
}
```

#### 5.2 Environment Variables

**Consolidate from both projects:**

**From `backend/.env`:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_CLOUD_VISION_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (for web push)
- `VAPID_PRIVATE_KEY` (for web push)
- `POSTHOG_API_KEY`
- `REDIS_URL`
- `RESEND_API_KEY`

**From `mobile/.env`:**
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_APP_URL`
- `EXPO_PUBLIC_POSTHOG_KEY`

**New unified `.env` structure:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Expo Mobile
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_APP_URL=

# OpenAI
OPENAI_API_KEY=

# Google Cloud Vision
GOOGLE_CLOUD_VISION_API_KEY=
GOOGLE_CLOUD_VISION_PROJECT_ID=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Push Notifications (VAPID for Web Push)
# Generate with: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
# Expo Push API works automatically - no keys needed!

# Analytics
POSTHOG_API_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
EXPO_PUBLIC_POSTHOG_KEY=
POSTHOG_HOST=https://app.posthog.com

# Redis
REDIS_URL=

# Email
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# App URLs
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=
EXPO_PUBLIC_APP_URL=
EXPO_PUBLIC_APP_NAME=
EXPO_PUBLIC_PROJECT_ID=
```

#### 5.3 Remove Old Structure

**After migration is complete and tested:**
1. ✅ Delete `backend/` folder - **COMPLETED**
2. ✅ Delete `backend/vercel.json` - **COMPLETED**
3. ✅ Delete `web/vercel.json` (if separate) - **COMPLETED**
4. ✅ Archive Flutter `mobile/` contents - **COMPLETED** (all Dart files removed)
5. ✅ Update `.gitignore` - **COMPLETED**

#### 5.4 Environment Variables

**Status:** ✅ Complete

- Created unified environment variable documentation (`docs/ENVIRONMENT_SETUP.md`)
- Updated `.gitignore` to exclude all `.env` files
- Documented all required variables for root, web, and mobile

#### 5.5 Build Configuration

**Status:** ✅ Complete

- Updated root `package.json` to remove backend workspace
- Improved Expo web build script with better error handling
- Updated `vercel.json` with proper function configuration
- Added build scripts for development workflow

---

## Feature Mapping

### Flutter → React Native/Expo

| Flutter Feature | React Native Equivalent | Notes |
|----------------|------------------------|-------|
| `flutter_riverpod` | React Context + hooks | State management |
| `go_router` | Expo Router | Navigation |
| `supabase_flutter` | `@supabase/supabase-js` | Auth & database |
| `image_picker` | `expo-image-picker` | Photo selection |
| `camera` | `expo-camera` | Camera access |
| `flutter_secure_storage` | `expo-secure-store` | Secure token storage |
| `firebase_messaging` | `expo-notifications` + Expo Push API | Push notifications (no Firebase needed) |
| `flutter_stripe` | `react-native-purchases` | Subscriptions (RevenueCat) |
| `share_plus` | `expo-sharing` | Share functionality |
| `qr_flutter` | `react-native-qrcode-svg` | QR code generation |
| `fl_chart` | `react-native-chart-kit` or `victory-native` | Charts |
| `health` | `expo-health` or `react-native-health` | Health data |
| `confetti` | `react-native-confetti-cannon` | Animations |
| `google_fonts` | `expo-google-fonts` | Typography |

### State Management Patterns

**Flutter (Riverpod):**
```dart
final userProvider = StateNotifierProvider<UserNotifier, User?>((ref) {
  return UserNotifier();
});
```

**React Native (Context + Hooks):**
```typescript
const UserContext = createContext<User | null>(null);

export const useUser = () => {
  const context = useContext(UserContext);
  return context;
};
```

---

## API Endpoint Migration

### Request/Response Format Changes

**Express.js Format:**
```javascript
// Request
app.get('/api/analyses', async (req, res) => {
  const analyses = await getAnalyses(req.user.id);
  res.json({ analyses });
});

// Response
{
  "analyses": [...]
}
```

**Next.js API Route Format:**
```typescript
// Request
export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  const analyses = await getAnalyses(user.id);
  return Response.json({ analyses });
}

// Response
{
  "analyses": [...]
}
```

### Authentication Middleware

**Express.js:**
```javascript
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const user = await verifyToken(token);
  req.user = user;
  next();
};
```

**Next.js:**
```typescript
export async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = await verifyToken(token);
  return user;
}
```

### Error Handling

**Express.js:**
```javascript
try {
  // logic
} catch (error) {
  res.status(500).json({ error: error.message });
}
```

**Next.js:**
```typescript
try {
  // logic
} catch (error) {
  return Response.json(
    { error: error.message },
    { status: 500 }
  );
}
```

---

## Environment Variables

### Development Setup

1. Copy `.env.example` to `.env.local`
2. Fill in all required variables
3. For mobile: Copy to `mobile/.env.local`
4. For web: Variables auto-loaded by Next.js

### Production Setup

1. Add all variables to Vercel project settings
2. Ensure `EXPO_PUBLIC_*` variables are set for mobile builds
3. Ensure `NEXT_PUBLIC_*` variables are set for web builds
4. Test environment variable access in both mobile and web

---

## Deployment Configuration

### Vercel Project Setup

1. **Create/Update Vercel Project:**
   - Single project for entire monorepo
   - Root directory: `.` (root of repo)
   - Build command: Auto-detected from `vercel.json`
   - Output directory: `web/.next`

2. **Environment Variables:**
   - Add all variables from consolidated list
   - Mark `EXPO_PUBLIC_*` as available to mobile builds
   - Mark `NEXT_PUBLIC_*` as available to web builds

3. **Cron Jobs:**
   - Configure in `vercel.json`
   - Test cron endpoints after deployment

### Build Process

1. **Mobile Build:**
   - `cd mobile && npm install`
   - Builds Expo web app: `expo export --platform web`
   - Outputs to `web/public/app/`

2. **Web Build:**
   - `cd web && npm install`
   - Runs Expo web build script
   - Builds Next.js: `next build`
   - Outputs to `web/.next`

3. **Deployment:**
   - Vercel deploys `web/.next` directory
   - Serves static files from `web/public/`
   - API routes from `web/app/api/`

---

## Testing Strategy

### Mobile Testing

1. **Unit Tests:**
   - Test utilities and helpers
   - Test API clients
   - Test state management

2. **Integration Tests:**
   - Test navigation flows
   - Test auth flows
   - Test API integration

3. **E2E Tests:**
   - Test critical user journeys
   - Test subscription flow
   - Test analysis flow

### API Testing

1. **Unit Tests:**
   - Test individual API routes
   - Test middleware functions
   - Test utility functions

2. **Integration Tests:**
   - Test API + database integration
   - Test webhook handlers
   - Test cron jobs

### Web Testing

1. **Component Tests:**
   - Test React components
   - Test page components
   - Test API route handlers

2. **E2E Tests:**
   - Test marketing pages
   - Test dashboard flows
   - Test Expo web app integration

---

## Rollback Plan

### If Migration Fails

1. **Keep Old Structure:**
   - Don't delete `backend/` or Flutter `mobile/` until migration is proven stable
   - Keep both Vercel projects active during transition

2. **Feature Flags:**
   - Use feature flags to toggle between old and new implementations
   - Gradually migrate users to new system

3. **Database:**
   - No database schema changes required
   - Both old and new APIs use same Supabase database

4. **Rollback Steps:**
   - Revert code changes
   - Switch Vercel project back to old structure
   - Restore environment variables
   - Test critical flows

---

## Migration Checklist

### Pre-Migration
- [ ] Backup current codebase
- [ ] Document all environment variables
- [ ] List all API endpoints
- [ ] List all Flutter screens
- [ ] Create migration branch

### Phase 1: Setup
- [x] Create migration guide
- [ ] Set up new project structure
- [ ] Initialize Expo project
- [ ] Set up Next.js App Router

### Phase 2: Mobile Migration
- [x] Initialize Expo project
- [x] Set up core infrastructure
- [x] Migrate auth screens
- [x] Migrate analysis screens
- [x] Migrate progress screens
- [x] Migrate routine screens
- [x] Migrate social screens
- [x] Migrate settings screens
- [ ] Test mobile app

### Phase 3: Backend Migration
- [x] Migrate API endpoints (60+)
- [x] Migrate business logic
- [x] Migrate middleware
- [x] Migrate webhooks
- [x] Migrate cron jobs
- [ ] Test API endpoints

### Phase 4: Web Updates
- [ ] Upgrade to App Router
- [ ] Integrate Expo web build
- [ ] Update marketing pages
- [ ] Test web app

### Phase 5: Deployment
- [x] Create single Vercel config
- [x] Consolidate environment variables
- [x] Update .gitignore
- [x] Update root package.json
- [x] Improve build script
- [ ] Deploy to staging
- [ ] Test all flows
- [ ] Deploy to production
- [ ] Remove old structure

---

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Vercel Deployment Documentation](https://vercel.com/docs)

---

## Support

For questions or issues during migration:
1. Check this guide first
2. Review SmileScore implementation for reference
3. Consult PRD.md for feature specifications
4. Test incrementally and document issues

---

**Last Updated:** January 2025  
**Next Review:** After Phase 2 completion

