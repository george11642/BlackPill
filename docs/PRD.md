# Black Pill - Product Requirements Document (PRD)

## Document Control

**Version:** 1.3

**Last Updated:** October 30, 2025

**Status:** APPROVED - This document is LAW for all development (Phase 2.6 Advanced Differentiation Added)

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

**v1.3 Updated with Phase 2.6 Advanced Differentiation Features:**

- **200K MAU** (Monthly Active Users)
- **$1.2M MRR** (Monthly Recurring Revenue - increased with advanced features & wellness positioning)
- **75%+ DAU/MAU** ratio (dramatically increased with challenges, wellness tracking, daily engagement)
- **0.5-1.0 Viral Coefficient**
- **28-30% Subscription Rate** (increased with transparent scoring, ethical positioning, premium wellness features)
- **<2% Monthly Churn** (improved with challenges, wearable integration, holistic value proposition)
- **NPS Score: 75+** (up from 60 with ethical guardrails and trust-building features)

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
- Google OAuth via Supabase Auth (`signInWithOAuth`)
- Password reset via email
- Session persistence (30 days)
- Account deletion (GDPR compliance)

**Google OAuth Implementation:**

- Uses Supabase's built-in OAuth flow (`signInWithOAuth`)
- **No Android/iOS client IDs needed** - only requires Web OAuth client ID configured in Supabase Dashboard
- OAuth credentials configured in Supabase Dashboard → Authentication → Providers → Google
- Deep link callback: `blackpill://auth/callback`
- See `docs/SUPABASE_OAUTH_SETUP.md` for complete setup instructions

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
- Watermark: "black-pill.app" footer
- Generated server-side (Vercel function + Puppeteer)

**Analytics Tracking:**

- Log share events to `share_logs` table
- Track platform (iMessage, WhatsApp, etc.)
- Track referral acceptance conversion rate

#### F4: Referral System

**Requirements:**

- Auto-generate unique referral code on signup (format: `INVITE-XXXX-YYYY`)
- Deep link handling: 
  - Referral links: `blackpill://ref/[code]` and `https://black-pill.app/ref/[code]`
  - Subscription success: `blackpill://subscribe/success?session_id=[id]`
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

| Pro | $12.99/mo, $109.89/yr | 20/month | Basic + priority analysis, referral bonuses |

| Unlimited | $19.99/mo, $209.89/yr | Unlimited | Pro + AI coach mode, priority support |

**Paywall Trigger:**

- Show after 1st free scan used
- Dismissible (continue with referral scans)
- Re-show after all scans depleted

**Checkout Flow:**

**Mobile App Flow:**
1. User taps "Subscribe to [Tier]" in mobile app
2. App redirects to web pricing page: `https://black-pill.app/pricing?source=app&user_id=[id]&email=[email]&tier=[tier]&interval=[monthly|annual]`
3. Web page auto-populates email and tier based on URL parameters
4. User clicks subscribe → Stripe Checkout session created (email pre-filled, card input)
5. After successful payment → Redirects to success page: `https://black-pill.app/subscribe/success?session_id=[id]&source=app`
6. Success page detects `source=app` → Redirects via deep link: `blackpill://subscribe/success?session_id=[id]`
7. Mobile app receives deep link → Polls subscription status (up to 10 attempts, 2-second intervals)
8. Webhook updates `subscriptions` table with `source='app'` metadata
9. App grants instant premium access once subscription status confirmed

**Web Marketing Flow:**
1. User discovers product via Google ads, social media, or other web channels
2. User visits: `https://black-pill.app/pricing`
3. User enters email, selects tier and billing interval
4. Stripe Checkout session created (email pre-filled, card input)
5. After successful payment → Redirects to success page: `https://black-pill.app/subscribe/success?session_id=[id]&source=web`
6. Success page shows download instructions (App Store, Google Play badges)
7. Webhook updates `subscriptions` table with `source='web'` metadata
8. When user downloads app and signs in with same email → Premium access granted

**Key Features:**
- Both flows use identical backend processing
- Source tracking in Stripe metadata for analytics
- Conversion rate measurement per channel (app vs web)
- Unified subscription handling regardless of entry point

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

### 3.2 Phase 2 Features (Weeks 5-8) - Quick Wins & Daily Engagement

#### F7: Custom Routines System

**Requirements:**

- **Routine Builder:** AI-generated personalized improvement routines based on analysis results
- **Task Management:** Daily checklist system with morning/evening schedules
- **Categories:** Skincare, grooming, fitness, nutrition, mewing
- **Completion Tracking:** Mark tasks complete, track consistency
- **Streak System:** Daily completion streaks with rewards
- **Progress Analytics:** Correlation between routine adherence and score improvements

**Routine Generation:**

```
User completes analysis → AI identifies weak areas
→ Prompt: "Want to build a custom routine?"
→ User selects goals (skin, jawline, overall)
→ User selects time commitment (10-15, 20-30, 45+ minutes)
→ AI generates personalized routine with specific tasks
→ User can customize, add/remove tasks
→ Set reminders for morning/evening routines
```

**Task Structure:**

```json
{
  "title": "Apply Sunscreen",
  "description": "Use broad-spectrum SPF 50+ every morning",
  "category": "skincare",
  "time_of_day": ["morning"],
  "frequency": "daily",
  "duration_minutes": 2,
  "why_it_helps": "Protects from UV damage, prevents premature aging",
  "product_suggestions": [
    {
      "name": "CeraVe Hydrating Sunscreen",
      "price": "$15",
      "affiliate_link": "..."
    }
  ]
}
```

**Subscription Tiers:**

- Free: 1 basic routine template, no AI generation
- Basic: 3 custom routines, AI-generated
- Pro: 10 routines, AI optimization after 30 days
- Unlimited: Unlimited routines, daily AI check-ins

**Analytics Integration:**

- Track which tasks users complete most consistently
- Correlate routine completion with score improvements
- Surface insights: "Your skin score improves 15% when you complete skincare 5+ days/week"
- Suggest routine adjustments based on compliance data

**Gamification:**

- Streak rewards: 7 days (+5 scans), 30 days (+10 scans), 90 days (free month Pro)
- Achievement badges for consistency
- Routine leaderboard (longest streaks)
- Before/after photos with routine details

**Database Schema:**

