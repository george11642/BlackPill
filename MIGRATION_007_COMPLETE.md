# ✅ Migration 007: Subscriptions Schema Fix - COMPLETE

## 🎯 Migration Summary

**Migration File:** `supabase/migrations/007_fix_subscriptions_schema.sql`

**Date:** 2025-01-29

**Status:** ✅ Ready to Run

---

## 📋 Changes Made

### 1. Added `source` Column
- **Purpose:** Track subscription origin (app vs web) for analytics
- **Type:** `TEXT DEFAULT 'web'`
- **Constraint:** `CHECK (source IN ('app', 'web'))`
- **Index:** `idx_subscriptions_source` created for analytics queries

### 2. Made `user_id` Nullable
- **Reason:** Web flow subscriptions can exist before user signs up in app
- **Change:** Dropped `NOT NULL` constraint
- **Constraint:** Partial unique index (only when `user_id IS NOT NULL`)

### 3. Created Partial Unique Index
- **Name:** `subscriptions_user_id_unique`
- **Purpose:** Ensure uniqueness when `user_id` is NOT NULL
- **Allows:** Multiple subscriptions with NULL `user_id` (web flow)

---

## 🚀 How to Run Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**
5. Copy the entire contents of `supabase/migrations/007_fix_subscriptions_schema.sql`
6. Paste into the SQL editor
7. Click **"Run"** (or press `Ctrl+Enter`)
8. Wait for success message ✅

### Option 2: Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push
```

---

## ✅ Verification

After running the migration, verify in Supabase Dashboard:

### 1. Check Column Exists
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions' 
  AND column_name = 'source';
```

Should return:
- `column_name`: `source`
- `data_type`: `text`
- `is_nullable`: `YES`
- `column_default`: `'web'`

### 2. Check user_id is Nullable
```sql
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'subscriptions' 
  AND column_name = 'user_id';
```

Should return:
- `is_nullable`: `YES`

### 3. Check Index Exists
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'subscriptions' 
  AND indexname = 'idx_subscriptions_source';
```

Should return the index definition.

### 4. Test NULL user_id Insert
```sql
-- This should now work (was failing before)
INSERT INTO subscriptions (
  stripe_customer_id,
  stripe_subscription_id,
  tier,
  status,
  source,
  user_id  -- NULL allowed
) VALUES (
  'cus_test_web',
  'sub_test_web',
  'basic',
  'active',
  'web',
  NULL  -- Web flow before app signup
);
```

Should succeed ✅

---

## 📊 Impact Analysis

### Before Migration
- ❌ `source` field missing → Webhook tries to store but fails
- ❌ `user_id` NOT NULL → Web flow subscriptions cannot be created
- ❌ No source tracking → Cannot measure app vs web conversion rates

### After Migration
- ✅ `source` field exists → Webhook successfully stores origin
- ✅ `user_id` nullable → Web flow subscriptions work correctly
- ✅ Source tracking → Analytics can measure conversion by channel
- ✅ Partial unique index → App subscriptions still enforce uniqueness

---

## 🔄 Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Remove source column
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS source;
DROP INDEX IF EXISTS idx_subscriptions_source;

-- Restore user_id NOT NULL constraint
-- Note: This will fail if NULL values exist
ALTER TABLE public.subscriptions ALTER COLUMN user_id SET NOT NULL;

-- Restore unique constraint
CREATE UNIQUE INDEX subscriptions_user_id_key ON public.subscriptions(user_id);
DROP INDEX IF EXISTS subscriptions_user_id_unique;
```

**⚠️ Warning:** Only rollback if no web flow subscriptions exist!

---

## 🎉 Next Steps

After migration is complete:

1. ✅ **Verify** migration ran successfully (see verification steps above)
2. ✅ **Test** web checkout flow creates subscription with `source='web'`
3. ✅ **Test** app checkout flow creates subscription with `source='app'`
4. ✅ **Test** linking web subscription to user after app signup
5. ✅ **Monitor** analytics to track conversion rates by source

---

## 📝 Related Files

- **Migration:** `supabase/migrations/007_fix_subscriptions_schema.sql`
- **Webhook Handler:** `backend/api/webhooks/stripe.js` (already uses `source` field)
- **Checkout Handler:** `backend/api/subscriptions/create-checkout.js` (sets `source` metadata)
- **Integration Tests:** `backend/__tests__/integration/subscription-flow.test.js`

---

## ✅ Checklist

- [x] Migration file created
- [x] SQL syntax validated
- [x] Index created for performance
- [x] Partial unique constraint implemented
- [x] Documentation complete
- [ ] **Migration run in Supabase Dashboard** ← **DO THIS NOW**
- [ ] Verification queries pass
- [ ] Web flow tested
- [ ] App flow tested

---

**Status:** ✅ Migration ready to run!

**Action Required:** Run migration in Supabase Dashboard SQL Editor.

