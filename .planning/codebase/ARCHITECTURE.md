# System Architecture

## Overview
BlackPill follows a BaaS-first (Backend-as-a-Service) architecture where mobile apps communicate directly with Supabase PostgreSQL using Row Level Security, while complex operations run in Supabase Edge Functions.

## System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  BlackPill App  │   SheMax App    │      Next.js Web            │
│  (React Native) │  (React Native) │      (App Router)           │
└────────┬────────┴────────┬────────┴────────────┬────────────────┘
         │                 │                      │
         └─────────────────┴──────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         │           API LAYER               │
         ├───────────────────────────────────┤
         │  Direct Supabase  │ Edge Functions │
         │  (CRUD + RLS)     │ (Complex ops)  │
         └─────────┬─────────┴───────┬───────┘
                   │                 │
         ┌─────────┴─────────────────┴───────┐
         │         SUPABASE                   │
         ├───────────────────────────────────┤
         │  PostgreSQL  │  Storage  │  Auth   │
         │  (RLS)       │  (Images) │  (JWT)  │
         └─────────────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         │      EXTERNAL SERVICES            │
         ├───────────────────────────────────┤
         │ OpenAI │ Stripe │ RevenueCat │ etc│
         └───────────────────────────────────┘
```

## Data Flow Patterns

### Pattern 1: Direct Supabase (BaaS)
For CRUD operations, mobile apps call Supabase directly:
```
Mobile App → Supabase Client → PostgreSQL (RLS enforced)
```
**Used for:** Analyses history, routines, goals, challenges, achievements

### Pattern 2: Edge Functions
For complex operations requiring server-side logic:
```
Mobile App → HTTP Request → Edge Function → External APIs → Database
```
**Used for:** AI analysis, payments, webhooks, cron jobs

## State Management

### Mobile Apps
- **AuthContext**: User authentication, sessions, onboarding state
- **SubscriptionContext**: Tier, scan limits, AI coach usage
- **Component State**: UI-specific with `useState`

No Redux/Zustand - pure React Context + Hooks pattern.

### Web App
- **AuthContext**: User authentication
- **Server Components**: Data fetching without client state
- **Client Components**: Interactive features only

## Navigation Architecture (Mobile)

```
Stack Navigator (Root)
├── Splash Screen
├── Welcome Screen
├── Auth Stack (Login/Signup)
├── Onboarding Stack
└── App Stack (Main)
    └── Tab Navigator
        ├── Home (Daily Routines)
        ├── Progress (History/Timelapses)
        ├── Shop (Marketplace)
        ├── Coach (AI Chat)
        └── Profile (Settings)
```

## Authentication Flow

```
User → Login/Signup Screen
         ↓
    [Email/Apple/Google]
         ↓
    Supabase Auth (JWT)
         ↓
    Session Storage
    (SecureStore on native, localStorage on web)
         ↓
    [If new user: Onboarding Flow]
         ↓
    Main App
```

## Key Design Patterns

### 1. BaaS-First Architecture
- Supabase as primary data layer
- Row Level Security enforces authorization
- No separate backend for CRUD operations

### 2. Adapter Pattern (API Client)
```typescript
if (isDirectSupabaseRoute(endpoint)) {
  return SupabaseAPI.handler(endpoint);
} else {
  return fetch(`${SUPABASE_URL}/functions/v1/...`);
}
```

### 3. Platform Abstraction
Supabase client abstracts storage differences:
- Native: `expo-secure-store` (encrypted)
- Web: `localStorage`

### 4. Feature-Based Context
```typescript
const TIER_FEATURES = {
  free: { analyses_per_month: 1, ai_coach: false },
  pro: { analyses_per_month: 50, ai_coach: true },
  elite: { analyses_per_month: Infinity, ai_coach: true }
};
```

### 5. Dual App Strategy
- `mobile/` = BlackPill brand
- `shemax-mobile/` = SheMax brand
- Same code, different branding
- Independent deployments

## Data Flow Examples

### Face Analysis
```
1. CameraScreen captures image
2. API Client routes to Edge Function
3. Edge Function:
   - Validates user/scan limits
   - Uploads to Supabase Storage
   - Calls OpenAI Vision API
   - Stores analysis result
4. AnalysisResultScreen displays breakdown
```

### Subscription Upgrade (Mobile)
```
1. SubscriptionScreen → RevenueCat SDK
2. RevenueCat handles in-app purchase
3. Webhook → Edge Function
4. Edge Function updates user tier
5. SubscriptionContext detects change
6. UI updates to show pro features
```
