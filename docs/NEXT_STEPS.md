# BlackPill Migration - Next Steps & Action Plan

**Created:** January 2025  
**Status:** Foundation Complete - Ready for Core Migration

## 📊 Current Status

- ✅ **Phase 1 Complete**: Documentation and project structure
- ⏳ **Phase 2 In Progress**: Mobile infrastructure (30% complete)
- ⏳ **Phase 3 Pending**: API migration (3% complete - 2/60+ endpoints)
- ⏳ **Phase 4 Pending**: Screen migration (0% complete - 0/24 screens)

## 🎯 Prioritized Migration Plan

### Phase 1: Critical Foundation (Week 1-2)

#### 1.1 Migrate Core Business Logic & Utilities
**Priority: HIGH** - Required before screen/API migration

**Utilities to Migrate:**
- [ ] `backend/utils/supabase.js` → `web/lib/supabase/client.ts`
- [ ] `backend/utils/openai-client.js` → `web/lib/openai/client.ts`
- [ ] `backend/utils/google-vision.js` → `web/lib/vision/client.ts`
- [ ] `backend/utils/photo-verification.js` → `web/lib/vision/photo-verification.ts`
- [ ] `backend/utils/moderation.js` → `web/lib/moderation/client.ts`
- [ ] `backend/utils/fallback-scoring.js` → `web/lib/scoring/fallback.ts`

**Middleware to Migrate:**
- [ ] `backend/middleware/auth.js` → `web/lib/auth/middleware.ts`
- [ ] `backend/middleware/rate-limit.js` → `web/lib/rate-limit/middleware.ts`
- [ ] `backend/middleware/error-handler.js` → `web/lib/errors/handler.ts`

**Estimated Time:** 3-5 days

#### 1.2 Migrate Critical API Endpoints
**Priority: HIGH** - Core functionality

**Authentication & User:**
- [ ] `/api/auth/me` ✅ (Already migrated)
- [ ] `/api/auth/login` (if separate endpoint exists)
- [ ] `/api/user/export`
- [ ] `/api/user/push-token`

**Analysis (Core Feature):**
- [ ] `/api/analyze` ✅ (Placeholder exists - needs implementation)
- [ ] `/api/analyses` (list analyses)
- [ ] `/api/analyses/history`
- [ ] `/api/analyses/[id]`

**Subscriptions (Revenue Critical):**
- [ ] `/api/subscriptions/create-checkout`
- [ ] `/api/subscriptions/status`
- [ ] `/api/subscriptions/cancel`
- [ ] `/api/webhooks/stripe` (webhook handler)

**Estimated Time:** 5-7 days

### Phase 2: Mobile Screen Migration (Week 2-4)

#### 2.1 Authentication & Onboarding Flow (4 screens)
**Priority: HIGH** - Required for app access

**Screens:**
1. [ ] `screens/SplashScreen.tsx` - App entry point
2. [ ] `screens/LoginScreen.tsx` - Email/password + Google OAuth
3. [ ] `screens/SignupScreen.tsx` - Registration with age verification
4. [ ] `screens/OnboardingScreen.tsx` - Permissions and disclaimers

**Dependencies:**
- Auth context (✅ already created)
- Supabase client (✅ already created)
- Navigation setup

**Estimated Time:** 3-4 days

#### 2.2 Core Analysis Flow (3 screens)
**Priority: HIGH** - Core product feature

**Screens:**
1. [ ] `screens/HomeScreen.tsx` - Main dashboard
2. [ ] `screens/CameraScreen.tsx` - Photo capture with quality checks
3. [ ] `screens/AnalysisResultScreen.tsx` - Score display with 6-dimension breakdown

**Dependencies:**
- Camera permissions
- Image picker
- API client for `/api/analyze`
- Result visualization components

**Estimated Time:** 4-5 days

#### 2.3 Progress & History (3 screens)
**Priority: MEDIUM** - User engagement

**Screens:**
1. [ ] `screens/HistoryScreen.tsx` - Photo gallery with timeline
2. [ ] `screens/ComparisonScreen.tsx` - Before/after comparison
3. [ ] `screens/ProgressScreen.tsx` - Charts and analytics

**Estimated Time:** 3-4 days

#### 2.4 Remaining Screens (14 screens)
**Priority: MEDIUM-LOW** - Can be migrated incrementally

**Routines & Habits (3 screens):**
- [ ] `screens/RoutinesScreen.tsx`
- [ ] `screens/RoutineDetailScreen.tsx`
- [ ] `screens/TasksScreen.tsx`

**Social & Gamification (3 screens):**
- [ ] `screens/LeaderboardScreen.tsx`
- [ ] `screens/AchievementsScreen.tsx`
- [ ] `screens/ShareScreen.tsx`

