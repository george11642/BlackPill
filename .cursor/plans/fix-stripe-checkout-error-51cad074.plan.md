<!-- 51cad074-bfbe-45c3-bd87-ae9a36714f39 f14045bd-1c05-46b6-a903-9c110c49cff7 -->
# Fix Stripe Checkout Backend Configuration Error

## Problem Analysis

The error "The backend API is not configured correctly" occurs because:

1. **Hardcoded API URL**: The frontend has `https://api.black-pill.app` hardcoded instead of using environment variables
2. **Backend returning HTML**: The backend is likely returning an HTML error page (from Vercel) instead of JSON, indicating a routing or configuration issue
3. **Insufficient error logging**: Not enough diagnostic information to determine if it's a routing issue, missing env vars, or Stripe configuration problem

## Solution

### 1. Add Backend Error Diagnostics & Validation

**File**: `backend/api/subscriptions/create-checkout.js`

- Add logging at the very start of the handler to confirm it's being reached
- Add validation checks for all required environment variables (STRIPE_SECRET_KEY, all 6 STRIPE_PRICE_* variables)
- Return detailed JSON error responses with specific missing configuration details
- Add early return with clear error message if any Stripe configuration is missing
- Ensure all errors return JSON (not HTML) with proper status codes

### 2. Verify Vercel Routing Configuration

**File**: `backend/vercel.json`

- Verify routing properly handles `/api/subscriptions/*` paths
- Ensure the serverless function is being invoked correctly
- Check that the catch-all route doesn't interfere

### 3. Improve Frontend Error Handling

**File**: `web/src/pages/api/subscriptions/create-checkout.ts`

- Add more detailed logging of the backend response
- Display the actual error message from backend in user-friendly format
- Keep hardcoded API URL (no env file needed for web)

### 4. Test & Debug

Provide instructions to verify:

- Backend is accessible at `https://api.black-pill.app/api/subscriptions/create-checkout`
- All Stripe environment variables are set in Vercel backend deployment
- Frontend can properly proxy requests to backend

### To-dos

- [ ] Update web frontend to use NEXT_PUBLIC_API_URL environment variable instead of hardcoded URL
- [ ] Add comprehensive error logging and environment variable validation to backend checkout endpoint
- [ ] Create .env.local.example file for web frontend with required API configuration
- [ ] Review and fix Vercel routing configuration if needed
- [ ] Provide step-by-step instructions to test and verify the backend deployment