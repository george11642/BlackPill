# Black Pill - Product Requirements Document (PRD)

## Document Control

**Version:** 1.0

**Last Updated:** October 27, 2025

**Status:** APPROVED - This document is LAW for all development

**Owner:** Product Team

---

## Executive Summary

**Black Pill** is a mobile-first attractiveness analysis application that provides honest, AI-powered facial assessment with actionable self-improvement tips. The app combines computer vision, GPT-based insights, and viral sharing mechanics to create a self-sustaining growth engine.

**Positioning Statement:**

> "Black Pill - Be Honest About Yourself"

>

> Get your real attractiveness score, detailed breakdown, and actionable tips to improve. Share with friends, build your streak, rise the leaderboard.

**Core Principles:**

- ✅ Constructive feedback focused on self-improvement
- ✅ Transparent pricing and ethical monetization
- ✅ Privacy-first data handling
- ✅ NO incel ideology, fatalism, or toxic terminology
- ✅ Positive, actionable insights only

---

## 1. Product Vision & Goals

### 1.1 Vision

Empower men aged 18-35 to understand and improve their appearance through honest AI analysis and actionable guidance.

### 1.2 Success Metrics (6-Month Targets)

- **200K MAU** (Monthly Active Users)
- **$600K MRR** (Monthly Recurring Revenue)
- **40%+ DAU/MAU** ratio
- **0.5-1.0 Viral Coefficient**
- **15-20% Subscription Rate**
- **<5% Monthly Churn**

### 1.3 Target Audience

- **Primary:** Men aged 18-35 interested in self-improvement
- **Secondary:** Fitness/style content creators (affiliate program)
- **Geographic:** US/UK/Canada (Phase 1), Global (Phase 2)

---

## 2. Design System & Brand

### 2.1 Visual Identity

**Color Palette:**

```
BACKGROUNDS:
- Deep Black: #0F0F1E
- Dark Gray: #1A1A2E (cards)
- Charcoal: #2A2A3E (hover)

NEON ACCENTS:
- Pink: #FF0080 (primary actions)
- Cyan: #00D9FF (secondary actions)
- Purple: #B700FF (premium)
- Yellow: #FFFF00 (warnings)
- Green: #00FF41 (success)

TEXT:
- Primary: #FFFFFF
- Secondary: #B8BACC
- Tertiary: #6B6D7F
- Disabled: #4A4C5A
```

**Typography:**

- Font Family: Inter (Google Fonts)
- Weights: 400, 500, 600, 700
- H1: 36px Bold, -1px letter-spacing
- Body: 14px Regular, 1.6 line-height
- Button: 14px SemiBold

**Component System:**

- Glass Cards: `rgba(26,26,46,0.7)` + `blur(10px)` + `1px border rgba(255,255,255,0.1)`
- Primary Button: Gradient #FF0080 → #00D9FF, 56px height, 12px radius
- Input Fields: 48px height, glassmorphic background, 2px pink border on focus
- Score Display: 140x140px circle, gradient border, neon glow

**Accessibility Requirements:**

- WCAG 2.1 AA compliance
- Minimum 4.5:1 contrast ratio for text
- Touch targets ≥44x44px
- Screen reader support (iOS VoiceOver, Android TalkBack)
- Keyboard navigation support

### 2.2 Animations

- Fast: 200ms (hover states)
- Normal: 300ms (transitions)
- Slow: 500ms (score reveals)
- Confetti: 800ms (achievements)
- Easing: ease-in-out (default)

---

## 3. Feature Specifications

### 3.1 MVP Features (Phase 1: Weeks 1-4)

#### F1: Authentication

**Requirements:**

- Email/password signup with validation
- Google OAuth (Supabase Auth)
- Password reset via email
- Session persistence (30 days)
- Account deletion (GDPR compliance)

**Security:**

- bcrypt password hashing (cost factor 12)
- Rate limiting: 5 attempts per 15 minutes
- Email verification required for signup
- 2FA optional (Phase 2)

**Age Verification:**

- Checkbox: "I confirm I am 18 years or older"
- Stored in `users.age_verified` (boolean)
- Blocked if unchecked

#### F2: Photo Analysis

**Requirements:**

- Camera capture OR gallery upload
- Face detection validation (Google Cloud Vision)
- Image preprocessing (crop, resize, normalize)
- AI analysis via OpenAI GPT-4o Mini
- Score calculation (1-10 scale, 1 decimal)
- 6-dimension breakdown: Symmetry, Jawline, Eyes, Lips, Skin Quality, Bone Structure
- 3-5 personalized AI tips

