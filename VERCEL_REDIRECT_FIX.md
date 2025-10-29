# Vercel Landing Page Redirect Fix - Implementation Summary

## Issue Identified
The landing page at https://black-pill.app was redirecting to `/dashboard` instantly (server-side) without showing any content. The Vercel preview URL was also showing the dashboard page instead of the landing page.

## Root Cause
After investigation, we identified that the `vercel.json` configuration was using an older format with a `builds` array that may have been interfering with Next.js 14's automatic configuration detection.

```json
// OLD (Problematic)
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ]
}
```

## Changes Made

### 1. Simplified vercel.json (web/vercel.json)
Removed the `builds` array to allow Vercel to auto-detect Next.js 14 configuration:

```json
// NEW (Fixed)
{
  "version": 2
}
```

For Next.js 14, Vercel automatically detects and configures the build settings. The explicit `builds` array can cause routing issues.

### 2. Minor Visual Change (web/src/pages/index.tsx)
Changed "Black Pill" to "BlackPill" in the header to force a cache bust and ensure the new deployment is fresh.

### 3. Verification of Build Output
Confirmed that the local build generates both pages correctly:
- `/` - Landing page (3.6 kB, 83.6 kB First Load JS)
- `/dashboard` - Dashboard page (103 kB, 183 kB First Load JS)

Both pages are static and properly built.

## Deployment Status

**Commit:** `477d786` - "fix: Simplify vercel.json for Next.js 14 - remove builds array to fix routing"

**Pushed to GitHub:** ✅ Success
- Changes pushed to `origin/main`
- Vercel auto-deployment should trigger automatically
- Deployment URL: https://vercel.com/gandjbusiness/blackpill-landing-page

## Verification Steps

### 1. Check Vercel Deployment Status
1. Go to https://vercel.com/gandjbusiness/blackpill-landing-page
2. Look for the latest deployment (commit `477d786`)
3. Wait for "Building" → "Ready" status (usually 1-3 minutes)

### 2. Test Preview URL First
1. Click on the latest deployment in Vercel dashboard
2. Click "Visit" button to open the preview URL (e.g., `blackpill-landing-page-git-main-gandjbusiness.vercel.app`)
3. **Expected:** Landing page with "BlackPill" header, hero section, and feature cards
4. **If still showing dashboard:** There may be a deeper Vercel caching issue

### 3. Test Production Domain
1. Wait 30-60 seconds after deployment completes (for edge cache to clear)
2. Visit https://black-pill.app in a new incognito/private window
3. **Expected:** Landing page loads without redirect
4. Click "Dashboard" or "Get Started" buttons to navigate to `/dashboard`

### 4. Clear Vercel Cache (If Needed)
If the issue persists after deployment:
1. Go to Vercel project → Settings → Advanced
2. Look for "Purge Cache" or similar option
3. Purge the cache for the production domain
4. Wait 30 seconds and test again

## Additional Troubleshooting

### If Preview URL Still Shows Dashboard After New Deployment

This would indicate a more serious issue. Try these steps:

**Option A: Check Vercel Project Settings**
1. Settings → General → Root Directory
   - Should be: `web`
   - Should NOT be: empty or other directory
2. Settings → General → Framework Preset
   - Should be: "Next.js" (auto-detected)
3. Settings → Build & Development Settings
   - Build Command: `npm run build` or `next build`
   - Output Directory: `.next` (auto)
   - Install Command: `npm install` or `yarn install`

**Option B: Force Redeploy**
1. Go to Deployments tab
2. Find the latest successful deployment
3. Click the three dots menu → "Redeploy"
4. Select "Redeploy with existing Build Cache cleared"

**Option C: Check for Server Components Issues**
Since Next.js 14 uses App Router by default but this project uses Pages Router, ensure:
1. No `app/` directory exists that might take precedence
2. All pages are in `pages/` directory
3. No conflicting route definitions

**Option D: Manual Domain Re-verification**
1. Settings → Domains
2. Remove `black-pill.app` domain
3. Re-add it and wait for DNS propagation
4. Test again

### If Nothing Works: Nuclear Option

**Re-link Project to Vercel:**
```bash
cd web
rm -rf .vercel
vercel --prod
```

This will prompt you to link to the project again and do a fresh deployment.

## Technical Details

### What Was Confirmed Working
- ✅ No redirect rules in Vercel project settings
- ✅ No rewrite rules in Vercel project settings
- ✅ No edge middleware files in codebase
- ✅ Landing page builds correctly locally
- ✅ Both routes exist in Next.js routes manifest
- ✅ Project linked to correct Vercel project ID: `prj_vmwsxDpLKYhp4GgGjKbUBuTB3J1I`
- ✅ Domain `black-pill.app` configured in Vercel

### What Changed
- ❌ Removed `builds` array from vercel.json
- ✅ Simplified to minimal Vercel v2 configuration
- ✅ Forced cache bust with minor visual change

## Expected Timeline
- **Deployment trigger:** Immediate (on git push)
- **Build time:** 1-3 minutes
- **Edge cache propagation:** 30-60 seconds after deployment
- **Total time to fix:** 2-5 minutes from push

## Monitoring

You can monitor the deployment in real-time:
1. Vercel Dashboard: https://vercel.com/gandjbusiness/blackpill-landing-page
2. GitHub Actions: Check if any GitHub workflows are also triggered
3. Vercel CLI: Run `vercel logs https://black-pill.app` to see live logs

## Contact Support If Needed

If the issue persists after all troubleshooting:
1. Take screenshots of:
   - Vercel deployment logs
   - Preview URL showing wrong page
   - Production URL showing wrong page
   - Vercel Settings → Redirects (empty)
   - Vercel Settings → Domains configuration
2. Contact Vercel Support: support@vercel.com
3. Reference this deployment: `477d786`
4. Reference project ID: `prj_vmwsxDpLKYhp4GgGjKbUBuTB3J1I`

## Next Steps

1. **Wait 3-5 minutes** for the deployment to complete
2. **Check the preview URL** first to verify the fix
3. **Test production domain** in incognito mode
4. **Report back** with the results

If the landing page loads correctly, the issue is resolved! 🎉

If it still redirects, please provide:
- Screenshot of the latest deployment in Vercel dashboard
- Screenshot of what you see when visiting the preview URL
- Any error messages in Vercel deployment logs

---

**Last Updated:** October 28, 2025
**Status:** Changes pushed, awaiting deployment verification
**Commit:** 477d786

