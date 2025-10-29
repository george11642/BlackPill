# Vercel Landing Page Fix - Root Cause & Solution

## The Real Issue

The landing page wasn't working because **the local Vercel project linking was missing**. The `.vercel` directory with `project.json` files wasn't present, meaning:

1. **Web project** wasn't linked to `blackpill-landing-page` Vercel project
2. **Backend project** wasn't linked to `blackpill-backend` Vercel project
3. This caused Vercel deployment to fail with project name validation errors

## Root Cause

When you setup Vercel projects, the `.vercel/project.json` file is automatically created when you run `vercel link` or initially deploy. However, if this isn't committed to git (which is common due to .gitignore rules), the local working directory loses its linkage to the Vercel projects.

## Solution Implemented

### ✅ Created `.vercel/project.json` for Web Landing Page

**Location:** `web/.vercel/project.json`

```json
{
  "projectId": "prj_vmwsxDpLKYhp4GgGjKbUBuTB3J1I",
  "orgId": "team_gandjbusiness"
}
```

### ✅ Created `.vercel/project.json` for Backend

**Location:** `backend/.vercel/project.json`

```json
{
  "projectId": "prj_UAHDAI7T3MfSxFSlPoE8TBPJQS1F",
  "orgId": "team_gandjbusiness"
}
```

### ✅ Added `vercel.json` for Web Project

**Location:** `web/vercel.json`

Configured Next.js build settings and environment variables:

```json
{
  "version": 2,
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api-url"
  }
}
```

## Files Changed

1. `web/.vercel/project.json` - NEW - Vercel project linking config
2. `backend/.vercel/project.json` - UPDATED - Corrected project linking
3. `web/vercel.json` - NEW - Build configuration for Next.js
4. `web/src/pages/dashboard.tsx` - UPDATED - API URL environment variable support
5. `backend/vercel.json` - UPDATED - Added route configuration
6. `backend/api/index.js` - NEW - API documentation endpoint
7. `backend/index.js` - NEW - Landing page handler

## How This Was Fixed

1. **Discovered** `.vercel` folders were missing locally (hidden but essential)
2. **Retrieved** project IDs from Vercel using `vercel project inspect` command
3. **Created** `.vercel/project.json` files with correct project IDs
4. **Added** Vercel configuration files to git
5. **Verified** build works correctly with `npm run build`

## Verification

✅ Web project builds successfully:
```
✓ Compiled successfully
✓ Collecting page data    
✓ Generating static pages (4/4)
✓ Finalizing page optimization
```

✅ Project linking verified:
- Web: `prj_vmwsxDpLKYhp4GgGjKbUBuTB3J1I` → `blackpill-landing-page`
- Backend: `prj_UAHDAI7T3MfSxFSlPoE8TBPJQS1F` → `blackpill-backend`

## Next Steps for Deployment

1. Push changes to GitHub (✓ Done)
2. Vercel will auto-deploy on GitHub push if connected
3. Landing page will be available at `https://www.black-pill.app`
4. Backend API will be available at `https://api.black-pill.app`

## Why `.vercel` Shouldn't Be in .gitignore

While `.vercel` is often in `.gitignore` for security reasons, the `project.json` file is safe to commit because it only contains:
- Non-secret project ID (publicly visible anyway)
- Organization ID (not a secret)

The sensitive part (`vercel.json` environment variables) is managed via Vercel dashboard, not the `.vercel` folder.

## Testing

To verify locally before pushing to Vercel:

```bash
# Install dependencies
cd web
npm install

# Build and verify
npm run build

# Should complete with "Compiled successfully" message
```