**Photo Quality Validation:**

- Minimum resolution: 640x640px
- Face must occupy 40-60% of frame
- Single face detection (reject group photos)
- Lighting quality check (not too dark/bright)
- Error message if validation fails

**AI Prompt Guidelines:**

- MUST use constructive language
- MUST avoid terms: "subhuman," "it's over," "cope," "rope," "beta," "alpha"
- MUST frame tips as actionable improvements
- MUST include timeframes for improvements (e.g., "1-2 weeks")
- MUST focus on controllable factors (grooming, fitness, skincare)

**Performance:**

- Analysis completion: <30 seconds (95th percentile)
- Progress updates every 2 seconds
- Graceful failure with retry option

**Privacy:**

- Images stored in Supabase Storage (encrypted at rest)
- Auto-delete after 90 days (configurable)
- User can delete anytime
- Images NEVER shared without explicit consent
- NO facial recognition training data

#### F3: Results & Sharing

**Requirements:**

- Animated score reveal with confetti (score ≥ 7.5)
- Breakdown bars with animated fill
- AI insights card (glassmorphic)
- Share card generation (1080x1920px PNG)
- Share buttons: iMessage, WhatsApp, Instagram, TikTok, Copy Link
- Referral code embedded in share card

**Share Card Specifications:**

- Background: Solid #0F0F1E with subtle gradient
- Score: Large, centered, neon pink
- Breakdown: 6 categories with scores
- Referral code: Mono font, centered
- QR code: 120x120px, pink color
- Watermark: "blackpill.app" footer
- Generated server-side (Vercel function + Puppeteer)

**Analytics Tracking:**

- Log share events to `share_logs` table
- Track platform (iMessage, WhatsApp, etc.)
- Track referral acceptance conversion rate

#### F4: Referral System

**Requirements:**

- Auto-generate unique referral code on signup (format: `INVITE-XXXX-YYYY`)
- Deep link handling: `blackpill://ref/[code]` and `https://blackpill.app/ref/[code]`
- Referral acceptance flow:

  1. New user clicks link
  2. App shows: "You got 5 free scans from [Referrer Name]!"
  3. User signs up
  4. Both users receive 5 bonus scans
  5. Both users notified via push notification

**Fraud Prevention:**

- Max 1 referral per device ID per 30 days
- Max 50 referrals per user per month
- Flag accounts with >80% referral acceptance rate for review
- No self-referrals (IP + device fingerprinting)

**Referral Stats Dashboard:**

- Total invited: count
- Accepted: count
- Pending: count
- Bonus scans earned: total
- Invite streak: consecutive days with ≥1 invite
- Leaderboard rank (by invite count)

#### F5: Subscriptions & Paywall

**Tiers:**

| Tier | Price | Scans | Features |

|------|-------|-------|----------|

| Free | $0 | 1 lifetime | Basic score, limited tips |

| Basic | $4.99/mo, $54.99/yr | 5/month | Full breakdown, AI tips, ad-free |

| Pro | $9.99/mo, $109.89/yr | 20/month | Basic + priority analysis, referral bonuses |

| Unlimited | $19.99/mo, $219.89/yr | Unlimited | Pro + AI coach mode, priority support |

**Paywall Trigger:**

- Show after 1st free scan used
- Dismissible (continue with referral scans)
- Re-show after all scans depleted

**Checkout Flow:**

1. User taps "Subscribe to [Tier]"
2. Redirect to web: `https://blackpill.app/subscribe?tier=[tier]&user_id=[id]`
3. Stripe Checkout (email pre-filled, card input)
4. Success → Redirect to app: `blackpill://subscribe/success`
5. Webhook updates `subscriptions` table
6. App polls subscription status

**Subscription Management:**

- Cancel anytime (effective end of period)
- Manage via Stripe Customer Portal
- Auto-renewal notifications (7 days before)
- Downgrade/upgrade support

**Refund Policy:**

- 7-day money-back guarantee (no questions asked)
- Processed via Stripe (automatic)
- Communicated in checkout flow

#### F6: Onboarding

**Screens:**

1. Welcome/Splash (logo, tagline, CTA)
2. Email Signup OR Google Auth
3. Permissions Request (camera access)
4. First Scan Intro (best practices guide)

**Best Practices Guide:**

- ✅ Natural lighting
- ✅ No filters or heavy makeup edits
- ✅ Face fills 50% of frame
- ✅ Neutral expression recommended
- ✅ Clear background preferred

**First-Time UX Goal:**

