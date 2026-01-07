# Supabase Migration Plan

## Overview
**ALL API routes have been migrated to Supabase.** The web/app/api folder is now empty.

Architecture:
1. **Direct Supabase Client** - Simple CRUD with RLS (no Edge Function needed)
2. **Edge Functions** - Complex logic requiring server-side secrets

## ✅ MIGRATION 100% COMPLETE

### Edge Functions Deployed (8 total)
| Function | Actions | Status |
|----------|---------|--------|
| `/ai` | analyze, coach, recommend, insights, routines, transform | ✅ Active |
| `/webhooks` | stripe, revenuecat | ✅ Active |
| `/cron` | daily-morning, daily-evening, check-renewals, etc. | ✅ Active |
| `/admin` | grant-subscription, sync-subscription, user-delete, user-export, review-queue, review-action | ✅ Active |
| `/timelapse` | generate, get, list, music | ✅ Active |
| `/share` | generate-card, log | ✅ Active |
| `/stripe` | create-checkout, cancel, status | ✅ Active |
| `/affiliate` | generate-code, referral-click, referral-stats, referral-accept, referral-apply, referral-redeem, calculate-commission, creator-apply, creator-dashboard, creator-performance, creator-coupons | ✅ Active |

### Direct Supabase API Wrapper
**File:** `mobile/lib/supabase/api.ts`
- All CRUD operations for: analyses, routines, goals, challenges, achievements, AI coach, user data, ethical settings, checkins, wellness, products
- ~900 lines of direct database access functions

### Smart API Client Routing
**File:** `mobile/lib/api/client.ts`
- Automatically routes CRUD requests to direct Supabase client (bypasses HTTP)
- Routes complex operations to Edge Functions
- Pattern-matching for ~30+ endpoint routes

### API URL Routing
**File:** `mobile/lib/utils/apiUrl.ts`
- All routes mapped to consolidated Edge Functions
- Supports 8 Edge Function endpoints with action-based routing

---

## All Deleted Vercel API Routes

The entire `web/app/api/` folder has been cleared. All routes migrated:

### Mobile API Routes (Deleted)
| Route | Replacement |
|-------|-------------|
| `/api/analyze` | Edge: `/ai?action=analyze` |
| `/api/ai-transform` | Edge: `/ai?action=transform` |
| `/api/ai-coach/*` | Edge + Direct Supabase |
| `/api/analyses/*` | Direct Supabase |
| `/api/achievements/*` | Direct Supabase |
| `/api/routines/*` | Edge + Direct Supabase |
| `/api/goals/*` | Direct Supabase |
| `/api/challenges/*` | Direct Supabase |
| `/api/checkins/*` | Direct Supabase |
| `/api/wellness/*` | Direct Supabase |
| `/api/products/*` | Edge + Direct Supabase |
| `/api/scoring/*` | Direct Supabase |
| `/api/comparisons/*` | Direct Supabase |
| `/api/insights/*` | Edge: `/ai?action=insights` |
| `/api/ethical/*` | Direct Supabase |
| `/api/timelapse/*` | Edge: `/timelapse?action=*` |
| `/api/share/*` | Edge: `/share?action=*` |
| `/api/webhooks/*` | Edge: `/webhooks?provider=*` |
| `/api/cron/*` | Edge: `/cron?job=*` |
| `/api/revenuecat/*` | Edge: `/admin?action=sync-subscription` |
| `/api/user/*` | Edge + Direct Supabase |
| `/api/community/*` | Removed (hidden feature) |
| `/api/leaderboard/*` | Removed (hidden feature) |

### Web API Routes (Deleted)
| Route | Replacement |
|-------|-------------|
| `/api/subscriptions/create-checkout` | Edge: `/stripe?action=create-checkout` |
| `/api/subscriptions/cancel` | Edge: `/stripe?action=cancel` |
| `/api/subscriptions/status` | Edge: `/stripe?action=status` |
| `/api/affiliates/generate-code` | Edge: `/affiliate?action=generate-code` |
| `/api/affiliates/referral-click` | Edge: `/affiliate?action=referral-click` |
| `/api/referral/stats` | Edge: `/affiliate?action=referral-stats` |
| `/api/referral/accept` | Edge: `/affiliate?action=referral-accept` |
| `/api/referral/apply` | Edge: `/affiliate?action=referral-apply` |
| `/api/referrals/redeem` | Edge: `/affiliate?action=referral-redeem` |
| `/api/commissions/calculate` | Edge: `/affiliate?action=calculate-commission` |
| `/api/creators/apply` | Edge: `/affiliate?action=creator-apply` |
| `/api/creators/dashboard` | Edge: `/affiliate?action=creator-dashboard` |
| `/api/creators/performance` | Edge: `/affiliate?action=creator-performance` |
| `/api/creators/coupons` | Edge: `/affiliate?action=creator-coupons` |
| `/api/admin/review-queue` | Edge: `/admin?action=review-queue` |
| `/api/admin/review-action` | Edge: `/admin?action=review-action` |
| `/api/admin/grant-subscription` | Edge: `/admin?action=grant-subscription` |
| `/api/auth/me` | Direct Supabase Auth |

---

## Architecture Summary

```
Mobile App
├── Direct Supabase Client (CRUD)
│   └── mobile/lib/supabase/api.ts
├── Edge Functions (Complex Logic)
│   └── Routed via mobile/lib/api/client.ts
└── apiUrl.ts normalizes endpoints

Supabase Edge Functions (8 Functions)
├── /ai          - All AI operations (OpenAI)
├── /admin       - Admin, subscription sync, user management, review queue
├── /webhooks    - Stripe + RevenueCat webhooks
├── /cron        - Scheduled jobs
├── /timelapse   - Video generation (Cloudinary)
├── /share       - Share card generation
├── /stripe      - Stripe checkout/cancel/status
└── /affiliate   - Affiliate, referral, commission, creator operations

Web App (Vercel)
└── web/app/api/ - EMPTY (all migrated to Supabase)
    └── README.md only
```

## Environment Variables

All secrets are configured in Supabase Edge Functions:
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_PRICE_*`
- `REVENUECAT_WEBHOOK_SECRET`
- `CLOUDINARY_*` (for timelapse/share)
- `RESEND_API_KEY`
- `UPSTASH_REDIS_*` (rate limiting)
