# Technical Concerns

## High Severity

### 1. Hardcoded Supabase URLs
**Location:** `mobile/lib/api/client.ts:52,130`, `web/lib/supabase/server.ts:10`

**Issue:** Fallback hardcoded URL instead of failing when env vars missing:
```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wzsxpxwwgaqiaoxdyhnf.supabase.co';
```

**Risk:** Production could accidentally use wrong database if env vars not set.

**Fix:** Remove fallback, require env var or fail fast.

---

### 2. Loose Type Usage
**Location:** Throughout `lib/api/client.ts`

**Issue:**
- `data?: any` parameters
- `catch (error: any)` without proper typing
- Non-null assertions on potentially undefined values

**Risk:** Loss of type safety, potential runtime errors.

**Fix:** Define proper types, use type guards.

---

### 3. Unimplemented TODO Features
**Locations:**
- `mobile/screens/ShareScreen.tsx:143` - Save to camera roll not implemented
- `mobile/screens/TimelapseGenerationScreen.tsx:164` - Video sharing placeholder
- `mobile/screens/ShareScreen.tsx:343` - Share actions incomplete

**Risk:** Users see buttons that don't work properly.

**Fix:** Implement features or remove UI elements.

---

### 4. Uncommitted Active Work
**Modified Files:**
- `mobile/components/GradientText.tsx`
- `mobile/lib/api/client.ts`
- `mobile/lib/supabase/api.ts`
- `mobile/screens/MarketplaceScreen.tsx`
- Same files in `shemax-mobile/`
- `supabase/functions/ai/index.ts`

**Untracked:**
- `fix-products-route.js` (workaround script)
- `supabase/migrations/20260108000000_create_achievements_table.sql`

**Risk:** Significant changes not version controlled.

---

### 5. Problematic Workaround Script
**Location:** `fix-products-route.js`

**Issue:** Node.js script that directly modifies TypeScript files using `fs.writeFileSync`.

**Risk:** Bypasses version control, hard to track changes, maintenance nightmare.

**Fix:** Delete script, fix underlying issue properly.

---

## Medium Severity

### 6. React Version Mismatch
**Issue:**
- Mobile: `react: "19.1.0"`
- Web: `react: "^19.2.0"`

**Risk:** Inconsistent behavior, different APIs available.

**Fix:** Align React versions across projects.

---

### 7. Excessive Console Logging
**Count:** ~236 console statements in lib directories

**Issue:** Debug logs in production code.

**Risk:** Performance overhead, potential data leakage, cluttered logs.

**Fix:** Remove or conditionally disable for production.

---

### 8. Incomplete Goal Category Matching
**Location:** `web/lib/goals/service.ts:38`
```typescript
// TODO: In the future, match category_improvement goals to specific breakdown categories
```

**Issue:** All goals use overall score, not category-specific tracking.

**Fix:** Implement category matching or document as limitation.

---

### 9. Dual Mobile App Duplication
**Issue:** Full code duplication between `mobile/` and `shemax-mobile/`

**Risk:** Every fix must be made twice, high divergence risk.

**Recommendation:** Establish formal sync process or extract shared package.

---

### 10. Anonymous Product Click Tracking
**Location:** `mobile/lib/supabase/api.ts:998-1012`
```typescript
user_id: user?.id || null
```

**Issue:** Tracking clicks without user attribution.

**Risk:** Broken analytics, potential GDPR implications.

---

## Low Severity

### 11. Poor Commit Messages
**Recent commits:** `4ddd9a7 poo`, `d73029d poo`

**Impact:** Unhelpful git history.

---

### 12. Large Screen Components
**Files:** CameraScreen, AnalysisScreen, MarketplaceScreen (~1600 LOC total)

**Issue:** Components mixing multiple concerns.

**Impact:** Harder to test, maintain, refactor.

---

### 13. Missing Test Infrastructure
**Issue:** No Jest/Vitest, no test files, no coverage.

**Impact:** No automated regression testing.

---

### 14. Exposed Service IDs in env.example
**Location:** `mobile/env.example`

**Issue:** Contains actual RevenueCat Project ID, App Bundle IDs.

**Risk:** Service identifiers exposed (not full credentials).

---

### 15. Referral RLS Policy Gap
**Location:** `supabase/migrations/002_row_level_security.sql:64`
```sql
CREATE POLICY "referrals_insert" ON public.referrals ... WITH CHECK (TRUE);
```

**Issue:** No restriction on referral insertions.

**Risk:** Potential referral fraud.

---

### 16. Silent Error Handling
**Location:** `web/lib/goals/service.ts:59`
```typescript
checkGoalAchievements(userId).catch((error) => { console.error(...) });
```

**Issue:** Errors logged but not surfaced to user.

---

## Remediation Priority

### Immediate
1. Remove hardcoded Supabase URLs
2. Commit or document uncommitted changes
3. Delete `fix-products-route.js` workaround
4. Implement or remove TODO features

### Before Next Release
1. Create mobile app sync strategy
2. Add proper type definitions (replace `any`)
3. Remove/disable console.log statements
4. Fix React version mismatch

### Soon
1. Fix referral RLS policy
2. Complete goal category matching
3. Improve commit message discipline
4. Break up large screen components

### Ongoing
1. Add test infrastructure
2. Better async error handling
3. Document env setup process
