<!-- 680da91a-72b7-41ff-b222-0cddcc87829b b75ffd82-91dc-4026-9875-d80ad53a124a -->
# Fix Stripe Checkout and Pricing Navigation

## Problem Analysis

1. **Stripe Checkout Issue**: Subscribe buttons on landing page (lines 327-330 in `web/src/pages/index.tsx`) link to `/subscribe?tier=...&interval=...` but the checkout flow isn't triggering properly. The API proxy route is using a fallback URL instead of the correct backend URL.
2. **Pricing Navigation Issue**: Navigation "Pricing" link (line 18 in `web/src/components/Navigation.tsx`) uses `/#pricing` which scrolls to the landing page section instead of opening a dedicated page

## Changes Required

### 1. Create Dedicated Pricing Page

**File**: `web/src/pages/pricing.tsx` (new file)

- Create marketing-focused pricing page showcasing all 4 tiers (Free, Basic, Pro, Unlimited)
- Include billing toggle (monthly/annual) for display purposes
- Free tier links to app stores, paid tiers link to `/subscribe?tier=...&interval=...` (existing subscribe page handles checkout)
- This page serves as marketing/SEO page, while `/subscribe` handles the actual checkout flow
- Add SEO metadata and proper structured data

### 2. Fix Navigation Links

**File**: `web/src/components/Navigation.tsx`

- Change line 18 from `href="/#pricing"` to `href="/pricing"` (desktop)
- Change line 50 from `href="/#pricing"` to `href="/pricing"` (mobile)

### 3. Hardcode Backend API URL

**File**: `web/src/pages/api/subscriptions/create-checkout.ts`

- Replace line 18: Change from using env vars with fallback to hardcoded `https://api.black-pill.app`
- Current: `const backendApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'https://black-pill.app';`
- New: `const backendApiUrl = 'https://api.black-pill.app';`
- This ensures checkout requests go to the correct backend endpoint

### 4. Verify Success/Cancel Pages

**Files**: `web/src/pages/success.tsx` and `web/src/pages/cancel.tsx`

- Verify these pages handle the Stripe redirect properly
- Success page should show confirmation
- Cancel page should offer to retry

## Key Implementation Details

**Pricing Page Structure**:

```typescript
// State management for billing interval
const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');

// Subscribe button redirects
href={`/subscribe?tier=${tier.tier.toLowerCase()}&interval=${billingInterval}&source=web`}
```

**API URL Fix**:

The proxy route currently falls back to `https://black-pill.app` instead of `https://api.black-pill.app`, which breaks the checkout flow. Hardcoding the URL ensures it always uses the correct backend endpoint.

### To-dos

- [ ] Create dedicated /pricing page with all subscription tiers and billing toggle
- [ ] Update Navigation component to link to /pricing page instead of landing section
- [ ] Hardcode API base URL in create-checkout.ts proxy route to https://api.black-pill.app
- [ ] Verify success and cancel pages handle Stripe redirects properly