**Challenges & Wellness (3 screens):**
- [ ] `screens/ChallengesScreen.tsx`
- [ ] `screens/ChallengeDetailScreen.tsx`
- [ ] `screens/WellnessScreen.tsx`

**Settings & Profile (4 screens):**
- [ ] `screens/ProfileScreen.tsx`
- [ ] `screens/SettingsScreen.tsx`
- [ ] `screens/SubscriptionScreen.tsx`
- [ ] `screens/EthicalSettingsScreen.tsx`

**AI Coach (1 screen):**
- [ ] `screens/AICoachScreen.tsx`

**Estimated Time:** 10-14 days

### Phase 3: Complete API Migration (Week 3-6)

#### 3.1 Routines & Tasks (8 endpoints)
- [ ] `/api/routines/list`
- [ ] `/api/routines/generate`
- [ ] `/api/routines/complete-task`
- [ ] `/api/routines/today`
- [ ] `/api/routines/stats`
- [ ] `/api/routines/update`
- [ ] `/api/routines/delete`
- [ ] `/api/routines/tasks`

**Estimated Time:** 2-3 days

#### 3.2 Social Features (7 endpoints)
- [ ] `/api/leaderboard`
- [ ] `/api/leaderboard/referrals`
- [ ] `/api/achievements/list`
- [ ] `/api/achievements/unlock`
- [ ] `/api/share/generate-card`
- [ ] `/api/referral/accept`
- [ ] `/api/referral/stats`

**Estimated Time:** 2-3 days

#### 3.3 Challenges & Check-ins (5 endpoints)
- [ ] `/api/challenges/list`
- [ ] `/api/challenges/join`
- [ ] `/api/challenges/my-challenges`
- [ ] `/api/challenges/checkin`
- [ ] `/api/checkins/checkin`
- [ ] `/api/checkins/status`

**Estimated Time:** 1-2 days

#### 3.4 Community & Comparisons (4 endpoints)
- [ ] `/api/community/public-analyses`
- [ ] `/api/community/comments`
- [ ] `/api/community/vote`
- [ ] `/api/comparisons/compare`

**Estimated Time:** 1-2 days

#### 3.5 Creator Features (4 endpoints)
- [ ] `/api/creators/apply`
- [ ] `/api/creators/dashboard`
- [ ] `/api/creators/performance`
- [ ] `/api/creators/coupons`

**Estimated Time:** 1-2 days

#### 3.6 AI Coach (3 endpoints)
- [ ] `/api/ai-coach/chat`
- [ ] `/api/ai-coach/conversations`
- [ ] `/api/ai-coach/messages`

**Estimated Time:** 1-2 days

#### 3.7 Goals & Insights (6 endpoints)
- [ ] `/api/goals/create`
- [ ] `/api/goals/list`
- [ ] `/api/goals/update-progress`
- [ ] `/api/insights/generate`
- [ ] `/api/insights/list`
- [ ] `/api/insights/mark-viewed`

**Estimated Time:** 2-3 days

#### 3.8 Products & Marketplace (3 endpoints)
- [ ] `/api/products/list`
- [ ] `/api/products/recommend`
- [ ] `/api/products/click`

**Estimated Time:** 1 day

#### 3.9 Scoring & Preferences (3 endpoints)
- [ ] `/api/scoring/methodology`
- [ ] `/api/scoring/preferences`
- [ ] `/api/scoring/recalculate`

**Estimated Time:** 1-2 days

#### 3.10 Ethical & Wellness (7 endpoints)
- [ ] `/api/ethical/settings`
- [ ] `/api/ethical/acknowledge-disclaimers`
- [ ] `/api/ethical/wellness-check`
- [ ] `/api/ethical/resources`
- [ ] `/api/wellness/data`
- [ ] `/api/wellness/sync`
- [ ] `/api/wellness/correlations`

**Estimated Time:** 2-3 days

#### 3.11 Admin & Cron (4 endpoints)
- [ ] `/api/admin/review-queue`
- [ ] `/api/admin/review-action`
- [ ] `/api/cron/check-renewals`
- [ ] `/api/cron/recalculate-leaderboard`

**Estimated Time:** 1-2 days

**Total API Migration Time:** 15-25 days

### Phase 4: Testing & Quality Assurance (Week 6-7)

#### 4.1 Unit Tests
- [ ] Test all migrated utilities
- [ ] Test API route handlers
- [ ] Test React Native components
- [ ] Test business logic functions

**Estimated Time:** 3-4 days

#### 4.2 Integration Tests
- [ ] Test API + database integration
- [ ] Test mobile app + API integration
- [ ] Test webhook handlers
- [ ] Test cron jobs