```sql
CREATE TABLE routines (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  goal TEXT,
  focus_categories TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_from_analysis_id UUID REFERENCES analyses(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE routine_tasks (
  id UUID PRIMARY KEY,
  routine_id UUID REFERENCES routines(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  time_of_day TEXT[],
  frequency TEXT,
  order_index INT,
  duration_minutes INT,
  product_name TEXT,
  product_link TEXT
);

CREATE TABLE routine_completions (
  id UUID PRIMARY KEY,
  routine_id UUID REFERENCES routines(id) ON DELETE CASCADE,
  task_id UUID REFERENCES routine_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  skipped BOOLEAN DEFAULT false,
  notes TEXT
);

CREATE TABLE routine_streaks (
  id UUID PRIMARY KEY,
  routine_id UUID REFERENCES routines(id),
  user_id UUID REFERENCES users(id),
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_completed_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Performance Target:**

- Routine generation: <5 seconds
- Daily checklist load: <1 second
- Completion tracking: Real-time update

---

#### F8: Before/After Comparison View

**Requirements:**

- Side-by-side photo comparison of any two analyses
- Score delta display with visual indicators (+0.9, colored green/red)
- Category-by-category breakdown comparison
- Time span display (e.g., "90 days between photos")
- Percentage improvement calculation
- Shareable comparison cards for social media

**UI Specifications:**

```
┌─────────────────────────────────────┐
│  Before (Jan 1)    After (Apr 1)    │
│  ┌──────────┐      ┌──────────┐     │
│  │ [Image]  │  →   │ [Image]  │     │
│  │ 6.2/10   │      │ 7.1/10   │     │
│  └──────────┘      └──────────┘     │
│                                      │
│  Overall: +0.9 (+14.5%) 📈           │
│                                      │
│  Improvements:                       │
│  ✅ Skin:      6.0 → 7.2 (+1.2)      │
│  ✅ Symmetry:  6.5 → 7.3 (+0.8)      │
│  ➡️  Jawline:  6.0 → 6.1 (+0.1)      │
│  ⚠️  Eyes:     6.8 → 6.6 (-0.2)      │
│                                      │
│  Time: 90 days                       │
│  Routine completed: 87%              │
│                                      │
│  [Share My Progress]                 │
└─────────────────────────────────────┘
```

**Features:**

- Auto-select oldest and newest for quick comparison
- Custom date picker for any two analyses
- Timeline view showing all analysis points
- Highlight which categories improved/declined
- Show active routines during timeframe
- Export as high-res image for social sharing

**Analytics Tracking:**

- Track comparison views
- Track comparison shares
- Measure conversion: users who compare → take another scan

---

#### F9: Daily Check-In Streaks

**Requirements:**

- Simple daily check-in button on home screen
- Streak counter with fire emoji (🔥)
- Automatic check-in when user completes routine or scan
- Streak endangerment notifications (9 PM if not checked in)
- Streak freeze items (save endangered streak)

**Streak Mechanics:**

```
Day 1-6:   🔥 Basic streak
Day 7:     🎉 Week achieved! +5 bonus scans
Day 14:    🏆 Two weeks! Unlock "Dedicated" badge
Day 30:    💎 Month streak! +10 bonus scans
Day 90:    👑 Legendary! Free month of Pro tier
Day 365:   ✨ Elite! Lifetime "Year Warrior" badge
```

**Streak Protection:**

- 3 free streak freezes per month (Pro/Unlimited)
- Purchase additional freezes: $0.99 each or 5 scans
- Weekend grace period for Free/Basic users

**Database Schema:**

```sql
CREATE TABLE daily_checkins (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  checkin_date DATE NOT NULL,
  checkin_time TIMESTAMPTZ DEFAULT NOW(),
  streak_count INT NOT NULL,
  activities_completed TEXT[],
  UNIQUE(user_id, checkin_date)
);
```

**Notifications:**

- 9 PM: "Your 12-day streak is at risk! Check in now 🔥"
- Milestone reached: "🎉 7-day streak! You earned +5 scans"
- Streak lost: "Your streak ended at 23 days. Start fresh today!"

---

#### F10: Achievement Badges System

**Requirements:**

- Unlockable badges for milestones
- Badge display on user profile
- Badge collection screen with locked/unlocked states
- Animated unlock screen with confetti
- Rewards tied to achievements

**Badge Categories:**

```javascript
// Analysis Milestones
first_scan: "First Steps" 🎯
score_7_plus: "Rising Star" ⭐
score_8_plus: "Top Tier" 💎
score_9_plus: "Elite Status" 👑
perfect_10: "Legendary" ✨

// Improvement
improved_05: "Progress Made" 📈 (+0.5 points)
improved_10: "Major Transformation" 🦋 (+1.0 points)
improved_20: "Complete Makeover" 🔥 (+2.0 points)

// Engagement
week_streak: "Committed" 🔥 (+5 scans)
month_streak: "Dedicated" 💪 (Free month Basic)
quarter_streak: "Unstoppable" ⚡ (+20 scans)
year_streak: "Year Warrior" 👑 (Free month Pro)

// Routine Mastery
completed_routine_7: "Habit Starter" ✅
completed_routine_30: "Habit Master" 🎖️ (+15 scans)
completed_routine_90: "Lifestyle Legend" 🏆 (Free month Pro)
perfect_week: "Perfectionist" 💯 (100% completion 7 days)

// Social
first_share: "Spreading the Word" 📱 (+2 scans)
viral_share: "Influencer" 🌟 (share gets 10+ clicks)
referral_5: "Networker" 👥 (+10 scans)
referral_25: "Ambassador" 🎯 (Free month Pro)
referral_100: "Legend" 👑 (Free lifetime Basic)

