# Supabase Redirect URLs Configuration

## ✅ Required Redirect URLs for BlackPill

Based on your current setup, the following redirect URLs need to be configured in Supabase:

### Mobile Deep Links
- `blackpill://auth/callback` - OAuth callback for mobile app
- `blackpill://subscribe/success` - Subscription success callback
- `blackpill://ref/:code` - Referral code deep links

### Web URLs (if applicable)
- `https://wzsxpxwwgaqiaoxdyhnf.supabase.co/auth/v1/callback` - Default Supabase callback (should already exist)
- `https://black-pill.app/auth/v1/callback` - Web OAuth callback
- `https://localhost:3000/auth/v1/callback` - Local development

## Current Configuration Status

**Project ID:** `wzsxpxwwgaqiaoxdyhnf` (BlackPill)  
**Deep Link Scheme:** `blackpill`  
**Supabase URL:** `https://wzsxpxwwgaqiaoxdyhnf.supabase.co`

## How to Add Redirect URLs

### Option 1: Using Scripts (Easiest)

**PowerShell (Windows):**
```powershell
# Set your Supabase access token
$env:SUPABASE_ACCESS_TOKEN = "your-access-token-here"

# Run the script
.\scripts\add_supabase_redirect_urls.ps1
```

**Bash (Mac/Linux):**
```bash
# Set your Supabase access token
export SUPABASE_ACCESS_TOKEN="your-access-token-here"

# Run the script
chmod +x scripts/add_supabase_redirect_urls.sh
./scripts/add_supabase_redirect_urls.sh
```

**Get your access token:**
1. Go to https://app.supabase.com/account/tokens
2. Click "Generate new token"
3. Copy the token and use it in the script above

### Option 2: Supabase Dashboard (Manual)

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select project: **BlackPill** (wzsxpxwwgaqiaoxdyhnf)
3. Navigate to **Authentication** → **URL Configuration**
4. Under **Redirect URLs**, add:
   ```
   blackpill://auth/callback
   blackpill://subscribe/success
   blackpill://ref/*
   ```
5. Click **Save**

### Option 3: Supabase Management API

Use the Supabase Management API to programmatically add redirect URLs:

```bash
curl -X PATCH 'https://api.supabase.com/v1/projects/taipdljedbcluebtfimk/config/auth' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "redirect_urls": [
      "blackpill://auth/callback",
      "blackpill://subscribe/success",
      "blackpill://ref/*",
      "https://taipdljedbcluebtfimk.supabase.co/auth/v1/callback",
      "https://black-pill.app/auth/v1/callback",
      "https://localhost:3000/auth/v1/callback"
    ]
  }'
```

### Option 4: Supabase CLI

```bash
supabase projects update taipdljedbcluebtfimk \
  --auth-redirect-urls "blackpill://auth/callback,blackpill://subscribe/success,blackpill://ref/*"
```

## Verification

After adding redirect URLs, test OAuth flow:
1. Open mobile app
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify redirect back to app works correctly

## Notes

- Deep link URLs like `blackpill://auth/callback` must be added to Supabase's allowed redirect URLs
- Wildcards (`*`) are supported for paths (e.g., `blackpill://ref/*`)
- URLs are case-sensitive
- Changes may take a few minutes to propagate