**Estimated Time:** 2-3 days

#### 4.3 E2E Tests
- [ ] Test critical user journeys:
  - Sign up → Onboarding → Analysis flow
  - Subscription purchase flow
  - Routine creation and completion
  - Social features (leaderboard, achievements)

**Estimated Time:** 2-3 days

### Phase 5: Deployment & Migration (Week 7-8)

#### 5.1 Pre-Deployment
- [ ] Consolidate environment variables
- [ ] Update `vercel.json` configuration
- [ ] Test build process locally
- [ ] Verify all environment variables are set

**Estimated Time:** 1 day

#### 5.2 Staging Deployment
- [ ] Deploy to staging environment
- [ ] Test all critical flows
- [ ] Verify API endpoints
- [ ] Test mobile app connectivity
- [ ] Performance testing

**Estimated Time:** 2-3 days

#### 5.3 Production Deployment
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Verify webhook endpoints
- [ ] Test cron jobs
- [ ] Gradual rollout (if using feature flags)

**Estimated Time:** 1-2 days

#### 5.4 Cleanup
- [ ] Archive old Flutter code
- [ ] Archive old Express.js backend
- [ ] Update documentation
- [ ] Remove unused dependencies

**Estimated Time:** 1 day

## 📅 Recommended Timeline

### Sprint 1 (Weeks 1-2): Foundation
- Migrate core utilities and middleware
- Migrate critical API endpoints (auth, analyze, subscriptions)
- Migrate authentication screens

### Sprint 2 (Weeks 3-4): Core Features
- Complete core analysis flow screens
- Migrate remaining critical API endpoints
- Set up testing infrastructure

### Sprint 3 (Weeks 5-6): Feature Completion
- Migrate remaining screens
- Complete API migration
- Write unit and integration tests

### Sprint 4 (Weeks 7-8): Testing & Deployment
- E2E testing
- Staging deployment and testing
- Production deployment
- Cleanup

**Total Estimated Time:** 8 weeks (with 1 developer)

## 🎯 Success Criteria

### Phase 1 Complete When:
- ✅ All core utilities migrated and tested
- ✅ Critical API endpoints migrated and working
- ✅ Authentication flow working end-to-end

### Phase 2 Complete When:
- ✅ All 24 screens migrated
- ✅ Core user flows working (signup → analysis → results)
- ✅ Navigation working correctly

### Phase 3 Complete When:
- ✅ All 60+ API endpoints migrated
- ✅ All endpoints tested and working
- ✅ Webhooks and cron jobs functional

### Phase 4 Complete When:
- ✅ Test coverage > 70%
- ✅ All critical paths tested
- ✅ No critical bugs

### Phase 5 Complete When:
- ✅ Deployed to production
- ✅ All features working
- ✅ Old code archived
- ✅ Documentation updated

## 🚨 Risk Mitigation

### Risk: Breaking Changes During Migration
**Mitigation:**
- Keep old backend running during migration
- Use feature flags to toggle between old/new implementations
- Gradual rollout per feature

### Risk: API Compatibility Issues
**Mitigation:**
- Test each migrated endpoint immediately
- Maintain same request/response formats
- Version API if needed

### Risk: Mobile App Breaking
**Mitigation:**
- Migrate screens incrementally
- Test each screen after migration
- Keep Flutter code until React Native is stable

### Risk: Data Loss or Corruption
**Mitigation:**
- No database schema changes required
- Both old and new APIs use same Supabase database
- Test database operations thoroughly

## 📝 Daily Checklist Template

### For Screen Migration:
- [ ] Read Flutter screen code
- [ ] Identify dependencies (API calls, state, navigation)
- [ ] Create React Native screen component
- [ ] Migrate UI components
- [ ] Connect to API endpoints
- [ ] Test screen functionality
- [ ] Update navigation routes
- [ ] Test navigation flow

### For API Migration:
- [ ] Read Express.js endpoint code
- [ ] Identify dependencies (utils, middleware, database)
- [ ] Create Next.js API route
- [ ] Migrate business logic
- [ ] Add authentication middleware
- [ ] Add error handling
- [ ] Test endpoint (unit test)
- [ ] Test with mobile app (integration test)
- [ ] Update API client in mobile app

## 🔗 Resources

- [Migration Guide](MIGRATION_GUIDE.md) - Detailed technical instructions
- [Migration Status](MIGRATION_STATUS.md) - Current progress tracking
- [PRD](PRD.md) - Product requirements and specifications
- [SmileScore Reference](../SmileScore) - Reference implementation

---

**Next Action:** Start with Phase 1.1 - Migrate core utilities and middleware