// Community
leaderboard_top10: "Top Performer" 🥇
leaderboard_1st: "Champion" 👑
helpful_commenter: "Community Leader" 💬
```

**Database Schema:**

```sql
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  reward_claimed BOOLEAN DEFAULT false,
  UNIQUE(user_id, achievement_key)
);
```

---

#### F11: Photo History Gallery

**Requirements:**

- Grid view of all analysis thumbnails
- Timeline view with dates
- Filter by date range
- Sort by score (highest/lowest)
- Bulk actions (delete multiple, compare)
- Time-lapse video generator (bonus feature)

**UI Layout:**

```
┌─────────────────────────────────────┐
│ My Journey          [Grid] [Timeline│
│                                      │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐         │
│ │7.1 │ │6.8 │ │6.9 │ │6.5 │         │
│ │Apr │ │Mar │ │Feb │ │Jan │         │
│ └────┘ └────┘ └────┘ └────┘         │
│                                      │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐         │
│ │6.2 │ │6.0 │ │5.8 │ │5.7 │         │
│ │Dec │ │Nov │ │Oct │ │Sep │         │
│ └────┘ └────┘ └────┘ └────┘         │
│                                      │
│ [Create Time-lapse] [Compare]       │
└─────────────────────────────────────┘
```

**Time-lapse Feature:**

- Select photos from gallery
- Auto-generate 3-10 second video
- Add background music
- Show score progression overlay
- Export for TikTok/Instagram (vertical format)

---

### 3.3 Phase 2.5 Features (Weeks 9-16) - Engagement & Monetization

#### F12: AI Chat Coach

**Requirements:**

- Real-time conversational AI for ongoing advice and support
- Context-aware responses based on user's analysis history, routines, and goals
- Quick question chips for common queries
- Conversation history saved
- Rate limiting by subscription tier

**AI Coach Capabilities:**

- Answer questions about skincare, grooming, fitness, style
- Provide personalized tips based on user's weak areas
- Suggest routine adjustments based on compliance data
- Offer motivation and encouragement
- Reference user's progress and data in responses

**Rate Limits:**

- Free: 5 messages/month
- Basic: 30 messages/month
- Pro: 100 messages/month
- Unlimited: Unlimited messages + priority response time

**System Prompt Template:**

```
You are a supportive looksmaxxing coach for BlackPill.

User context:
- Latest score: {latestScore}
- Weak areas: {weakestCategories}
- Current routine: {activeRoutineName}
- Routine compliance: {complianceRate}
- Subscription: {tier}
- Recent progress: {recentProgress}

Be constructive, encouraging, and specific. Reference their data.
Avoid toxic terminology. Focus on actionable advice.
If asked about advanced treatments, recommend consulting professionals.
```

**Quick Question Chips:**

- "How to improve jawline?"
- "Best skincare routine?"
- "Mewing tips?"
- "How to fix asymmetry?"
- "Diet for better skin?"

**Database Schema:**

```sql
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  tokens_used INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_usage_tracking (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  month DATE NOT NULL,
  messages_sent INT DEFAULT 0,
  tokens_used INT DEFAULT 0,
  UNIQUE(user_id, month)
);
```

**API Endpoint:**

```
POST /api/ai-coach/chat
Body: {
  conversationId?: string,
  message: string
}
Response: {
  reply: string,
  conversationId: string,
  remainingMessages: int
}
```

**Cost Management:**

- Use GPT-4o-mini (~$0.01-0.05 per conversation)
- Cache system prompts
- Set max_tokens: 300
- Temperature: 0.7 for natural responses

---

#### F13: Goal Setting & Tracking

**Requirements:**

- Users can set specific improvement goals
- Goal types: score improvement, category improvement, routine consistency, weight loss
- Smart milestone generation
- Progress tracking with visual indicators
- Deadline reminders
- Goal achievement celebrations

**Goal Types:**

1. **Score Improvement:** "Reach 8.0 overall score"
2. **Category Improvement:** "Improve skin score to 7.5"
3. **Routine Consistency:** "Complete routine 90% for 60 days"
4. **Custom Goal:** User-defined milestone

**Goal Creation Flow:**

```
1. Select goal type
2. Set current and target values
3. Choose deadline
4. AI generates milestones (Week 1, Month 1, Halfway, Final)
5. Select reminder frequency
6. Create goal
```

**Smart Milestones:**

```javascript
// Example for "6.2 → 8.0 in 90 days"
Milestones:
- Week 2: Reach 6.5 (+0.3)
- Month 1: Reach 7.0 (+0.8)
- Month 2: Reach 7.5 (+1.3)
- Month 3: Reach 8.0 (+1.8) ✓ GOAL
```

**Database Schema:**

```sql
CREATE TABLE user_goals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  goal_type TEXT NOT NULL,
  target_value NUMERIC,
  current_value NUMERIC,
  deadline DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE goal_milestones (
  id UUID PRIMARY KEY,
  goal_id UUID REFERENCES user_goals(id) ON DELETE CASCADE,
  milestone_name TEXT,
  target_value NUMERIC,
  target_date DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ
);
```

**Notifications:**

- Milestone approaching: "You're 80% to your milestone!"
- Milestone achieved: "🎉 You hit your Month 1 goal!"
- Behind schedule: "Let's get back on track. Try a 7-day focus?"
- Goal completed: "🏆 GOAL ACHIEVED! You reached 8.0!"

---

#### F14: Enhanced Push Notification System

**Requirements:**

- Smart, personalized notification scheduling based on user behavior
- Multiple notification types for engagement, retention, and re-engagement
- User preference controls (notification types, quiet hours)
- A/B testing for notification effectiveness

**Notification Types:**

```javascript
// Daily Engagement
morning_routine: "Good morning! ☀️ Time for your routine"
evening_routine: "Don't forget your evening skincare! 🌙"
streak_endangered: "Your 12-day streak is at risk! 🔥"

// Progress & Milestones
goal_milestone: "You're 80% to your goal! 💪"
routine_complete: "Perfect week! You completed 100% 🎉"
achievement_unlock: "New badge unlocked: Habit Master! 🏆"

// Social
referral_accepted: "Alex joined using your code! +5 scans 🎉"
comment_reply: "Someone replied to your comment"
leaderboard_rank: "You moved up to #15! 📈"

// Retention
scan_reminder: "It's been 30 days! Ready to see progress? 📸"
win_back: "We miss you! Here's 3 bonus scans ❤️"
subscription_renewal: "Your Pro subscription renews in 7 days"

// Tips & Education
daily_tip: "💡 Tip: Apply retinol only at night"
content_unlock: "New article: 'The Science of Skincare' 📚"
```

**Smart Scheduling:**

- Analyze user's active hours (when they typically use app)
- Send routine reminders 30 min before usual routine time
- Avoid quiet hours (default: 10 PM - 8 AM)
- Batch notifications to avoid spam
- Adaptive timing based on engagement

**User Preferences:**

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) UNIQUE,
  routine_reminders BOOLEAN DEFAULT true,
  streak_reminders BOOLEAN DEFAULT true,
  goal_updates BOOLEAN DEFAULT true,
  social_notifications BOOLEAN DEFAULT true,
  marketing_notifications BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### F15: In-App Product Marketplace

**Requirements:**

- Curated store of recommended skincare, grooming, and fitness products
- AI-powered personalized recommendations based on analysis
- Affiliate links for commission revenue
- Product reviews and ratings
- "Shop My Routine" feature (one-click buy all routine products)

**Product Categories:**

- Skincare (cleansers, moisturizers, serums, sunscreen)
- Grooming (razors, trimmers, beard care)
- Fitness (supplements, equipment)
- Style (clothing, accessories)

**Recommendation Engine:**

```javascript
// Generate recommendations based on analysis
if (skinScore < 7.0) {
  recommend: ["CeraVe Hydrating Cleanser", "The Ordinary Niacinamide", "La Roche-Posay Sunscreen"]
}
if (jawlineScore < 7.0) {
  recommend: ["Jawzrsize", "Facial Exercise Guide", "Mewing Tutorial"]
}
```

**Database Schema:**

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  subcategory TEXT,
  price NUMERIC,
  currency TEXT DEFAULT 'USD',
  affiliate_link TEXT,
  image_url TEXT,
  rating NUMERIC,
  review_count INT,
  recommended_for TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_recommendations (
  id UUID PRIMARY KEY,
  analysis_id UUID REFERENCES analyses(id),
  product_id UUID REFERENCES products(id),
  relevance_score NUMERIC,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_clicks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Monetization:**

- 5-15% affiliate commission per sale
- Average order value: $30-50
- Target conversion: 3-5%
- **Potential revenue:** $75K-200K/year at 200K MAU

**UI Features:**

- "Recommended For You" section on home screen
- "Shop by Category" browse
- "Complete Your Routine" (products for active routine)
- Product detail pages with reviews
- Wishlist functionality

---

#### F16: Personalized Insights Dashboard

**Requirements:**

- AI-generated insights based on user data patterns
- Correlation analysis (routine completion vs score improvements)
- Trend predictions
- Actionable recommendations
- Visual data representations

**Insight Types:**

```javascript
// Correlation Insights
"Your skin score improves 15% after completing morning routine 5+ days/week"
"You score 0.3 points higher in photos taken outdoors"
"Your best progress happens when you sleep 7+ hours"

// Timing Insights
"You're most consistent with routines on weekdays"
"Your scores peak on Mondays, dip on Fridays"
"Best photo time for you: 10 AM - 2 PM"

// Progress Predictions
"Based on your trend, you'll likely reach 8.0 in 45 days"
"If you maintain 90% routine compliance, expect +0.5 improvement"

// Comparative Insights
"You're progressing 23% faster than average users"
"Users with similar starting scores typically reach your goal in 60 days"
```

**Data Sources:**

- Analysis history and scores
- Routine completion rates
- Goal progress
- Photo metadata (time, location, lighting)
- Engagement patterns

**Database Schema:**

```sql
CREATE TABLE user_insights (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  insight_type TEXT,
  title TEXT,
  description TEXT,
  actionable BOOLEAN DEFAULT false,
  action_text TEXT,
  action_link TEXT,
  confidence_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  dismissed_at TIMESTAMPTZ
);
```

**Insight Refresh:**

- Generate new insights weekly
- Update predictions daily
- Show max 5 insights at a time
- Allow users to dismiss insights

---

### 3.4 Phase 2.6 Features (Weeks 13-16) - Advanced Differentiation

#### F17: Transparent Scoring Methodology

**Requirements:**

- Explain how each metric is calculated with full transparency
- User-adjustable category weights (within limits)
- Visual representation of scoring methodology
- Comparison to beauty standards and scientific research
- Build trust through openness

**Scoring Breakdown Display:**

```typescript
interface ScoringMethodology {
  category: string; // 'symmetry', 'skin', etc.
  weight: number; // Default: 20%
  adjustableRange: [number, number]; // [15%, 25%]
  factors: string[]; // What's measured
  measurement: string; // How it's measured
  scientificBasis: string; // Research/standard
}

// Example for Symmetry
{
  category: 'Symmetry',
  weight: 20,
  adjustableRange: [15, 25],
  factors: [
    'Face horizontal symmetry (left/right)',
    'Eye alignment and spacing',
    'Nose centering',
    'Mouth symmetry'
  ],
  measurement: 'Facial landmark analysis (68 points)',
  scientificBasis: 'Studies show <5% deviation is ideal (Rhodes et al., 2007)'
}
```

**User Controls:**

- Sliders for each category weight (15-25% range)
- Real-time score recalculation
- "Reset to Default" button
- "Why This Matters" info buttons

**Methodology Page:**

- Full documentation of AI model used (GPT-4o Vision)
- Data sources and training information
- Limitations and disclaimers
- Scientific references
- Link to whitepaper (optional premium content)

**UI Implementation:**

```
┌─────────────────────────────────────┐
│ How Your Score Was Calculated       │
│                                     │
│ SYMMETRY (20%) ────── 7.2/10       │
│ [Adjust: 15% ▬▬●▬▬▬▬ 25%]          │
│                                     │
│ ℹ️ Measured using:                  │
│ • 68-point facial landmark map      │
│ • Left/right deviation: 2.3%        │
│ • Industry standard: <5% ideal      │
│                                     │
│ [View Full Methodology]             │
│                                     │
│ SKIN QUALITY (20%) ───── 6.8/10    │
│ [Adjust: 15% ▬▬▬●▬▬▬ 25%]          │
│ ...                                 │
└─────────────────────────────────────┘
```

**Database Schema:**

```sql
CREATE TABLE user_scoring_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE,
  symmetry_weight INT DEFAULT 20 CHECK (symmetry_weight BETWEEN 15 AND 25),
  skin_weight INT DEFAULT 20 CHECK (skin_weight BETWEEN 15 AND 25),
  jawline_weight INT DEFAULT 15 CHECK (jawline_weight BETWEEN 10 AND 20),
  eyes_weight INT DEFAULT 15 CHECK (eyes_weight BETWEEN 10 AND 20),
  lips_weight INT DEFAULT 15 CHECK (lips_weight BETWEEN 10 AND 20),
  bone_structure_weight INT DEFAULT 15 CHECK (bone_structure_weight BETWEEN 10 AND 20),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT total_weight_100 CHECK (
    symmetry_weight + skin_weight + jawline_weight + 
    eyes_weight + lips_weight + bone_structure_weight = 100
  )
);
```

---

#### F18: 3-Tier Action Plans (DIY/OTC/Professional)

**Requirements:**

- For each weak area, provide three levels of guidance
- Include cost estimates, time to results, and effectiveness ratings
- Link to product marketplace for OTC options
- Provide referrals to professionals for advanced treatments
- Show realistic expectations for each tier

**Action Plan Structure:**

```typescript
interface ActionPlan {
  issue: string; // "Moderate acne scarring detected"
  category: string; // "skin"
  currentScore: number;
  targetScore: number;
  severity: 'mild' | 'moderate' | 'severe';
  
