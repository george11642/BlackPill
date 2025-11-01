# Current Supabase Redirect URLs Status

## Project Information
- **Project ID:** `wzsxpxwwgaqiaoxdyhnf`
- **Project Name:** BlackPill
- **Supabase URL:** `https://wzsxpxwwgaqiaoxdyhnf.supabase.co`

## Required Redirect URLs

Based on your application code analysis, the following redirect URLs **must** be configured:

### ✅ Mobile Deep Links (Required)
1. `blackpill://auth/callback` - **CRITICAL** - OAuth callback for Google sign-in
2. `blackpill://subscribe/success` - Subscription success callback  
3. `blackpill://ref/*` - Referral code deep links (wildcard pattern)

### ✅ Web URLs (Recommended)
4. `https://wzsxpxwwgaqiaoxdyhnf.supabase.co/auth/v1/callback` - Default Supabase callback (usually auto-configured)
5. `https://black-pill.app/auth/v1/callback` - Production web OAuth callback
6. `https://localhost:3000/auth/v1/callback` - Local development

## How to Add

Unfortunately, Supabase MCP tools don't have direct access to update auth redirect URLs. You need to add these manually:

### Method 1: Supabase Dashboard (Easiest)

1. Go to https://app.supabase.com/project/wzsxpxwwgaqiaoxdyhnf
2. Navigate to **Authentication** → **URL Configuration**
3. Under **Redirect URLs**, add each URL above
4. Click **Save**

### Method 2: Management API

Use the script provided in `scripts/add_supabase_redirect_urls.ps1` or `scripts/add_supabase_redirect_urls.sh` with your Supabase access token.

## Verification

After adding URLs, test:
1. OAuth flow: Click "Sign in with Google" in app
2. Verify redirect works: Should return to app via `blackpill://auth/callback`
3. Check Supabase logs: Authentication → Logs

