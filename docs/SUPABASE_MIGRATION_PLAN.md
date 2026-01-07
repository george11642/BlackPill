# Supabase Migration Plan

## Overview
All mobile app API routes have been migrated to Supabase:
1. **Direct Supabase Client** - Simple CRUD with RLS (no Edge Function needed)
2. **Edge Functions** - Complex logic requiring server-side secrets

## Current Edge Functions (All Complete)
- `/ai` - analyze, coach, recommend, insights, routines, transform
- `/webhooks` - stripe, revenuecat
- `/cron` - all cron jobs
- `/admin` - grant-subscription, sync-subscription, user-delete, user-export
- `/timelapse` - generate, get, list, music
- `/share` - generate-card, log

## Implementation Status ✅ COMPLETE

### 1. Direct Supabase API Wrapper
**File:** `mobile/lib/supabase/api.ts`
- All CRUD operations for: analyses, routines, goals, challenges, achievements, AI coach, user data, ethical settings, checkins, wellness, products
- ~900 lines of direct database access functions

### 2. Smart API Client Routing
**File:** `mobile/lib/api/client.ts`
- Automatically routes CRUD requests to direct Supabase client (bypasses HTTP)
- Routes complex operations to Edge Functions
- Pattern-matching for ~30+ endpoint routes

### 3. Edge Functions Created
**Files:** `supabase/functions/*/index.ts`
- `/admin?action=sync-subscription` - RevenueCat subscription sync
- `/timelapse?action=generate` - Generate timelapse from analyses
- `/timelapse?action=get` - Get specific timelapse
- `/timelapse?action=list` - List user's timelapses
- `/timelapse?action=music` - Get available music tracks
- `/share?action=generate-card` - Generate share card image
- `/share?action=log` - Log share events

### 4. API URL Routing
**File:** `mobile/lib/utils/apiUrl.ts`
- All routes mapped to consolidated Edge Functions
- Supports 6 Edge Function endpoints with action-based routing

---

## Mobile App Endpoints (Priority)

### Already Migrated to Edge Functions
| Old Route | New Edge Function | Status |
|-----------|-------------------|--------|
| `/api/analyze` | `/ai?action=analyze` | ✅ Done |
| `/api/ai-coach/chat` | `/ai?action=coach` | ✅ Done |
| `/api/ai/transform` | `/ai?action=transform` | ✅ Done |
| `/api/products/recommend` | `/ai?action=recommend` | ✅ Done |
| `/api/routines/generate` | `/ai?action=routines` | ✅ Done |
| `/api/user/delete` | `/admin?action=user-delete` | ✅ Done |

### Convert to Direct Supabase Client
These should use Supabase JS client directly with RLS policies:

| Route | Method | Supabase Table/RPC | Notes |
|-------|--------|-------------------|-------|
| `/api/analyses/history` | GET | `analyses` | Filter by user_id |
| `/api/analyses/[id]` | GET/DELETE | `analyses` | RLS on user_id |
| `/api/analyses/[id]/visibility` | PUT | `analyses` | Update is_public field |
| `/api/achievements` | GET | `user_achievements` + `achievements` | Join query |
| `/api/ai-coach/conversations` | GET | `ai_conversations` | Filter by user_id |
| `/api/ai-coach/conversations/[id]` | GET/DELETE | `ai_conversations` | RLS |
| `/api/ai-coach/messages` | GET | `ai_messages` | Filter by conversation_id |
| `/api/routines` | GET | `routines` | Filter by user_id |
| `/api/routines/[id]` | GET/DELETE | `routines` | RLS |
| `/api/routines/today/tasks` | GET | `routine_tasks` | Filter by date |
| `/api/routines/complete-task` | POST | `routine_tasks` | Update completed_at |
| `/api/goals` | GET | `goals` | Filter by user_id |
| `/api/goals/types` | GET | `goal_types` | Public read |
| `/api/goals/create` | POST | `goals` | Insert |
| `/api/challenges` | GET | `challenges` | Public read |
| `/api/challenges/join` | POST | `challenge_participants` | Insert |
| `/api/challenges/checkin` | POST | `challenge_checkins` | Insert |
| `/api/user/stats` | GET | `users` | Select specific fields |
| `/api/user/onboarding` | POST | `users` | Update |
| `/api/ethical/settings` | GET/PUT | `user_ethical_settings` | RLS |
| `/api/checkins/checkin` | POST | `checkins` | Insert |
| `/api/wellness/data` | GET | `wellness_data` | Filter by user_id |
| `/api/products` | GET | `products` | Public read |

### Need New Edge Functions
| Route | Reason | New Function |
|-------|--------|--------------|
| `/api/timelapse/generate` | Needs Cloudinary | `/timelapse?action=generate` |
| `/api/timelapse/music` | Static/DB | Can be direct Supabase |
| `/api/revenuecat/sync` | Service role key | `/subscriptions?action=sync` |
| `/api/products/click` | Analytics | Can be direct Supabase |
| `/api/user/push-token` | Simple upsert | Direct Supabase |
| `/api/wellness/sync` | Simple insert | Direct Supabase |
| `/api/share/generate-card` | Image gen | `/share?action=generate-card` |

---

## Web-Only Endpoints (Lower Priority)

### Affiliate System
- `/api/affiliates/*` - Commission calculations need Edge Function
- `/api/referral/*` - Stats can be direct Supabase
- `/api/commissions/calculate` - Needs Edge Function

### Creator System
- `/api/creators/*` - Dashboard/performance need aggregations

### Admin System
- `/api/admin/review-queue` - Can extend existing `/admin` Edge Function
- `/api/admin/review-action` - Same

### Subscription (Web Stripe)
- `/api/subscriptions/create-checkout` - Needs Stripe, keep for web
- `/api/subscriptions/status` - Direct Supabase
- `/api/subscriptions/cancel` - Needs Stripe

### Community (Leaderboard hidden)
- `/api/community/*` - Can be direct Supabase if needed later
- `/api/leaderboard/*` - Hidden, can remove

---

## Implementation Steps

### Phase 1: Update Mobile to Use Direct Supabase
1. Create Supabase API wrapper functions in mobile
2. Update each screen to use direct Supabase calls
3. Ensure RLS policies are correct

### Phase 2: Create Missing Edge Functions
1. `/timelapse` - for video generation
2. `/subscriptions` - for RevenueCat sync
3. `/share` - for card generation (if needed)

### Phase 3: Update apiUrl.ts Routing
Add mappings for any new Edge Functions

### Phase 4: Remove Legacy Web API Routes
Delete unused routes from `web/app/api/`

### Phase 5: Clean Up
- Remove unused environment variables
- Update documentation