  diy: {
    title: string;
    routine: string[];
    estimatedCost: string; // "$0-30"
    timeToResults: string; // "8-12 weeks"
    effectiveness: 'low' | 'medium' | 'high';
    difficultyLevel: 'easy' | 'moderate' | 'challenging';
    scienceBacking: string;
  };
  
  otc: {
    title: string;
    products: Array<{
      name: string;
      purpose: string;
      price: number;
      productId?: string; // Link to marketplace
    }>;
    routine: string[];
    estimatedCost: string; // "$50-150"
    timeToResults: string; // "4-8 weeks"
    effectiveness: 'medium' | 'high';
    difficultyLevel: 'moderate' | 'challenging';
    scienceBacking: string;
  };
  
  professional: {
    title: string;
    treatments: Array<{
      name: string;
      description: string;
      averageCost: string;
      sessionsNeeded: number;
    }>;
    estimatedCost: string; // "$200-1500"
    timeToResults: string; // "2-6 months"
    effectiveness: 'high' | 'very high';
    warning: string; // "Consult board-certified dermatologist"
    whenToConsider: string;
    findProfessional: string; // Link or search
  };
}
```

**Example Output:**

```
🔴 Moderate Acne Scarring (Skin: 5.8/10 → Target: 7.5/10)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIY APPROACH
Cost: $0-30 | Time: 8-12 weeks | ⭐⭐⭐

