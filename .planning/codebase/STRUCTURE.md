# Directory Structure

## Root Layout
```
BlackPill/
├── mobile/              # BlackPill React Native app
├── shemax-mobile/       # SheMax React Native app (branded copy)
├── web/                 # Next.js web application
├── supabase/            # Database & Edge Functions
├── docs/                # Documentation
├── scripts/             # Utility scripts
├── package.json         # Root workspace scripts
└── CLAUDE.md            # Project instructions
```

## Mobile Directory (`mobile/`)

```
mobile/
├── App.tsx                     # Root component + navigation
├── app.json                    # Expo configuration
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
│
├── screens/                    # Full screen components
│   ├── SplashScreen.tsx
│   ├── WelcomeScreen.tsx
│   ├── LoginScreen.tsx
│   ├── SignupScreen.tsx
│   ├── OnboardingScreen.tsx
│   ├── HomeScreen.tsx          # Tab navigator entry
│   ├── DailyRoutineScreen.tsx  # Home tab content
│   ├── ProgressScreen.tsx      # Trending tab
│   ├── MarketplaceScreen.tsx   # Shop tab
│   ├── AICoachScreen.tsx       # Coach tab
│   ├── ProfileScreen.tsx       # Profile tab
│   ├── CameraScreen.tsx        # Photo capture
│   ├── AnalysisResultScreen.tsx
│   ├── RoutinesScreen.tsx
│   ├── ChallengesScreen.tsx
│   ├── AchievementsScreen.tsx
│   ├── SubscriptionScreen.tsx
│   └── ... (20+ screens)
│
├── components/                 # Reusable UI components
│   ├── index.ts               # Barrel export
│   ├── BackHeader.tsx
│   ├── GlassCard.tsx
│   ├── PrimaryButton.tsx
│   ├── GradientText.tsx
│   ├── ErrorBoundary.tsx
│   ├── analysis/              # Analysis-specific
│   │   ├── DeepDivePage.tsx
│   │   ├── ImprovePage.tsx
│   │   └── RatingsPage.tsx
│   └── ... (20+ components)
│
├── lib/                        # Business logic
│   ├── theme.ts               # Colors, spacing, typography
│   ├── types/
│   │   └── index.ts           # TypeScript definitions
│   ├── api/
│   │   ├── client.ts          # API routing layer
│   │   ├── products.ts
│   │   └── analyses.ts
│   ├── supabase/
│   │   ├── client.ts          # Supabase initialization
│   │   └── api.ts             # Direct database queries
│   ├── auth/
│   │   └── context.tsx        # AuthProvider
│   ├── subscription/
│   │   ├── context.tsx        # SubscriptionProvider
│   │   └── constants.ts       # Tier definitions
│   ├── revenuecat/
│   │   └── client.ts          # IAP integration
│   ├── achievements/
│   │   └── events.ts
│   ├── routines/
│   │   └── routineSuggestionEngine.ts
│   └── video/
│       └── ffmpeg-client.ts
│
├── assets/                     # Static files
│   ├── images/
│   ├── icons/
│   └── animations/
│
└── plugins/                    # Expo plugins
    └── notificationPlugin.ts
```

## Web Directory (`web/`)

```
web/
├── next.config.js              # Next.js config
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
│
├── app/                        # Next.js App Router
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Landing page
│   ├── globals.css            # Global styles
│   │
│   ├── dashboard/             # Protected routes
│   │   └── page.tsx
│   ├── pricing/
│   │   └── page.tsx
│   ├── admin/
│   │   └── page.tsx
│   ├── support/
│   │   └── page.tsx
│   ├── terms/
│   │   └── page.tsx
│   ├── privacy/
│   │   └── page.tsx
│   │
│   ├── shemax/                # SheMax branded pages
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── pricing/
│   │   └── dashboard/
│   │
│   └── components/            # Page-specific components
│       ├── Navigation.tsx
│       ├── PricingCard.tsx
│       └── Footer.tsx
│
├── components/                 # Shared components
│   ├── ui/
│   │   ├── Button.tsx
│   │   └── Card.tsx
│   └── layout/
│       └── Header.tsx
│
├── lib/                        # Business logic
│   ├── config.ts
│   ├── supabase/
│   │   ├── client.ts          # Browser client
│   │   ├── server.ts          # Server client
│   │   └── admin.ts           # Admin client
│   ├── auth/
│   │   └── context.tsx
│   ├── ai/
│   │   └── analyze.ts
│   ├── achievements/
│   │   └── service.ts
│   ├── goals/
│   │   └── service.ts
│   ├── notifications/
│   │   └── push.ts
│   ├── emails/
│   │   └── service.ts
│   └── video/
│       └── timelapse-generator.ts
│
└── public/                     # Static assets
    └── favicon.ico
```

## Supabase Directory

```
supabase/
├── functions/                  # Edge Functions (Deno)
│   ├── _shared/               # Shared utilities
│   │   ├── cors.ts
│   │   ├── auth.ts
│   │   ├── openai.ts
│   │   ├── stripe.ts
│   │   └── resend.ts
│   │
│   ├── ai/
│   │   └── index.ts           # analyze, coach, recommend
│   ├── stripe/
│   │   └── index.ts           # checkout, webhooks
│   ├── affiliate/
│   │   └── index.ts           # referral tracking
│   ├── webhooks/
│   │   └── index.ts           # payment webhooks
│   ├── cron/
│   │   └── index.ts           # scheduled jobs
│   ├── admin/
│   │   └── index.ts           # admin operations
│   ├── share/
│   │   └── index.ts
│   └── timelapse/
│       └── index.ts
│
└── migrations/                 # Database schema
    ├── 001_initial_schema.sql
    ├── 002_row_level_security.sql
    ├── 003_routines.sql
    └── ... (25+ migrations)
```

## Shared Code (Mobile Apps)

**Files that MUST stay in sync:**
- `lib/supabase/` - Database client & queries
- `lib/auth/` - Authentication context
- `lib/api/` - API routing layer
- `lib/subscription/` - Subscription management
- `screens/*` - All screen components
- `components/*` - UI components

**Files that can differ (branding):**
- `lib/theme.ts` - Colors
- `assets/` - Logos, images
- `app.json` - App configuration
