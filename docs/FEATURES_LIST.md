# Black Pill - Complete Features List

This document lists all features specified in the PRD (Product Requirements Document) in a numbered format.

## MVP Features (Phase 1: Weeks 1-4)

### F1: Authentication
- Email/password signup with validation
- Google OAuth via Supabase Auth (`signInWithOAuth`)
- Password reset via email
- Session persistence (30 days)
- Account deletion (GDPR compliance)
- Age verification checkbox: "I confirm I am 18 years or older"
- Security: bcrypt password hashing (cost factor 12)
- Rate limiting: 5 attempts per 15 minutes
- Email verification required for signup
- 2FA optional (Phase 2)

### F2: Photo Analysis
- Camera capture OR gallery upload
- Face detection validation (Google Cloud Vision)
- Image preprocessing (crop, resize, normalize)
- AI analysis via OpenAI GPT-4o Mini
- Score calculation (1-10 scale, 1 decimal)
- 6-dimension breakdown: Symmetry, Jawline, Eyes, Lips, Skin Quality, Bone Structure
- 3-5 personalized AI tips
- Photo quality validation:
  - Minimum resolution: 640x640px
  - Face must occupy 40-60% of frame
  - Single face detection (reject group photos)
  - Lighting quality check (not too dark/bright)
- AI prompt guidelines: constructive language, avoid toxic terminology
- Performance: Analysis completion <30 seconds (95th percentile)
- Privacy: Images stored in Supabase Storage (encrypted at rest), auto-delete after 90 days

### F3: Results & Sharing
- Animated score reveal with confetti (score ≥ 7.5)
- Breakdown bars with animated fill
- AI insights card (glassmorphic)
- Share card generation (1080x1920px PNG)
- Share buttons: iMessage, WhatsApp, Instagram, TikTok, Copy Link
- Referral code embedded in share card
- Share card specifications: Background #0F0F1E, score display, breakdown, QR code, watermark
- Analytics tracking: Log share events to `share_logs` table

### F4: Referral System
- Auto-generate unique referral code on signup (format: `INVITE-XXXX-YYYY`)
- Deep link handling: `blackpill://ref/[code]` and `https://black-pill.app/ref/[code]`
- Referral acceptance flow: Both users receive 5 bonus scans
- Fraud prevention: Max 1 referral per device ID per 30 days, max 50 referrals per user per month
- Referral stats dashboard: Total invited, accepted, pending, bonus scans earned, invite streak, leaderboard rank

### F5: Subscriptions & Paywall
- Subscription tiers:
  - Free: $0, 1 lifetime scan
  - Basic: $4.99/mo, $54.99/yr, 5 scans/month
  - Pro: $12.99/mo, $109.89/yr, 20 scans/month
  - Unlimited: $19.99/mo, $209.89/yr, unlimited scans
- Paywall trigger: Show after 1st free scan used
- Mobile app checkout flow: Redirects to web pricing page, Stripe Checkout, deep link callback
- Web marketing flow: Direct web checkout, download instructions
- Subscription management: Cancel anytime, Stripe Customer Portal, auto-renewal notifications
- Refund policy: 7-day money-back guarantee

### F6: Onboarding
- Screens: Welcome/Splash, Email Signup OR Google Auth, Permissions Request, First Scan Intro
- Best practices guide: Natural lighting, no filters, face fills 50% of frame, neutral expression, clear background
- First-time UX goal: 80% of users complete signup → first scan in <5 minutes

## Phase 2 Features (Weeks 5-8) - Quick Wins & Daily Engagement

### F7: Custom Routines System
- Routine Builder: AI-generated personalized improvement routines based on analysis results
- Task Management: Daily checklist system with morning/evening schedules
- Categories: Skincare, grooming, fitness, nutrition, mewing
- Completion Tracking: Mark tasks complete, track consistency
- Streak System: Daily completion streaks with rewards
- Progress Analytics: Correlation between routine adherence and score improvements
- Routine generation: AI creates personalized routines based on weak areas, goals, time commitment
- Subscription tiers: Free (1 basic template), Basic (3 custom routines), Pro (10 routines), Unlimited (unlimited)
- Gamification: Streak rewards, achievement badges, routine leaderboard, before/after photos

### F8: Before/After Comparison View
- Side-by-side photo comparison of any two analyses
- Score delta display with visual indicators (+0.9, colored green/red)
- Category-by-category breakdown comparison
- Time span display (e.g., "90 days between photos")
- Percentage improvement calculation
- Shareable comparison cards for social media
- Auto-select oldest and newest for quick comparison
- Custom date picker for any two analyses
- Timeline view showing all analysis points

### F9: Daily Check-In Streaks
- Simple daily check-in button on home screen
- Streak counter with fire emoji (🔥)
- Automatic check-in when user completes routine or scan
- Streak endangerment notifications (9 PM if not checked in)
- Streak freeze items (save endangered streak)
- Streak mechanics: Day 7 (+5 scans), Day 30 (+10 scans), Day 90 (free month Pro), Day 365 (lifetime badge)
- Streak protection: 3 free streak freezes per month (Pro/Unlimited)