✓ Daily vitamin C serum (brightening)
✓ Gentle exfoliation 2x/week (cell turnover)
✓ Sunscreen SPF 50+ DAILY (prevent darkening)
✓ Stay hydrated (skin health)

Science: Vitamin C promotes collagen synthesis
Difficulty: Easy | Best for: Mild scarring

[Start DIY Routine]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OTC PRODUCTS
Cost: $50-150 | Time: 4-8 weeks | ⭐⭐⭐⭐

✓ The Ordinary AHA 30% + BHA 2% ($7.20)
  → Exfoliates dead skin, reduces scars
✓ CeraVe Resurfacing Retinol ($18)
  → Accelerates cell turnover
✓ Niacinamide 10% + Zinc 1% ($6)
  → Reduces inflammation, evens tone

Science: Retinoids proven to reduce atrophic scars
Difficulty: Moderate | Best for: Moderate scarring

[Shop These Products]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROFESSIONAL TREATMENTS
Cost: $200-1500 | Time: 2-6 months | ⭐⭐⭐⭐⭐

✓ Microneedling (4-6 sessions @ $200-300 each)
  → Stimulates collagen, fills scars
✓ Chemical Peel Series (3-6 sessions)
  → Removes damaged layers
✓ Laser Resurfacing (1-3 sessions)
  → Precision scar treatment

⚠️ CONSULT: Board-certified dermatologist required
When to consider: Severe scarring, other methods failed
Effectiveness: Very High for deep/rolling scars

[Find Dermatologist Near You]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 RECOMMENDATION: Start with OTC approach for 
   8 weeks. If <30% improvement, consult professional.
```

**Integration with Routine Generator:**

- Auto-suggest DIY approach in custom routines
- Add OTC products to routine with marketplace links
- Flag for professional consultation in severe cases

---

#### F19: Structured Challenges & Photo Verification

**Requirements:**

- Pre-built challenge programs (7, 30, 60, 90 day)
- Photo consistency verification to ensure valid progress tracking
- Challenge completion rewards and leaderboards
- Guided lighting, angle, and distance instructions
- Calibration photo for baseline comparison

**Challenge Structure:**

```typescript
interface Challenge {
  id: string;
  name: string; // "30-Day Skin Glow-Up Challenge"
  description: string;
  duration: number; // days
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  focusArea: string[]; // ['skin', 'overall']
  
  requirements: {
    dailyTasks: number; // Must complete X tasks/day
    weeklyCheckins: number; // Required photo check-ins
    minimumCompliance: number; // 80% required
    photoVerification: boolean;
  };
  
  schedule: Array<{
    day: number;
    tasks: string[];
    milestone: boolean;
    checkInRequired: boolean;
  }>;
  
  rewards: {
    badge: string;
    bonusScans: number;
    unlocks: string[]; // "Advanced routine templates"
    tierDiscount?: string; // "20% off Pro for 1 month"
  };
  
  photoGuidance: {
    lighting: 'natural' | 'consistent-indoor';
    timeOfDay: string; // "Morning, near window"
    distance: string; // "Arm's length"
    angle: string; // "Straight on, level with camera"
    background: string; // "Plain, uncluttered"
    expression: string; // "Neutral"
  };
  
  participants: number;
  successRate: number;
  avgImprovement: number;
}
```

**Available Challenges:**

1. **7-Day Skincare Starter** (Beginner)
   - Focus: Establish basic skincare routine
   - Checkins: Days 1, 4, 7
   - Reward: "Habit Starter" badge + 5 scans

2. **30-Day Glow-Up** (Intermediate)
   - Focus: Comprehensive skin improvement
   - Checkins: Weekly (Days 7, 14, 21, 30)
   - Reward: "Transformer" badge + 15 scans + 20% off Pro

3. **60-Day Jawline Definition** (Advanced)
   - Focus: Mewing + facial exercises
   - Checkins: Bi-weekly
   - Reward: "Chiseled" badge + 25 scans + Free month Pro

4. **90-Day Full Transformation** (Expert)
   - Focus: All categories holistic improvement
   - Checkins: Weekly
   - Reward: "Legend" badge + 50 scans + Permanent 10% discount

**Photo Verification System:**

```typescript
interface PhotoVerification {
  originalPhoto: string; // Calibration baseline
  checkInPhoto: string; // New photo to verify
  
  checks: {
    lighting: {
      score: number; // 0-1
      pass: boolean;
      suggestion?: string;
    };
    distance: {
      faceSize: number; // % of frame
      pass: boolean; // 40-60% range
      suggestion?: string;
    };
    angle: {
      deviation: number; // degrees
      pass: boolean; // <10 degrees
      suggestion?: string;
    };
    background: {
      clutter: number; // 0-1
      pass: boolean; // <0.3
      suggestion?: string;
    };
    expression: {
      neutral: boolean;
      pass: boolean;
      suggestion?: string;
    };
  };
  
  overallValid: boolean;
  confidenceScore: number;
}

