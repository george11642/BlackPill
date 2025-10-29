# Subscription Checkout Flow - Fix Summary

## Issues Fixed

### 1. **CORS Headers Added to Backend**
   - **File**: `backend/api/subscriptions/create-checkout.js`
   - **Fix**: Added CORS headers to allow web frontend requests
   - **Details**: 
     - Added `Access-Control-Allow-Origin: *`
     - Added `Access-Control-Allow-Methods: POST, OPTIONS`
     - Added `Access-Control-Allow-Headers: Content-Type, Authorization`
     - Added OPTIONS handler for preflight requests
     - Ensured CORS headers are set even on error responses

### 2. **Next.js API Proxy Route Created**
   - **File**: `web/src/pages/api/subscriptions/create-checkout.ts` (NEW)
   - **Purpose**: Proxy route that forwards requests from frontend to backend API
   - **Benefits**:
     - Avoids CORS issues (same-origin requests)
     - Works in both development and production
     - No hardcoded URLs needed in frontend code
     - Centralized API URL configuration

### 3. **Subscribe Page Updated**
   - **File**: `web/src/pages/subscribe.tsx`
   - **Fix**: Changed from absolute API URL to relative path
   - **Before**: `${apiBaseUrl}/api/subscriptions/create-checkout`
   - **After**: `/api/subscriptions/create-checkout`
   - **Additional**: Enhanced error handling and analytics tracking

### 4. **Cancel URL Fixed**
   - **File**: `backend/api/subscriptions/create-checkout.js`
   - **Fix**: Updated cancel URL from `/subscribe/cancel` to `/cancel`
   - **Reason**: Matches actual page route in Next.js

## Configuration Required

### Environment Variables

#### Backend (Vercel)
Ensure these are set in your backend Vercel deployment:
```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_URL=https://black-pill.app
API_BASE_URL=https://api.black-pill.app
```

#### Frontend (Vercel)
Create `.env.local` in the `web/` directory or set in Vercel:
```
NEXT_PUBLIC_API_BASE_URL=https://api.black-pill.app
```

**Note**: Replace `https://api.black-pill.app` with your actual backend API URL (e.g., your backend Vercel deployment URL like `https://black-pill-backend.vercel.app`)

### Stripe Price IDs
Ensure these are configured in your backend environment:
```
STRIPE_PRICE_BASIC_MONTHLY=price_...
STRIPE_PRICE_BASIC_ANNUAL=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
STRIPE_PRICE_UNLIMITED_MONTHLY=price_...
STRIPE_PRICE_UNLIMITED_ANNUAL=price_...
```

## How It Works Now

1. **User clicks "Subscribe"** on `/subscribe` page
2. **Frontend calls** `/api/subscriptions/create-checkout` (Next.js API route)
3. **Next.js proxy forwards** request to `${NEXT_PUBLIC_API_BASE_URL}/api/subscriptions/create-checkout`
4. **Backend creates** Stripe checkout session with CORS headers
5. **Backend returns** checkout URL to Next.js proxy
6. **Next.js proxy returns** checkout URL to frontend
7. **Frontend redirects** user to Stripe checkout page
8. **After payment**, Stripe redirects to `/success` page
9. **On cancel**, Stripe redirects to `/cancel` page

## Testing Checklist

- [ ] Set `NEXT_PUBLIC_API_BASE_URL` in frontend environment
- [ ] Verify backend CORS headers are working (check Network tab)
- [ ] Test subscription flow from homepage
- [ ] Test subscription flow with URL parameters (`?tier=pro&interval=monthly`)
- [ ] Test cancel flow (click cancel in Stripe checkout)
- [ ] Test success redirect (complete checkout)
- [活动] Verify Stripe webhook is receiving events
- [活动] Check that subscriptions are being created in database

## Files Changed

1. ✅ `backend/api/subscriptions/create-checkout.js` - Added CORS headers, fixed cancel URL
2. ✅ `web/src/pages/api/subscriptions/create-checkout.ts` - NEW - API proxy route
3. ✅ `web/src/pages/subscribe.tsx` - Updated to use relative API path
4. ✅ `web/.env.example` - NEW - Environment variable template

## Next Steps

1. **Deploy changes** to both frontend and backend Vercel deployments
2. **Set environment variables** in Vercel dashboard
3. **Test the complete flow** end-to-end
4. **Monitor logs** for any errors during checkout
5. **Verify Stripe webhooks** are processing subscription events correctly

## Troubleshooting

### Issue: CORS errors in browser console
- **Solution**: Verify `NEXT_PUBLIC_API_BASE_URL` is set correctly
- **Check**: Backend CORS headers are present in Network tab

### Issue: 404 on `/api/subscriptions/create-checkout`
- **Solution**: Ensure the API route file exists at `web/src/pages/api/subscriptions/create-checkout.ts`
- **Check**: Restart Next.js dev server after creating the file

### Issue: "Price not configured" error
- **Solution**: Set all Stripe price IDs in backend environment variables
- **Check**: Verify price IDs match your Stripe product configuration

### Issue: Checkout redirects to wrong URL
- **Solution**: Verify `APP_URL` is set correctly in backend environment
- **Check**: Ensure `success_url` and `cancel_url` in checkout session are correct