### F10: Achievement Badges System
- Unlockable badges for milestones
- Badge display on user profile
- Badge collection screen with locked/unlocked states
- Animated unlock screen with confetti
- Rewards tied to achievements
- Badge categories:
  - Analysis Milestones: first_scan, score_7_plus, score_8_plus, score_9_plus, perfect_10
  - Improvement: improved_05, improved_10, improved_20
  - Engagement: week_streak, month_streak, quarter_streak, year_streak
  - Routine Mastery: completed_routine_7, completed_routine_30, completed_routine_90, perfect_week
  - Social: first_share, viral_share, referral_5, referral_25, referral_100
  - Community: leaderboard_top10, leaderboard_1st, helpful_commenter

### F11: Photo History Gallery
- Grid view of all analysis thumbnails
- Timeline view with dates
- Filter by date range
- Sort by score (highest/lowest)
- Bulk actions (delete multiple, compare)
- Time-lapse video generator (bonus feature): Select photos, auto-generate 3-10 second video, add background music, show score progression overlay

### F22: Leaderboard
- Your rank display (highlighted row)
- Filters: This Week, All-Time, By Location
- Top 3 badges: 🥇 Gold, 🥈 Silver, 🥉 Bronze
- Privacy options: Profile visibility (Public/Private), username required
- Ranking algorithm: Based on highest single score, recalculated weekly (Sunday 00:00 UTC)

### F23: Progress Tracking
- "Compare Over Time" screen
- Line chart: score history (last 30/90/365 days)
- Average score calculation
- Best score highlight
- Improvement percentage vs. last scan
- Chart library: fl_chart (Flutter)
- Positive framing: "You've improved 0.3 points in 30 days!"

### F24: Community Features
- Comment on public analyses (opt-in)
- Upvote/downvote system
- Report abuse button
- Discussion threads (optional)
- Content moderation: AI pre-filtering (OpenAI Moderation API), blocked terms list, user reporting, ban system
- Community guidelines: Be constructive, no harassment, no sharing others' photos without consent

### F25: Creator/Affiliate Program
- Creator signup form (name, Instagram/TikTok handle, follower count)
- Manual approval process (review within 48 hours)
- Unique affiliate link: `bp.app/ref/[creator_handle]`
- Commission structure: Nano (30%), Micro (25%), Macro (20% + bonuses)
- Creator Dashboard (Web): Overview, performance charts, tools, coupons, earnings
- Fraud detection: Click fraud limits, conversion fraud flags, coupon abuse prevention
- Payout schedule: Monthly on 15th, minimum $50, via Stripe Connect

## Phase 2.5 Features (Weeks 9-16) - Engagement & Monetization

### F12: AI Chat Coach
- Real-time conversational AI for ongoing advice and support
- Context-aware responses based on user's analysis history, routines, and goals
- Quick question chips for common queries
- Conversation history saved
- Rate limiting by subscription tier: Free (5/month), Basic (30/month), Pro (100/month), Unlimited (unlimited)
- AI coach capabilities: Answer questions about skincare/grooming/fitness/style, provide personalized tips, suggest routine adjustments, offer motivation
- System prompt template with user context integration

### F13: Goal Setting & Tracking
- Users can set specific improvement goals
- Goal types: score improvement, category improvement, routine consistency, weight loss
- Smart milestone generation
- Progress tracking with visual indicators
- Deadline reminders
- Goal achievement celebrations
- Goal creation flow: Select type, set values, choose deadline, AI generates milestones, select reminder frequency
- Notifications: Milestone approaching, milestone achieved, behind schedule, goal completed

### F14: Enhanced Push Notification System
- Smart, personalized notification scheduling based on user behavior
- Multiple notification types for engagement, retention, and re-engagement
- User preference controls (notification types, quiet hours)
- A/B testing for notification effectiveness
- Notification types:
  - Daily Engagement: morning_routine, evening_routine, streak_endangered
  - Progress & Milestones: goal_milestone, routine_complete, achievement_unlock
  - Social: referral_accepted, comment_reply, leaderboard_rank
  - Retention: scan_reminder, win_back, subscription_renewal
  - Tips & Education: daily_tip, content_unlock
- Smart scheduling: Analyze user's active hours, send reminders 30 min before usual routine time, avoid quiet hours

### F15: In-App Product Marketplace
- Curated store of recommended skincare, grooming, and fitness products
- AI-powered personalized recommendations based on analysis
- Affiliate links for commission revenue
- Product reviews and ratings
- "Shop My Routine" feature (one-click buy all routine products)
- Product categories: Skincare, grooming, fitness, style
- Recommendation engine: Generate recommendations based on analysis weak areas
- Monetization: 5-15% affiliate commission per sale, average order value $30-50, target conversion 3-5%
- UI features: "Recommended For You" section, "Shop by Category" browse, "Complete Your Routine", product detail pages, wishlist