// Verification function
async function validateProgressPhoto(photo, calibrationPhoto) {
  const metadata = await analyzePhotoConditions(photo);
  const baseline = await analyzePhotoConditions(calibrationPhoto);
  
  // Compare lighting consistency
  const lightingDiff = Math.abs(metadata.lighting.score - baseline.lighting.score);
  const lightingPass = lightingDiff < 0.2;
  
  // Check face size consistency
  const faceSizeDiff = Math.abs(metadata.faceSize - baseline.faceSize);
  const distancePass = faceSizeDiff < 10; // Within 10%
  
  // Check angle consistency
  const anglePass = metadata.faceAngle < 10; // Less than 10 degrees
  
  // Check background
  const backgroundPass = metadata.backgroundClutter < 0.3;
  
  return {
    checks: {
      lighting: {
        score: metadata.lighting.score,
        pass: lightingPass,
        suggestion: !lightingPass ? "Try to match the lighting from your first photo. Use the same location and time of day." : undefined
      },
      distance: {
        faceSize: metadata.faceSize,
        pass: distancePass,
        suggestion: !distancePass ? "Hold camera at the same distance as your baseline photo (arm's length)." : undefined
      },
      // ... other checks
    },
    overallValid: lightingPass && distancePass && anglePass && backgroundPass,
    confidenceScore: (checks passed / total checks)
  };
}
```

**UI for Photo Guidance:**

```
┌─────────────────────────────────────┐
│ 📸 Challenge Check-In (Day 7)       │
│                                     │
│ Before taking your photo:           │
│                                     │
│ ✓ Use natural light near a window  │
│ ✓ Same time of day as baseline     │
│ ✓ Hold phone at arm's length        │
│ ✓ Face straight ahead               │
│ ✓ Plain background                  │
│ ✓ Neutral expression                │
│                                     │
│ [View Baseline Photo]               │
│ [Take Check-In Photo]               │
│                                     │
│ Real-time guidance:                 │
│ 🟢 Lighting: Good                   │
│ 🟢 Distance: Perfect                │
│ 🟡 Angle: Tilt slightly left        │
│ 🟢 Background: Clear                │
└─────────────────────────────────────┘
```

**Database Schema:**

```sql
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_days INT NOT NULL,
  difficulty TEXT NOT NULL,
  focus_areas TEXT[],
  requirements JSONB NOT NULL,
  schedule JSONB NOT NULL,
  rewards JSONB NOT NULL,
  photo_guidance JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE challenge_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id),
  user_id UUID REFERENCES users(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'abandoned'
  current_day INT DEFAULT 1,
  compliance_rate NUMERIC,
  calibration_photo_url TEXT,
  UNIQUE(challenge_id, user_id)
);

CREATE TABLE challenge_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participation_id UUID REFERENCES challenge_participations(id) ON DELETE CASCADE,
  day INT NOT NULL,
  photo_url TEXT,
  photo_verified BOOLEAN DEFAULT false,
  verification_data JSONB,
  score NUMERIC,
  notes TEXT,
  checked_in_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_challenge_participations_user ON challenge_participations(user_id);
CREATE INDEX idx_challenge_participations_status ON challenge_participations(status);
CREATE INDEX idx_challenge_checkins_participation ON challenge_checkins(participation_id);
```

---

#### F20: Ethical Guardrails & Mental Health Resources

**Requirements:**

- Sensitive inference opt-in/opt-out controls
- Clear disclaimers about AI limitations
- Mental health resource links
- Frequency monitoring and intervention
- Positive messaging framework

**Ethical Controls:**

```typescript
interface EthicalSettings {
  sensitiveInferences: {
    ageEstimation: boolean; // Default: opt-in
    ethnicityDetection: boolean; // Default: opt-out
    bodyTypeInferences: boolean; // Default: opt-in
    advancedFacialFeatures: boolean; // Default: opt-in
  };
  
  disclaimersAcknowledged: {
    aiLimitations: boolean;
    notMedicalAdvice: boolean;
    beautyStandards: boolean;
    personalWorth: boolean;
  };
  
  mentalHealthSettings: {
    enableWellnessChecks: boolean; // Default: true
    checkFrequency: 'weekly' | 'biweekly' | 'monthly';
    showResourcesOnLowScores: boolean; // Default: true
  };
}
```

**Disclaimers (Shown During Onboarding):**

```
┌─────────────────────────────────────┐
│ ⚠️ Important Information            │
│                                     │
│ BlackPill uses AI to analyze facial │
│ attractiveness. Please understand: │
│                                     │
│ ✓ Results are algorithmic estimates │
│   not absolute truth                │
│                                     │
│ ✓ Based on conventional beauty      │
│   standards, not universal values   │
│                                     │
│ ✓ Your worth as a person extends    │
│   far beyond physical appearance    │
│                                     │
│ ✓ This is NOT medical advice        │
│   Consult professionals for health  │
│   concerns                          │
│                                     │
│ If you experience negative thoughts │
│ about your appearance, please reach │
│ out to mental health resources.     │
│                                     │
│ [View Resources] [I Understand]     │
└─────────────────────────────────────┘
```

**Mental Health Resources:**

```typescript
const MENTAL_HEALTH_RESOURCES = [
  {
    name: "NAMI Helpline",
    phone: "1-800-950-6264",
    description: "National Alliance on Mental Illness",
    available: "Mon-Fri, 10am-10pm ET"
  },
  {
    name: "Crisis Text Line",
    sms: "Text HOME to 741741",
    description: "24/7 crisis support via text",
    available: "24/7"
  },
  {
    name: "BDD Support",
    url: "https://bdd.iocdf.org",
    description: "Body Dysmorphic Disorder Foundation",
    available: "Online resources"
  },
  {
    name: "7 Cups",
    url: "https://www.7cups.com",
    description: "Free emotional support chat",
    available: "24/7"
  },
  {
    name: "BetterHelp",
    url: "https://www.betterhelp.com",
    description: "Professional online therapy",
    available: "Paid service, financial aid available"
  }
];
```

**Wellness Checks:**

```typescript
// Trigger wellness check if:
async function shouldShowWellnessCheck(userId) {
  const user = await getUser(userId);
  const recentAnalyses = await getRecentAnalyses(userId, 7); // Last 7 days
  
  const triggers = {
    highFrequency: recentAnalyses.length > 10,
    lowScores: recentAnalyses.filter(a => a.score < 5.0).length > 3,
    obsessivePattern: await detectObsessivePattern(userId),
    recentDecline: await hasRecentScoreDecline(userId, 1.0) // > 1 point drop
  };
  
  return Object.values(triggers).some(t => t === true);
}

