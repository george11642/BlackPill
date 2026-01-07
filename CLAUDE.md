# BlackPill - AI Attractiveness Analysis App

## Overview
AI-powered attractiveness analysis with self-improvement tips. Monorepo with mobile app and web backend.

## Tech Stack
- **Mobile**: React Native + Expo 54 (iOS/Android/Web)
- **Web/API**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL + Edge Functions)
- **Payments**: RevenueCat (mobile), Stripe (web)
- **AI**: OpenAI API
- **Deployment**: Vercel + EAS Build

## Project Structure
```
BlackPill/
├── mobile/          # React Native/Expo app
│   ├── screens/     # App screens (Home, Camera, Analysis, etc.)
│   ├── components/  # Reusable UI components
│   └── lib/         # Utilities, Supabase client, theme
├── web/             # Next.js web app
│   ├── app/         # App router pages
│   └── lib/         # Services (AI, achievements, goals, etc.)
├── supabase/
│   ├── functions/   # Edge functions (stripe, admin, affiliate, AI, cron)
│   └── migrations/  # Database migrations
└── docs/            # Documentation
```

## Development Commands
```bash
# Mobile
cd mobile && npm install && npm start

# Web
cd web && npm install && npm run dev

# Root shortcuts
npm run dev:web      # Start web dev
npm run dev:mobile   # Start mobile dev
```

## Key Features
- Face analysis with AI scoring
- Daily routines & task tracking
- AI Coach conversations
- Progress photos & timelapse
- Achievements & leaderboard
- Challenges & affiliate program
- Subscription management

## Environment Variables
- Mobile: `mobile/.env` (see `mobile/env.example`)
- Web: `web/.env.local`
- Required: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `OPENAI_API_KEY`, `STRIPE_*`, `REVENUECAT_*`

## Database
- Supabase PostgreSQL with RLS policies
- Migrations in `supabase/migrations/`
- Edge functions for webhooks, cron, AI processing

## Code Conventions
- TypeScript throughout
- Screen files: `*Screen.tsx`
- Supabase client in `lib/supabase/`
- Keep components focused and single-purpose
- Follow existing patterns when adding features

## API Pattern
- Web API routes deprecated - use Supabase Edge Functions for new endpoints
- Mobile calls Supabase directly via `@supabase/supabase-js`

## Mobile Navigation
- Main tabs: Home, Routines, Camera, Progress, Profile
- Stack navigators for detail screens

## Deployment
- Vercel: web app and legacy API
- EAS Build: iOS/Android binaries
- Supabase CLI: edge functions