### F16: Personalized Insights Dashboard
- AI-generated insights based on user data patterns
- Correlation analysis (routine completion vs score improvements)
- Trend predictions
- Actionable recommendations
- Visual data representations
- Insight types:
  - Correlation Insights: "Your skin score improves 15% after completing morning routine 5+ days/week"
  - Timing Insights: "You're most consistent with routines on weekdays"
  - Progress Predictions: "Based on your trend, you'll likely reach 8.0 in 45 days"
  - Comparative Insights: "You're progressing 23% faster than average users"
- Data sources: Analysis history, routine completion rates, goal progress, photo metadata, engagement patterns
- Insight refresh: Generate new insights weekly, update predictions daily, show max 5 insights at a time

## Phase 2.6 Features (Weeks 13-16) - Advanced Differentiation

### F17: Transparent Scoring Methodology
- Explain how each metric is calculated with full transparency
- User-adjustable category weights (within limits)
- Visual representation of scoring methodology
- Comparison to beauty standards and scientific research
- Build trust through openness
- Scoring breakdown display: Category, weight, adjustable range, factors, measurement, scientific basis
- User controls: Sliders for each category weight (15-25% range), real-time score recalculation, "Reset to Default" button
- Methodology page: Full documentation of AI model, data sources, limitations, disclaimers, scientific references

### F18: 3-Tier Action Plans (DIY/OTC/Professional)
- For each weak area, provide three levels of guidance
- Include cost estimates, time to results, and effectiveness ratings
- Link to product marketplace for OTC options
- Provide referrals to professionals for advanced treatments
- Show realistic expectations for each tier
- Action plan structure:
  - DIY: Title, routine, estimated cost, time to results, effectiveness, difficulty level, science backing
  - OTC: Title, products list, routine, estimated cost, time to results, effectiveness, difficulty level, science backing
  - Professional: Title, treatments list, estimated cost, time to results, effectiveness, warning, when to consider, find professional link
- Integration with routine generator: Auto-suggest DIY approach, add OTC products to routine, flag for professional consultation

### F19: Structured Challenges & Photo Verification
- Pre-built challenge programs (7, 30, 60, 90 day)
- Photo consistency verification to ensure valid progress tracking
- Challenge completion rewards and leaderboards
- Guided lighting, angle, and distance instructions
- Calibration photo for baseline comparison
- Challenge structure: Name, description, duration, difficulty, focus area, requirements, schedule, rewards, photo guidance
- Available challenges:
  - 7-Day Skincare Starter (Beginner)
  - 30-Day Glow-Up (Intermediate)
  - 60-Day Jawline Definition (Advanced)
  - 90-Day Full Transformation (Expert)
- Photo verification system: Checks for lighting, distance, angle, background, expression consistency
- UI for photo guidance: Real-time feedback on photo quality, comparison to baseline

### F20: Ethical Guardrails & Mental Health Resources
- Sensitive inference opt-in/opt-out controls
- Clear disclaimers about AI limitations
- Mental health resource links
- Frequency monitoring and intervention
- Positive messaging framework
- Ethical controls: Age estimation, ethnicity detection, body type inferences, advanced facial features (all with opt-in/opt-out)
- Disclaimers: Shown during onboarding, explain AI limitations, beauty standards, personal worth, medical advice disclaimer
- Mental health resources: NAMI Helpline, Crisis Text Line, BDD Support, 7 Cups, BetterHelp
- Wellness checks: Trigger on high frequency, low scores, obsessive patterns, recent decline
- Always-visible resources: Footer on every results screen with mental health resource link

### F21: Wearable Integration (Wellness-Aesthetic Correlation)
- Integration with Apple Health (iOS) and Google Fit (Android)
- Track wellness metrics: sleep, hydration, exercise, stress (HRV)
- Correlate wellness data with facial analysis scores
- Provide personalized insights based on correlations
- Holistic health positioning
- Integrated metrics: Sleep (hours, quality, deep/REM sleep), hydration (ounces, goal, percentage), stress (HRV, resting HR, stress level), exercise (minutes, intensity, type, calories), nutrition (calories, protein, water intake)
- Correlation analysis: Calculate correlations between wellness metrics and appearance scores, generate insights like "Your skin score is X points higher on days you sleep 7.5+ hours"
- UI widget: Wellness impact on score display, optimization tips, trend charts
- Wellness insights dashboard: Top correlations, optimization tips, trend charts, daily checklist, streak tracking
- Marketing angle: "The first looksmaxxing app that connects appearance to wellness"

---

**Total Features: 25**

**Note:** This list consolidates all features from the PRD. Some features may have overlapping functionality or be implemented in phases as specified in the original document.