// Show compassionate message
const WELLNESS_MESSAGES = [
  {
    trigger: 'highFrequency',
    message: "We noticed you've been analyzing frequently. Remember, you're more than a number! Take a break and focus on your journey, not just the destination.",
    tone: 'gentle'
  },
  {
    trigger: 'lowScores',
    message: "Scores can vary based on many factors (lighting, angles, even mood!). Don't let numbers define you. Focus on feeling confident and healthy.",
    tone: 'supportive'
  },
  {
    trigger: 'recentDecline',
    message: "Score fluctuations are normal! External factors like sleep, hydration, and stress affect appearance. Focus on wellness, not perfection.",
    tone: 'reassuring'
  }
];
```

**Always-Visible Resources:**

```
// Footer on every results screen
┌─────────────────────────────────────┐
│ ℹ️ This is just one perspective.    │
│ Your worth isn't defined by a score.│
│                                     │
│ Struggling with body image?         │
│ [Mental Health Resources] 💚        │
└─────────────────────────────────────┘
```

**Database Schema:**

```sql
CREATE TABLE user_ethical_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE,
  age_estimation BOOLEAN DEFAULT true,
  ethnicity_detection BOOLEAN DEFAULT false,
  body_type_inferences BOOLEAN DEFAULT true,
  advanced_features BOOLEAN DEFAULT true,
  disclaimers_acknowledged BOOLEAN DEFAULT false,
  enable_wellness_checks BOOLEAN DEFAULT true,
  check_frequency TEXT DEFAULT 'weekly',
  show_resources_on_low_scores BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wellness_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  trigger_reason TEXT NOT NULL,
  message_shown TEXT NOT NULL,
  resources_accessed BOOLEAN DEFAULT false,
  user_response TEXT, -- 'dismissed', 'viewed_resources', 'contacted_support'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wellness_checks_user ON wellness_checks(user_id, created_at DESC);
```

---

#### F21: Wearable Integration (Wellness-Aesthetic Correlation)

**Requirements:**

- Integration with Apple Health (iOS) and Google Fit (Android)
- Track wellness metrics: sleep, hydration, exercise, stress (HRV)
- Correlate wellness data with facial analysis scores
- Provide personalized insights based on correlations
- Holistic health positioning

**Integrated Metrics:**

```typescript
interface WellnessData {
  sleep: {
    hours: number;
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    source: 'Apple Watch' | 'Fitbit' | 'Whoop' | 'Manual';
    deepSleepMinutes?: number;
    remSleepMinutes?: number;
  };
  
  hydration: {
    ounces: number;
    goal: number;
    percentage: number;
    source: 'Apple Health' | 'Manual';
  };
  
  stress: {
    hrv: number; // Heart rate variability (ms)
    restingHR: number;
    stressLevel: 'low' | 'medium' | 'high';
    source: 'Apple Watch' | 'Fitbit' | 'Whoop';
  };
  
  exercise: {
    minutes: number;
    intensity: 'light' | 'moderate' | 'vigorous';
    type: string[]; // ['cardio', 'strength', 'yoga']
    calories: number;
    source: 'Apple Health' | 'Google Fit';
  };
  
  nutrition: {
    caloriesConsumed: number;
    proteinGrams?: number;
    waterIntake: number;
    source: 'MyFitnessPal' | 'Manual';
  };
}
```

**Correlation Analysis:**

```typescript
async function analyzeWellnessImpact(userId) {
  // Get last 30 days of analyses and wellness data
  const analyses = await getUserAnalyses(userId, 30);
  const wellness = await getWellnessData(userId, 30);
  
  // Calculate correlations
  const correlations = {
    sleep: calculateCorrelation(
      wellness.map(d => d.sleep.hours),
      analyses.map(a => a.breakdown.skin)
    ),
    hydration: calculateCorrelation(
      wellness.map(d => d.hydration.ounces),
      analyses.map(a => a.breakdown.skin)
    ),
    exercise: calculateCorrelation(
      wellness.map(d => d.exercise.minutes),
      analyses.map(a => a.score)
    ),
    stress: calculateCorrelation(
      wellness.map(d => d.stress.hrv),
      analyses.map(a => a.score)
    )
  };
  
  // Generate insights
  const insights = [];
  
  if (correlations.sleep > 0.5) {
    const avgSkinScoreGoodSleep = avg(analyses.filter((a, i) => 
      wellness[i].sleep.hours >= 7.5).map(a => a.breakdown.skin)
    );
    const avgSkinScorePoorSleep = avg(analyses.filter((a, i) => 
      wellness[i].sleep.hours < 7).map(a => a.breakdown.skin)
    );
    const delta = avgSkinScoreGoodSleep - avgSkinScorePoorSleep;
    
    insights.push({
      category: 'sleep',
      impact: delta,
      message: `Your skin score is ${delta.toFixed(1)} points higher on days you sleep 7.5+ hours`,
      recommendation: 'Prioritize 7.5-8 hours of sleep for better skin appearance',
      priority: 'high'
    });
  }
  
  // Similar for other metrics...
  
  return { correlations, insights };
}
```

**UI Widget:**

```
┌─────────────────────────────────────┐
│ 🏃 Wellness Impact on Your Score    │
│                                     │
│ Sleep: 7.2 hrs avg → Skin +0.5 ⭐   │
│ [View Analysis]                     │
│                                     │
│ Hydration: 52 oz → ⚠️ Below goal    │
│ Target: 64 oz/day for +0.3 boost   │
│                                     │
│ Exercise: 2x/week → Add cardio!     │
│ Target: 4x/week for +0.4 boost     │
│                                     │
│ [Connect Apple Health]              │
│ [Connect Google Fit]                │
└─────────────────────────────────────┘
```

**Wellness Insights Dashboard:**

- **Top Correlations**: Which factors affect your scores most
- **Optimization Tips**: Specific actions to improve
- **Trend Charts**: Wellness metrics vs. appearance scores over time
- **Daily Checklist**: Sleep, hydration, exercise goals
- **Streak Tracking**: Days meeting wellness targets

**Integration Implementation:**

```dart
// iOS: HealthKit
import 'package:health/health.dart';