- 80% of users complete signup → first scan in <5 minutes
- Measure via funnel analytics (PostHog)

---

### 3.2 Phase 2 Features (Weeks 5-12)

#### F7: Leaderboard

**Requirements:**

- Weekly top-rated users (score DESC)
- User profiles (username, avatar, bio, location, stats)
- Your rank display (highlighted row)
- Filters: This Week, All-Time, By Location
- Top 3 badges: 🥇 Gold, 🥈 Silver, 🥉 Bronze

**Privacy Options:**

- Profile visibility: Public (default) or Private
- Private profiles excluded from leaderboard
- Username required for leaderboard participation

**Ranking Algorithm:**

- Based on highest single score (not average)
- Recalculated weekly (Sunday 00:00 UTC)
- Tie-breaker: earliest analysis timestamp

#### F8: Progress Tracking

**Requirements:**

- "Compare Over Time" screen
- Line chart: score history (last 30/90/365 days)
- Average score calculation
- Best score highlight
- Improvement percentage vs. last scan

**UI Specifications:**

- Chart library: fl_chart (Flutter)
- Colors: Pink gradient line, white points
- Y-axis: 0-10 scale
- X-axis: Date labels

**Motivation:**

- Emphasis on self-improvement journey
- Positive framing: "You've improved 0.3 points in 30 days!"
- Achievement badges for milestones (first 8.0, 5-scan streak, etc.)

#### F9: Community Features

**Requirements:**

- Comment on public analyses (opt-in)
- Upvote/downvote system
- Report abuse button
- Discussion threads (optional)

**Content Moderation:**

- AI pre-filtering (OpenAI Moderation API)
- Blocked terms list (toxic terminology)
- User reporting → manual review queue
- Ban system (1st: warning, 2nd: 7-day ban, 3rd: permanent)

**Community Guidelines:**

- Be constructive and supportive
- No harassment, bullying, or hate speech
- No sharing others' photos without consent
- No spamming or self-promotion (except creators)

#### F10: Creator/Affiliate Program

**Requirements:**

- Creator signup form (name, Instagram/TikTok handle, follower count)
- Manual approval process (review within 48 hours)
- Unique affiliate link: `bp.app/ref/[creator_handle]`
- Commission structure:
  - Nano (1K-10K): 30% recurring
  - Micro (10K-100K): 25% recurring
  - Macro (100K+): 20% recurring + custom bonuses

**Creator Dashboard (Web):**

- Overview: Total earnings, clicks, conversions, conversion rate
- Performance: Daily charts (clicks, conversions, revenue)
- Tools: Scripts, graphics, video assets
- Coupons: Generate discount codes (e.g., CREATOR50 = 50% off first month)
- Earnings: Payment history, upcoming payouts (via Stripe Connect)

**Fraud Detection:**

- Click fraud: Max 10 clicks per IP per day
- Conversion fraud: Flag if conversion rate >15% (manual review)
- Coupon abuse: Max 100 uses per coupon
- Payout hold: 30-day dispute window

**Payout Schedule:**

- Monthly on 15th (for previous month)
- Minimum threshold: $50
- Payment via Stripe Connect (bank transfer)

---

## 4. Technical Architecture

### 4.1 Tech Stack

| Component | Technology | Justification |

|-----------|-----------|---------------|

| Mobile App | Flutter 3.35+ | Cross-platform (iOS + Android), fast development |

| State Management | Riverpod 2.x | Type-safe, reactive, testable |

| Backend API | Vercel + Express.js | Serverless, auto-scaling, edge network |

| Database | Supabase PostgreSQL | Managed, RLS, real-time, Auth built-in |

| AI Analysis | OpenAI GPT-4o Mini | Cost-effective, fast, high-quality |

| Face Detection | Google Cloud Vision | Industry-leading accuracy |

| Payments | Stripe | Standard, reliable, low fees |

| Storage | Supabase Storage + Cloudflare CDN | S3-compatible, fast delivery |

| Analytics | PostHog | Open-source, privacy-friendly, event tracking |

| Error Tracking | Sentry | Real-time alerts, stack traces |

| Email | Resend | Developer-friendly, templates |

| Push Notifications | Firebase Cloud Messaging | Cross-platform, reliable |

