# Stripe Checkout Fix - Summary

## Changes Made

### 1. Removed Email Requirement ✅
- **File**: `web/src/pages/pricing.tsx`
- **Change**: Email input field is now hidden
- **Behavior**: System uses a temporary placeholder email if none provided
- **Why**: Stripe Checkout will ask for email anyway, so pre-collection is unnecessary

### 2. Improved Error Handling ✅
- **Files**: 
  - `web/src/pages/pricing.tsx`
  - `web/src/pages/api/subscriptions/create-checkout.ts`
- **Changes**:
  - Added detailed console logging for debugging
  - Better error messages when backend returns HTML instead of JSON
  - Checks content-type before parsing responses
- **Why**: The backend at `api.black-pill.app` was returning HTML error pages instead of JSON

### 3. Fixed API Routing ✅
- **File**: `web/src/pages/api/subscriptions/create-checkout.ts`
- **Change**: Hardcoded backend URL to `https://api.black-pill.app`
- **Why**: Environment variable fallback was using wrong URL

## Current Issue: Backend Not Deployed Correctly

The error message `"A server e"... is not valid JSON` indicates that:

1. The backend API at `https://api.black-pill.app` is either:
   - Not deployed
   - Returning HTML error pages (like Vercel 404 or 500 pages)
   - Missing Stripe environment variables

2. When the proxy tries to call `https://api.black-pill.app/api/subscriptions/create-checkout`, it's getting an HTML response instead of JSON.

## To Fix the Backend Issue:

### Option A: Deploy Backend to Vercel (Recommended)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Import the `backend` directory** as a new project
3. **Set Custom Domain**: `api.black-pill.app`
4. **Add Environment Variables**:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_BASIC_MONTHLY=price_...
   STRIPE_PRICE_BASIC_ANNUAL=price_...
   STRIPE_PRICE_PRO_MONTHLY=price_...
   STRIPE_PRICE_PRO_ANNUAL=price_...
   STRIPE_PRICE_UNLIMITED_MONTHLY=price_...
   STRIPE_PRICE_UNLIMITED_ANNUAL=price_...
   SUPABASE_URL=https://...
   SUPABASE_SERVICE_ROLE_KEY=...
   SUPABASE_ANON_KEY=...
   APP_URL=https://black-pill.app
   NODE_ENV=production
   ```
5. **Deploy**

### Option B: Test Locally First

1. **Run backend locally**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Update the hardcoded URL** in `web/src/pages/api/subscriptions/create-checkout.ts`:
   ```typescript
   const backendApiUrl = 'http://localhost:3000'; // For local testing
   ```

3. **Test the checkout flow**

4. **Once working, deploy to Vercel** and change back to `https://api.black-pill.app`

## How to Test

1. Go to `https://black-pill.app/pricing`
2. Click "Subscribe to Pro" (or any tier)
3. Check the browser console for logs:
   - Should show "Creating checkout session"
   - Should show "Response status" and "Response headers"
   - If error, will show what the backend returned

## Expected Flow

1. User clicks "Subscribe to Pro"
2. Frontend calls `/api/subscriptions/create-checkout` (Next.js proxy)
3. Proxy forwards to `https://api.black-pill.app/api/subscriptions/create-checkout`
4. Backend creates Stripe checkout session
5. Backend returns `{ session_id, checkout_url }`
6. Frontend redirects to `checkout_url` (Stripe Checkout page)
7. User completes payment on Stripe
8. Stripe redirects to `/subscribe/success`

## Files Modified

1. `web/src/pages/pricing.tsx` - Removed email requirement, added logging
2. `web/src/pages/api/subscriptions/create-checkout.ts` - Better error handling, logging
3. `web/src/components/Navigation.tsx` - Link to `/pricing` instead of `/#pricing`
4. `web/src/pages/index.tsx` - Link to `/pricing` instead of `/subscribe`
5. `PRD.md` - Updated URL paths to reflect `/pricing` page

## Next Steps

1. **Deploy the backend** to `api.black-pill.app` with proper environment variables
2. **Test the checkout flow** - it should now work without email requirement
3. **Verify Stripe integration** - check that prices are configured in Stripe Dashboard
4. **Test end-to-end** - complete a test payment and verify webhook handling