Future<void> syncAppleHealth() async {
  final health = Health();
  
  // Request permissions
  final types = [
    HealthDataType.SLEEP_IN_BED,
    HealthDataType.WATER,
    HealthDataType.HEART_RATE,
    HealthDataType.STEPS,
    HealthDataType.WORKOUT,
  ];
  
  final permissions = await health.requestAuthorization(types);
  
  if (permissions) {
    // Fetch data
    final now = DateTime.now();
    final yesterday = now.subtract(Duration(days: 1));
    
    final data = await health.getHealthDataFromTypes(yesterday, now, types);
    
    // Send to backend
    await api.syncWellnessData(data);
  }
}

// Android: Google Fit
import 'package:fit_kit/fit_kit.dart';

Future<void> syncGoogleFit() async {
  final permissions = [
    DataType.SLEEP,
    DataType.WATER,
    DataType.HEART_RATE,
    DataType.DISTANCE,
  ];
  
  final hasPermissions = await FitKit.requestPermissions(permissions);
  
  if (hasPermissions) {
    final now = DateTime.now();
    final yesterday = now.subtract(Duration(days: 1));
    
    final data = await FitKit.read(DataType.SLEEP, yesterday, now);
    
    await api.syncWellnessData(data);
  }
}
```

**Database Schema:**

```sql
CREATE TABLE user_wellness_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sleep_hours NUMERIC,
  sleep_quality TEXT,
  hydration_oz INT,
  exercise_minutes INT,
  exercise_intensity TEXT,
  stress_hrv INT,
  resting_hr INT,
  calories_consumed INT,
  data_source TEXT, -- 'apple_health', 'google_fit', 'manual'
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE wellness_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE,
  sleep_skin_correlation NUMERIC,
  hydration_skin_correlation NUMERIC,
  exercise_overall_correlation NUMERIC,
  stress_score_correlation NUMERIC,
  insights JSONB,
  last_calculated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wellness_data_user_date ON user_wellness_data(user_id, date DESC);
```

**Marketing Angle:**

- "The first looksmaxxing app that connects appearance to wellness"
- "Your face reflects your health - optimize both together"
- "Science-backed: Better sleep = Better appearance"

---

#### F22: Leaderboard
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

| Push Notifications | Expo Push API (mobile) + Web Push API (web) | Cross-platform, reliable, no Firebase needed |

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
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL allowed for web flow users before app signup
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  tier TEXT NOT NULL,
  status TEXT NOT NULL,
  source TEXT DEFAULT 'web', -- 'app' or 'web' - tracks subscription origin for analytics
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
CREATE INDEX idx_subscriptions_source ON subscriptions(source); -- For analytics and conversion tracking
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
  Headers: Authorization: Bearer [token] (optional - supports unauthenticated web flow)
  Body: { 
    tier: string, 
    interval: 'monthly'|'annual', 
    coupon_code?: string,
    email?: string,  // Required for web flow (unauthenticated)
    source?: 'app'|'web',  // Automatically determined if not provided
    user_id?: string  // Required for app flow, optional for web flow
  }
  Response: { session_id: string, checkout_url: string }
  Errors: 
    400 (invalid tier, missing email for web flow)
    409 (already subscribed)
  
  Note: Supports both authenticated (app) and unauthenticated (web) flows.
        Success URL includes source parameter for proper routing.

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
  Note: 
    - Handles checkout.session.completed, subscription.created, subscription.updated, subscription.deleted, invoice.paid, invoice.payment_failed
    - Extracts source ('app' or 'web') from checkout session metadata
    - For web flow: Finds or creates user by email, links subscription
    - For app flow: Uses user_id from metadata
    - Tracks analytics by source for conversion measurement
    - Stores source in subscriptions table for reporting
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
subscription_success
subscription_activated (tier: string)
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

| 1.1 | Dec 20, 2025 | Updated F5: Hybrid payment system (app + web flows), source tracking, deep link handling (`blackpill://subscribe/success`), subscription status polling, analytics events (`subscription_success`, `subscription_activated`). Updated API spec to support unauthenticated web flow. Updated database schema to include `source` field in subscriptions table. Fixed Unlimited tier annual price ($209.89/yr). | Product Team |

| 1.2 | Oct 30, 2025 | **MAJOR UPDATE - Competitive Feature Additions:** Added Phase 2 (F7-F11): Custom Routines System (AI-generated personalized daily routines with task tracking, streaks, analytics), Before/After Comparison View (side-by-side photo comparison with deltas), Daily Check-In Streaks (habit building with rewards), Achievement Badges System (40+ unlockable badges), Photo History Gallery (grid/timeline view with time-lapse generator). Added Phase 2.5 (F12-F16): AI Chat Coach (conversational AI with rate limiting), Goal Setting & Tracking (smart milestones), Enhanced Push Notifications (behavior-based scheduling), In-App Product Marketplace (affiliate monetization), Personalized Insights Dashboard (AI-generated correlations and predictions). Updated success metrics: MRR $600K→$900K, DAU/MAU 40%→65%, Subscription Rate 15-20%→22-25%, Churn <5%→<3%. All features based on competitive analysis of Umaxx, LookMax AI, Maxxing, and Alpha Aura apps. Total investment: $39K over 6 months, expected ROI: 184x, additional ARR: +$7.2M. | Product Team |

| 1.3 | Oct 30, 2025 | **ADVANCED DIFFERENTIATION UPDATE - Phase 2.6 Added:** Added Phase 2.6 (F17-F21): Transparent Scoring Methodology (user-adjustable weights, full methodology page, scientific references), 3-Tier Action Plans (DIY/OTC/Professional guidance with cost/time estimates for each weak area), Structured Challenges with Photo Verification (7/30/60/90-day programs with real-time photo guidance and consistency checks), Ethical Guardrails & Mental Health Resources (sensitive inference controls, wellness checks, always-visible resources, compassionate messaging), Wearable Integration (Apple Health/Google Fit sync, wellness-aesthetic correlation analysis, holistic insights). These features create a 10-year competitive moat through transparency, ethical positioning, and wellness integration. Updated success metrics: MRR $900K→$1.2M (+$3.6M ARR), DAU/MAU 65%→75%, Subscription Rate 22-25%→28-30%, Churn <3%→<2%, NPS 60→75. Additional investment: $19.5K, Total ROI: 246x. Features address major competitive gaps: transparent scoring (vs "black box" competitors), multi-tier action plans (vs single-solution apps), photo verification (vs unreliable progress tracking), ethical design (vs unregulated competitors), wellness integration (first in category). | Product Team |

---
**END OF DOCUMENT**

This PRD is the authoritative specification for Black Pill. All development must adhere to these requirements. Changes require Product Team approval and version increment.