# Supabase Migration Guide

## 🎯 Two Ways to Run Migrations

Since Supabase CLI installation can be tricky on Windows, here are both methods:

---

## Method 1: Via Supabase Dashboard (Easiest)

### Step 1: Go to your Supabase project
1. Open https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar

### Step 2: Run each migration in order

**Migration 1: Initial Schema**
1. Click "New Query"
2. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
3. Paste into the SQL editor
4. Click "Run" (or press Ctrl+Enter)
5. Wait for success message

**Migration 2: Row-Level Security**
1. Click "New Query"
2. Copy contents of `supabase/migrations/002_row_level_security.sql`
3. Paste and Run

**Migration 3: Storage Buckets**
1. Click "New Query"
2. Copy contents of `supabase/migrations/003_storage_buckets.sql`
3. Paste and Run

**Migration 4: Review Queue & Preferences**
1. Click "New Query"
2. Copy contents of `supabase/migrations/004_review_queue_and_preferences.sql`
3. Paste and Run

**Migration 5: Comments & Votes**
1. Click "New Query"
2. Copy contents of `supabase/migrations/005_comments_and_votes.sql`
3. Paste and Run

### Step 3: Verify

Go to "Table Editor" and verify you see all 16 tables:
- ✅ users
- ✅ analyses
- ✅ subscriptions
- ✅ referrals
- ✅ leaderboard_weekly
- ✅ share_logs
- ✅ support_tickets
- ✅ creators
- ✅ affiliate_clicks
- ✅ affiliate_conversions
- ✅ affiliate_coupons
- ✅ review_queue
- ✅ user_preferences
- ✅ user_bans
- ✅ comments
- ✅ votes

---

## Method 2: Install Supabase CLI (For Advanced Users)

### On Windows (via Scoop)

1. **Install Scoop** (if not already installed):
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   irm get.scoop.sh | iex
   ```

2. **Install Supabase CLI**:
   ```powershell
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   ```

3. **Verify installation**:
   ```powershell
   supabase --version
   ```

4. **Link to your project**:
   ```powershell
   cd C:\BlackPill\BlackPill
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   
   (Find YOUR_PROJECT_REF in your Supabase dashboard URL: https://supabase.com/dashboard/project/YOUR_PROJECT_REF)

5. **Apply all migrations**:
   ```powershell
   supabase db push
   ```

### Alternative: Via Direct Download

1. Download latest release from: https://github.com/supabase/cli/releases
2. Extract `supabase.exe` to a folder
3. Add folder to PATH
4. Follow steps 3-5 above

---

## Method 3: Via npx (No Installation)

While you can't install globally, you can use npx:

```powershell
npx supabase@latest init
npx supabase@latest link --project-ref YOUR_PROJECT_REF
npx supabase@latest db push
```

---

## ✅ Verification Steps

After running migrations, verify in Supabase dashboard:

### 1. Check Tables
- Go to Table Editor
- Should see all 16 tables

### 2. Check Storage
- Go to Storage
- Should see "analyses" bucket

### 3. Check Policies
- Click on any table
- Go to "RLS" tab
- Should see policies listed

### 4. Test a Query
In SQL Editor, try:
```sql
SELECT COUNT(*) FROM users;
```
Should return 0 (no users yet)

---

## 🐛 Common Issues

### Issue: "relation does not exist"
**Solution:** Migrations not run in order. Run them sequentially (001, 002, 003, 004, 005)

### Issue: "permission denied"
**Solution:** Make sure you're using the Service Role key, not Anon key

### Issue: "policy already exists"
**Solution:** Migration already run. Skip to next one.

### Issue: "function update_updated_at_column does not exist"
**Solution:** Run migration 001 first (it creates this function)

---

## 🎯 Recommended Approach

**For Windows:** Use **Method 1** (Dashboard) - it's the most reliable

**For Mac/Linux:** Install CLI via brew/apt and use Method 2

**For Quick Test:** Use Method 3 (npx)

---

## 📋 Post-Migration Checklist

After successful migration:

- [ ] All 16 tables created
- [ ] RLS policies active (check "RLS" tab on any table)
- [ ] Storage bucket "analyses" exists
- [ ] Indexes created (check with `\di` in SQL editor)
- [ ] Triggers created (check with `\df` in SQL editor)
- [ ] Can query tables successfully

---

## 🚀 Next Steps

Once migrations are complete:
1. ✅ Database ready
2. → Configure backend `.env` with Supabase URL + keys
3. → Deploy backend to Vercel
4. → Build and run mobile app

---

**Choose the method that works best for you!** 

I recommend **Method 1 (Dashboard)** for the easiest experience on Windows.