### 4.2 Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│           MOBILE APP (Flutter)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  Auth    │  │ Analysis │  │  Share   │     │
│  │ Screens  │  │ Screens  │  │ Screens  │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│         │              │              │         │
│  ┌──────▼──────────────▼──────────────▼──────┐ │
│  │        Riverpod State Management           │ │
│  └──────┬──────────────┬──────────────┬──────┘ │
│         │              │              │         │
│  ┌──────▼──────┐ ┌─────▼─────┐ ┌─────▼─────┐  │
│  │ Supabase    │ │   API     │ │ Analytics │  │
│  │  Client     │ │  Service  │ │  Service  │  │
│  └─────────────┘ └───────────┘ └───────────┘  │
└─────────────────────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
    ┌────▼────┐ ┌────▼────┐ ┌───▼────┐
    │Supabase │ │ Vercel  │ │PostHog │
    │  Auth   │ │   API   │ │Analytics│
    │  + DB   │ └────┬────┘ └────────┘
    │ Storage │      │
    └─────────┘      │
              ┌──────┼──────┐
              │      │      │
         ┌────▼──┐ ┌▼────┐ ┌▼──────┐
         │OpenAI │ │GCloud│ │Stripe │
         │  API  │ │Vision│ │  API  │
         └───────┘ └──────┘ └───────┘
```

### 4.3 Data Flow: Photo Analysis

```
1. User uploads photo → Flutter ImagePicker
2. Image compressed (max 2MB, JPEG 85%) → Flutter image package
3. Upload to Supabase Storage → signed URL returned
4. POST /api/analyze with image_url
5. Vercel function:
   a. Download image from signed URL
   b. Google Cloud Vision face detection
   c. Extract face landmarks (68 points)
   d. Calculate feature metrics (symmetry, proportions)
   e. OpenAI API call with metrics + image (vision model)
   f. Parse response (score + breakdown + tips)
   g. Store in `analyses` table
   h. Return JSON response
6. App receives response → update state
7. Navigate to Results screen
8. Trigger confetti animation (if score ≥ 7.5)
```

### 4.4 Caching Strategy

**Client-Side (Flutter):**

- User profile: Cache 1 hour (Riverpod `keepAlive`)
- Analysis history: Cache 5 minutes
- Leaderboard: Cache 30 minutes
- Subscription status: Poll every app launch + after checkout

**Server-Side (Vercel):**

- No caching for /api/analyze (always fresh)
- Cache leaderboard: 15 minutes (Redis or Vercel KV)
- Cache creator stats: 1 hour

**CDN (Cloudflare):**

- Share card images: Cache 7 days
- Static assets: Cache 30 days

### 4.5 Rate Limiting

| Endpoint | Limit | Window |

|----------|-------|--------|

| POST /api/analyze | 5 requests | 10 minutes (free), 20 requests (premium) |

| POST /api/auth/signup | 3 requests | 1 hour per IP |

| GET /api/leaderboard | 60 requests | 1 minute |

| POST /api/share/generate-card | 10 requests | 1 hour |

| Creator endpoints | 100 requests | 1 minute |

**Implementation:** Vercel Edge Middleware + Upstash Redis

### 4.6 Error Handling

**Client-Side:**

- Network errors: Retry 3 times with exponential backoff (1s, 2s, 4s)
- 4xx errors: Show user-friendly message (don't retry)
- 5xx errors: Show "Server error, please try again" (retry)
- Offline mode: Queue actions, sync when online

**Server-Side:**

- All errors logged to Sentry (context: user_id, endpoint, request_id)
- 400: Invalid request (e.g., bad image format)
- 401: Unauthorized (invalid token)
- 403: Forbidden (e.g., tier restriction)
- 429: Rate limited (return Retry-After header)
- 500: Internal error (generic message to client, detailed log to Sentry)

**Graceful Degradation:**

- If OpenAI API down: Fall back to rule-based scoring (temporary)
- If Google Vision down: Skip face detection (manual review queue)
- If Stripe down: Show "Payment processing unavailable" (email support)

---

## 5. Database Schema

### 5.1 Core Tables

```sql
-- users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  google_id TEXT UNIQUE,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by UUID REFERENCES users(id),
  scans_remaining INT DEFAULT 1,
  total_scans_used INT DEFAULT 0,
  tier TEXT DEFAULT 'free',
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  age_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- analyses
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT,
  image_thumbnail_url TEXT,
  score DECIMAL(3,1) NOT NULL,
  breakdown JSONB NOT NULL,
  tips JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  tier TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  canceled_at TIMESTAMPTZ
);

-- referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  bonus_scans_given INT DEFAULT 5,
  status TEXT DEFAULT 'pending',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- leaderboard_weekly
