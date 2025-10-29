# Quick Google OAuth Setup for BlackPill

Your Supabase Project: **taipdljedbcluebtfimk**

---

## Step 1: Get Google OAuth Credentials (5 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your BlackPill project
3. Go to **APIs & Services** → **Credentials**
4. Click **+ Create Credentials** → **OAuth client ID**
5. Select **Web application**
6. Name it: `Supabase OAuth`
7. Add these URLs under **Authorized JavaScript origins:**
   ```
   https://taipdljedbcluebtfimk.supabase.co
   https://black-pill.app
   ```
8. Add these under **Authorized redirect URIs:**
   ```
   https://taipdljedbcluebtfimk.supabase.co/auth/v1/callback
   https://black-pill.app/auth/v1/callback
   https://localhost:3000/auth/v1/callback
   ```
9. Click **Create**
10. **Copy the Client ID and Client Secret** - you'll need these next

---

## Step 2: Add Google OAuth to Supabase (2 minutes)

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select project **taipdljedbcluebtfimk**
3. Go to **Authentication** → **Providers**
4. Click on **Google**
5. Toggle **Enable Google**
6. Paste your credentials:
   - **Client ID:** (from Google Console)
   - **Client Secret:** (from Google Console)
7. Click **Save**

✅ **Done!** Google OAuth is now enabled for all platforms

---

## Step 3: Test It

### Test Email/Password First (to verify setup works)
1. Go to Supabase dashboard → **SQL Editor**
2. Create a test user via email signup
3. Check **Authentication** → **Users** to see the new user

### Test Google OAuth
1. Once mobile app is built, click "Sign in with Google"
2. Should redirect to Google login
3. After login, should redirect back to app

---

## That's It! 🎉

No Android/iOS certificates needed. Supabase handles everything automatically.

Your env variables are already set:
```
SUPABASE_URL=https://taipdljedbcluebtfimk.supabase.co
SUPABASE_ANON_KEY=your-existing-key
```

Next: Build the mobile app!
