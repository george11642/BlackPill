<!-- 3da2424a-a1a1-4a0c-8b91-b9358684c94e 00152be5-ed41-4558-a0cc-4328788b01ba -->
# Fix Stripe Checkout Dependencies

## Root Cause
The backend deployment is missing a `backend/package.json` file. When Vercel deploys with Root Directory set to `backend`, it cannot find the package.json to install dependencies, causing the "Cannot find module 'stripe'" runtime error.

## Solution
Create `backend/package.json` with all required dependencies that the backend code uses:

**Dependencies needed:**
- `stripe` - Payment processing (`backend/api/subscriptions/create-checkout.js`)
- `@supabase/supabase-js` - Database client (`backend/utils/supabase.js`)
- `openai` - AI analysis (`backend/utils/openai-client.js`)
- `dotenv` - Environment variables (`backend/utils/config.js`)
- `canvas` - Image generation (`backend/utils/share-card-generator.js`)
- `sharp` - Image processing (`backend/utils/share-card-generator.js`)

**Dev dependencies:**
- `jest` - Testing framework (`backend/jest.config.js`)

## Files to Modify

### Create `backend/package.json`
New file with proper dependencies, scripts, and Node.js configuration suitable for Vercel deployment.

### Update `backend/vercel.json`
Remove the `"includeFiles": "node_modules/**"` workaround from line 10, as it's no longer needed once dependencies are properly installed.

## Expected Outcome
After deploying with the new `backend/package.json`:
- Vercel will install all dependencies during build
- Serverless functions will have access to the `stripe` module and all other packages
- The checkout flow will work correctly at `https://black-pill.app/pricing`


### To-dos

- [ ] Create backend/package.json with all required dependencies and proper configuration for Vercel deployment
- [ ] Remove the includeFiles workaround from backend/vercel.json since it will no longer be needed
- [ ] Remove the multi-path require workaround from backend/api/subscriptions/create-checkout.js (lines 1-11) and use standard require