CREATE TABLE leaderboard_weekly (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score DECIMAL(3,1) NOT NULL,
  rank INT NOT NULL,
  week_starting DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- creators
CREATE TABLE creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  instagram_handle TEXT,
  tiktok_handle TEXT,
  instagram_follower_count INT,
  tiktok_follower_count INT,
  affiliate_link TEXT UNIQUE NOT NULL,
  tier TEXT DEFAULT 'nano',
  commission_rate DECIMAL(3,2) NOT NULL,
  total_earned DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- affiliate_clicks
CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  device_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- affiliate_conversions
CREATE TABLE affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tier TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  commission_earned DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- affiliate_coupons
CREATE TABLE affiliate_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  discount_percent INT NOT NULL,
  uses INT DEFAULT 0,
  max_uses INT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- share_logs
CREATE TABLE share_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- support_tickets
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'normal',
  assigned_to UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 Row-Level Security (RLS)

```sql
-- Users see own data
CREATE POLICY "users_select_own" ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users FOR UPDATE
  USING (auth.uid() = id);

-- Analyses: owner OR public
CREATE POLICY "analyses_select" ON analyses FOR SELECT
  USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "analyses_insert_own" ON analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "analyses_update_own" ON analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "analyses_delete_own" ON analyses FOR DELETE
  USING (auth.uid() = user_id);

-- Subscriptions: own only
CREATE POLICY "subscriptions_select_own" ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Referrals: participants only
CREATE POLICY "referrals_select_participants" ON referrals FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Leaderboard: public
CREATE POLICY "leaderboard_select_all" ON leaderboard_weekly FOR SELECT
  USING (TRUE);

-- Creators: own data OR admin
CREATE POLICY "creators_select_own" ON creators FOR SELECT
  USING (auth.uid() = user_id);

-- Share logs: own only
CREATE POLICY "share_logs_select_own" ON share_logs FOR SELECT
  USING (auth.uid() = user_id);
```

### 5.3 Indexes

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX idx_analyses_score ON analyses(score DESC);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_referrals_from_user ON referrals(from_user_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_leaderboard_week_score ON leaderboard_weekly(week_starting, score DESC);
CREATE INDEX idx_creators_tier ON creators(tier);
CREATE INDEX idx_affiliate_clicks_creator_date ON affiliate_clicks(creator_id, created_at DESC);
CREATE INDEX idx_affiliate_conversions_creator ON affiliate_conversions(creator_id);
```

---

## 6. API Specifications

### 6.1 Authentication Endpoints

```
POST /api/auth/signup
  Body: { email: string, password: string, age_verified: boolean }
  Response: { user_id: UUID, token: string, referral_code: string }
  Errors: 400 (invalid email/password), 409 (email exists)

POST /api/auth/login
  Body: { email: string, password: string }
  Response: { user_id: UUID, token: string, tier: string, scans_remaining: int }
  Errors: 401 (invalid credentials), 403 (account suspended)

POST /api/auth/google
  Body: { id_token: string }
  Response: { user_id: UUID, token: string, is_new_user: boolean }
  Errors: 401 (invalid token)

GET /api/auth/me
  Headers: Authorization: Bearer [token]
  Response: { id, email, tier, scans_remaining, referral_code, username }
  Errors: 401 (invalid/expired token)

POST /api/auth/logout
  Headers: Authorization: Bearer [token]
  Response: { success: true }
```

### 6.2 Analysis Endpoints

```
POST /api/analyze
  Headers: Authorization: Bearer [token]
  Body: multipart/form-data { image: File }
  Response: {
    analysis_id: UUID,
    score: number,
    breakdown: {
      symmetry: number,
      jawline: number,
      eyes: number,
      lips: number,
      skin: number,
      bone_structure: number
    },
    tips: [
      { title: string, description: string, timeframe: string },
      ...
    ],
    scans_remaining: int
  }
  Errors:
    400 (invalid image, no face detected, multiple faces, poor quality)
    403 (no scans remaining, tier restriction)
    429 (rate limited)
    500 (AI service error)

GET /api/analyses
  Headers: Authorization: Bearer [token]
  Query: limit=10, offset=0, order_by='created_at'
  Response: { analyses: [...], total: int }

GET /api/analyses/:id
  Headers: Authorization: Bearer [token]
  Response: { analysis object }
  Errors: 404 (not found), 403 (not authorized)

DELETE /api/analyses/:id
  Headers: Authorization: Bearer [token]
  Response: { success: true }
  Note: Soft delete (sets deleted_at), image auto-deleted after 90 days
```

### 6.3 Referral Endpoints

```
POST /api/referral/accept
  Headers: Authorization: Bearer [token]
  Body: { referral_code: string }
  Response: {
    bonus_scans: int,
    referrer_name: string,
    message: string
  }
  Errors: 400 (invalid code), 409 (already used), 403 (fraud detected)

GET /api/referral/stats
  Headers: Authorization: Bearer [token]
  Response: {
    referral_code: string,
    total_invited: int,
    accepted: int,
    pending: int,
    total_bonus_scans: int,
    invite_streak: int
  }

GET /api/leaderboard/referrals
  Query: limit=10, offset=0
  Response: {
    leaderboard: [
      { rank: int, username: string, total_invited: int, accepted: int },
      ...
    ]
  }
```

### 6.4 Subscription Endpoints

```
POST /api/subscriptions/create-checkout
  Headers: Authorization: Bearer [token]
  Body: { tier: string, interval: 'monthly'|'annual', coupon_code?: string }
  Response: { session_id: string, checkout_url: string }
  Errors: 400 (invalid tier), 409 (already subscribed)

GET /api/subscriptions/status
  Headers: Authorization: Bearer [token]
  Response: {
    tier: string,
    status: string,
    current_period_start: timestamp,
    current_period_end: timestamp,
    cancel_at_period_end: boolean,
    manage_url: string
  }

POST /api/subscriptions/cancel
  Headers: Authorization: Bearer [token]
  Response: { success: true, effective_date: timestamp }

POST /api/webhooks/stripe
  Headers: Stripe-Signature: [signature]
  Body: Stripe event object
  Response: { received: true }
  Note: Handles subscription.created, subscription.updated, subscription.deleted, invoice.paid
```

### 6.5 Creator Endpoints

```
POST /api/creators/apply
  Headers: Authorization: Bearer [token]
  Body: {
    name: string,
    instagram_handle: string,
    tiktok_handle: string,
    follower_count: int,
    bio: string
  }
  Response: { application_id: UUID, status: 'pending' }

GET /api/creators/dashboard
  Headers: Authorization: Bearer [creator_token]
  Response: {
    creator_id: UUID,
    affiliate_link: string,
    tier: string,
    commission_rate: number,
    stats: {
      total_clicks: int,
      total_conversions: int,
      conversion_rate: number,
      revenue_this_month: number,
      payout_pending: number,
      next_payout_date: date
    }
  }

GET /api/creators/performance
  Headers: Authorization: Bearer [creator_token]
  Query: start_date, end_date
  Response: {
    daily_data: [
      { date: string, clicks: int, conversions: int, revenue: number },
      ...
    ]
  }

POST /api/creators/coupons
  Headers: Authorization: Bearer [creator_token]
  Body: { code: string, discount_percent: int, max_uses?: int, expires_at?: timestamp }
  Response: { coupon_id: UUID, code: string, tracking_url: string }

GET /api/share/generate-card
  Headers: Authorization: Bearer [token]
  Query: analysis_id=UUID
  Response: { image_url: string, share_url: string }
  Note: PNG generated server-side, cached for 7 days
```

---

## 7. Privacy & Compliance

### 7.1 GDPR Compliance

**User Rights:**

- ✅ Right to access (export all data via /api/user/export)
- ✅ Right to deletion (permanent account deletion within 30 days)
- ✅ Right to rectification (edit profile, username, email)
- ✅ Right to data portability (JSON export)
- ✅ Right to object (opt-out of marketing emails)

**Data Retention:**

- User data: Retained until account deletion
- Analyses: Auto-delete after 90 days (configurable)
- Deleted accounts: Hard delete after 30-day grace period
- Logs: Retained 90 days (error logs), 365 days (analytics)

**Consent:**

- Explicit checkbox: "I agree to Terms & Privacy Policy"
- Cookie consent banner (web only)
- Email opt-in for marketing (default: unchecked)

### 7.2 CCPA Compliance

**Do Not Sell My Personal Information:**

- Link in footer + settings
- We do NOT sell user data
- Affiliates receive aggregated stats only (no PII)

**Data Categories Collected:**

- Identifiers: email, username, device ID
- Photos: Facial images (encrypted, auto-deleted)
- Usage: Analysis history, share logs, subscription status
- Device: IP address, user agent, OS version

### 7.3 Age Verification

**Requirements:**

- Checkbox during signup: "I confirm I am 18 years or older"
- Stored in `users.age_verified` (boolean)
- Blocked from app if unchecked
- No biometric age verification (cost prohibitive)

### 7.4 Content Policy

**Prohibited Content:**

- ❌ Nudity or sexually explicit images
- ❌ Minors (under 18)
- ❌ Deepfakes or manipulated images
- ❌ Non-consensual photos (e.g., uploaded by others)

**Enforcement:**

- Google Cloud Vision SafeSearch API (detect explicit content)
- Manual review queue for flagged images
- User reporting system
- Automatic account suspension for violations

---

## 8. Quality Assurance

### 8.1 Testing Strategy

**Unit Tests (Flutter):**

- Coverage target: 80%+
- Test: Providers, services, utilities
- Tools: flutter_test, mocktail

**Integration Tests (Flutter):**

- Test: Complete user flows (signup → scan → results → share)
- Tools: integration_test package
- Run on: iOS Simulator, Android Emulator

**API Tests (Backend):**

- Test: All endpoints (success + error cases)
- Tools: Jest, Supertest
- Run on: Every commit (GitHub Actions)

**E2E Tests:**

- Test: Critical paths (payment flow, referral flow)
- Tools: Maestro or Patrol
- Run: Weekly (before releases)

**Performance Tests:**

- Test: API latency (p50, p95, p99)
- Tools: k6 load testing
- Target: p95 < 500ms for /api/analyze

### 8.2 Device Testing Matrix

| OS | Version | Device |

|----|---------|--------|

| iOS | 16, 17, 18 | iPhone 12, 14, 15 Pro |

| Android | 12, 13, 14 | Pixel 6, Samsung S23 |

### 8.3 Accessibility Testing

**Tools:**

- iOS: Xcode Accessibility Inspector
- Android: Accessibility Scanner
- Manual: Screen reader testing (VoiceOver, TalkBack)

**Checklist:**

- ✅ All interactive elements have labels
- ✅ Touch targets ≥44x44px
- ✅ Color contrast ≥4.5:1
- ✅ Keyboard navigation works
- ✅ Form errors announced

---

## 9. Launch Plan

### 9.1 Pre-Launch (Weeks 1-6)

**Week 1-2: Infrastructure**

- Set up Vercel, Supabase, Stripe accounts
- Configure CI/CD (GitHub Actions)
- Set up error monitoring (Sentry)
- Set up analytics (PostHog)

**Week 3-4: MVP Development**

- Implement auth, analysis, results, sharing
- Implement paywall + Stripe integration
- Implement referral system

**Week 5-6: Testing & Refinement**

- Internal QA (5 team members)
- Fix critical bugs
- Performance optimization
- Write documentation

### 9.2 Soft Launch (Week 7)

**Beta Testing:**

- Recruit 500 beta testers (TestFlight + Google Play Beta)
- Collect feedback via in-app survey
- Iterate based on feedback
- Target: 80% satisfaction rate

**Success Criteria:**

- <1% crash rate
- 80%+ complete first scan
- 30%+ share their results

### 9.3 Public Launch (Week 8)

**App Store Submission:**

- iOS: Submit to App Store (review: 1-3 days)
- Android: Submit to Google Play (review: 1-2 days)

**Marketing Activities:**

- ProductHunt launch (aim for #1 Product of the Day)
- Twitter announcement thread
- Reddit posts (r/selfimprovement, r/malegrooming)
- Influencer seeding (10 micro-influencers, 10K-50K followers)
- Press release (TechCrunch, Mashable outreach)

**Day 1 Goals:**

- 5K downloads
- 500 completed scans
- 100 shares

### 9.4 Post-Launch (Weeks 9-12)

**Growth Tactics:**

- Optimize referral loop (A/B test bonus amounts)
- Launch affiliate program (recruit 50 creators)
- Content marketing (blog posts, YouTube videos)
- Paid ads (Facebook, Instagram, TikTok) - $5K budget

**Iteration:**

- Weekly analytics review
- Bi-weekly feature releases
- Monthly creator payouts
- Quarterly roadmap planning

---

## 10. Success Metrics & KPIs

### 10.1 North Star Metric

**Weekly Active Users (WAU)** - Users who complete ≥1 scan per week

### 10.2 Key Metrics Dashboard

| Metric | Formula | Target (Month 1) | Target (Month 6) |

|--------|---------|------------------|------------------|

| MAU | Unique users/month | 50K | 200K |

| DAU/MAU | Daily/Monthly ratio | 25% | 40% |

| Signup → Scan | % who complete first scan | 70% | 80% |

| Share Rate | % who share results | 30% | 40% |

| Viral Coefficient | (refs/total) × (shares/user) | 0.3 | 0.8 |

| Subscription Rate | Premium/Total users | 10% | 18% |

| MRR | Monthly recurring revenue | $65K | $480K |

| Churn | Canceled/Active | 8% | <5% |

| LTV | Avg revenue per user lifetime | $12 | $30 |

| CAC | Cost to acquire 1 user | $4 | $3 |

| LTV:CAC | Ratio | 3:1 | 10:1 |

### 10.3 Analytics Events

**Tracked Events:**

```
// Onboarding
onboarding_started
onboarding_step_completed (step: welcome|signup|permissions|intro)
onboarding_completed

// Auth
signup_email_started
signup_email_completed
signup_google_started
signup_google_completed
login_success
login_failed
age_verification_failed

// Analysis
camera_opened
photo_uploaded
analysis_started
analysis_completed (score: number, duration: ms)
analysis_failed (reason: string)

// Results
results_viewed
breakdown_expanded (category: string)
tips_viewed

// Sharing
share_card_viewed
share_initiated (platform: string)
share_completed (platform: string)
referral_link_copied

// Referral
referral_code_entered
referral_accepted
referral_bonus_received

// Subscriptions
paywall_viewed
tier_selected (tier: string)
checkout_started
payment_success (tier: string, amount: number)
payment_failed (reason: string)
subscription_canceled

// Community
leaderboard_viewed
profile_viewed (user_id: UUID)
comment_posted
achievement_unlocked (badge: string)

// Creator
creator_applied
affiliate_link_clicked (creator_id: UUID)
coupon_applied (code: string)
```

---

## 11. Risk Mitigation

### 11.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |

|------|------------|--------|------------|

| AI service downtime | Medium | High | Fallback to rule-based scoring, retry queue |

| Database overload | Low | High | Auto-scaling (Supabase), read replicas, caching |

| Payment processing failure | Low | High | Stripe retries, email notifications, manual resolution |

| Image storage costs | Medium | Medium | Auto-delete after 90 days, compress images, CDN |

| App Store rejection | Medium | High | Follow guidelines strictly, prepare appeal, soft launch first |

### 11.2 Business Risks

| Risk | Likelihood | Impact | Mitigation |

|------|------------|--------|------------|

| Low conversion rate | Medium | High | A/B test paywall messaging, optimize pricing, add value |

| High churn | Medium | High | Improve product value, engagement features, retention campaigns |

| Negative press | Low | High | Clear positioning (self-improvement, not judgment), PR team |

| Competitor launch | Medium | Medium | Fast iteration, unique features (referral loop, creator program) |

| Regulatory changes (AI) | Low | Medium | Monitor legislation, privacy-first design, transparency |

### 11.3 Reputation Risks

| Risk | Likelihood | Impact | Mitigation |

|------|------------|--------|------------|

| Associated with incel culture | Medium | Critical | Clear messaging (NO toxic terminology), content moderation, positive branding |

| Data breach | Low | Critical | Encryption at rest/transit, regular audits, bug bounty program |

| Bias in AI scoring | High | High | Diverse training data, fairness testing, transparent methodology |

| Cyberbullying via comments | Medium | Medium | Auto-moderation, user reporting, ban system, community guidelines |

---

## 12. Appendix

### 12.1 Glossary

- **Analysis:** AI-powered assessment of facial attractiveness
- **Breakdown:** 6-category score distribution
- **Referral Code:** Unique code for inviting friends (format: INVITE-XXXX-YYYY)
- **Share Card:** Shareable image with score + referral code
- **Viral Coefficient:** Metric of organic growth (new users from referrals / total new users)
- **Creator:** Influencer/affiliate partner promoting Black Pill
- **Tier:** Subscription level (Free, Basic, Pro, Unlimited)
- **Scan:** Single photo analysis

### 12.2 References

- Stripe API Docs: https://stripe.com/docs/api
- Supabase Docs: https://supabase.com/docs
- Flutter Docs: https://docs.flutter.dev
- OpenAI API: https://platform.openai.com/docs
- Google Cloud Vision: https://cloud.google.com/vision/docs
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
- GDPR: https://gdpr.eu/
- CCPA: https://oag.ca.gov/privacy/ccpa

### 12.3 Revision History

| Version | Date | Changes | Author |

|---------|------|---------|--------|

| 1.0 | Oct 27, 2025 | Initial PRD (comprehensive spec) | Product Team |

---
Also i want just 2 env files, one in backend and one in mobile
**END OF DOCUMENT**

This PRD is the authoritative specification for Black Pill. All development must adhere to these requirements. Changes require Product Team approval and version increment.