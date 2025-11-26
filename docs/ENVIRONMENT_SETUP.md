# Environment Variables Setup

This document describes all environment variables needed for the BlackPill monorepo.

## Root `.env` File

Create a `.env` file in the root directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Mobile Supabase (Expo needs EXPO_PUBLIC_ prefix)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://black-pill.app
NEXT_PUBLIC_APP_NAME=BlackPill
EXPO_PUBLIC_APP_URL=https://black-pill.app
EXPO_PUBLIC_APP_NAME=BlackPill
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Email (Resend)
RESEND_API_KEY=re_your-resend-api-key
RESEND_FROM_EMAIL=noreply@black-pill.app
# Note: RESEND_FROM_EMAIL is also used for VAPID web push contact email

# Push Notifications (VAPID for Web Push)
# Public key is hardcoded in code, only private key needed in env
VAPID_PRIVATE_KEY=sSG1amOZZ1vClBT46KAAqbVbxTb_r3j-LssfifJX5Hc
# Expo Push Notifications work automatically - no keys needed!

# Analytics (PostHog)
POSTHOG_API_KEY=phc_your-posthog-api-key
NEXT_PUBLIC_POSTHOG_KEY=phc_your-posthog-public-key
EXPO_PUBLIC_POSTHOG_KEY=phc_your-posthog-public-key
POSTHOG_HOST=https://app.posthog.com

# Redis (Rate Limiting & Caching)
# Redis Labs (Redis Cloud) format: rediss://default:PASSWORD@HOST:PORT
# Note: Redis Labs requires TLS, so use rediss:// (with double 's') protocol
# Example: rediss://default:password@your-redis-host.redis.cloud:12345
blackpill_REDIS_URL=rediss://default:password@your-redis-host.redis.cloud:port
# Alternative name (either works)
REDIS_URL=rediss://default:password@your-redis-host.redis.cloud:port

# Cron Job Configuration (for Supabase pg_cron)
# This secret is stored in Supabase Vault and used by cron functions
# Set this to match the CRON_SECRET value stored in Supabase Vault
CRON_SECRET=your-cron-secret-key-here

# Environment
NODE_ENV=production
```

## Web `.env` File

Create `web/.env.local` for Next.js (used during development):

```bash
# Same variables as root .env
# Next.js will automatically load .env.local
```

## Mobile `.env` File

Create `mobile/.env` for Expo (used during development):

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App Configuration
EXPO_PUBLIC_APP_URL=https://black-pill.app
EXPO_PUBLIC_APP_NAME=BlackPill
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id

# Analytics (PostHog)
EXPO_PUBLIC_POSTHOG_KEY=phc_your-posthog-public-key
EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## Vercel Environment Variables

When deploying to Vercel, add all these variables in the Vercel dashboard:

1. Go to Project Settings → Environment Variables
2. Add each variable listed above
3. Set them for Production, Preview, and Development environments as needed

**Important:** 
- Variables prefixed with `NEXT_PUBLIC_` and `EXPO_PUBLIC_` are exposed to the client
- Never expose `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, or other secrets to the client
- Use Vercel's environment variable encryption for sensitive values

## Security Notes

- **Never commit `.env` files** - They are in `.gitignore`
- **Use different keys for development and production**
- **Rotate keys regularly**
- **Use Vercel's environment variable management** for production deployments

