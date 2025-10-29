<!-- 47a1d021-300f-4df8-978e-1b00efad86ad 0c1a77f9-798d-49ff-8bea-38b1544aa2e9 -->
# Landing Page Enhancement Plan

## 1. Remove Gender FAQ Question

**File:** `web/src/pages/index.tsx`

Find and remove the FAQ item around line 155:

```typescript
{
  question: 'Is this app for men or women?',
  answer: 'Currently optimized for men aged 18-35. We're expanding to other audiences in future updates.'
}
```

## 2. Update Hero Mantra/Positioning

**File:** `web/src/pages/index.tsx`

**New Positioning Statement:** "Get Honest Feedback. Build Real Confidence."

Update in two places:

### Hero Section

Find the current hero subtitle/tagline and replace with:

```typescript
<h1>Get Honest Feedback. Build Real Confidence.</h1>
<p className="text-xl">AI-powered attractiveness analysis with actionable self-improvement tips</p>
```

### SEO Metadata

Update the SEO title and description:

```typescript
<SEO
  title="BlackPill - Get Honest Feedback. Build Real Confidence."
  description="Get honest AI-powered attractiveness analysis with actionable self-improvement tips. Download now on iOS and Android."
  keywords="attractiveness analysis, AI face rating, self improvement, facial assessment, confidence builder"
  structuredData={structuredData}
/>
```

## 3. Add Monthly/Annual Toggle to Pricing

**File:** `web/src/pages/index.tsx`

Add state management and toggle component:

```typescript
// At top of component after other hooks
const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');

// Function to get appropriate price
const getPrice = (tier: typeof pricingTiers[number]) => {
  if (tier.tier === 'Free') return { price: '$0', interval: 'lifetime' };
  return billingInterval === 'monthly' 
    ? { price: tier.price, interval: tier.interval }
    : { price: tier.yearlyPrice?.split('/')[0] || tier.price, interval: '/year' };
};
```

Add toggle UI before pricing cards grid (around line 242):

```typescript
{/* Pricing Toggle */}
<div className="flex justify-center items-center gap-md mb-lg">
  <button 
    onClick={() => setBillingInterval('monthly')}
    className={`px-lg py-md rounded-lg font-semibold transition ${
      billingInterval === 'monthly' 
        ? 'bg-gradient text-white' 
        : 'bg-[#1A1A2E] text-secondary hover:text-white'
    }`}
  >
    Monthly
  </button>
  <button 
    onClick={() => setBillingInterval('annual')}
    className={`px-lg py-md rounded-lg font-semibold transition flex items-center gap-sm ${
      billingInterval === 'annual' 
        ? 'bg-gradient text-white' 
        : 'bg-[#1A1A2E] text-secondary hover:text-white'
    }`}
  >
    Annual 
    <span className="badge badge-success text-xs">Save 10%</span>
  </button>
</div>
```

Update pricing card rendering to use dynamic prices based on toggle state.

**Pricing from PRD:**

- Free: $0 (always)
- Basic: $4.99/mo or $54.99/yr
- Pro: $9.99/mo or $109.89/yr  
- Unlimited: $19.99/mo or $209.89/yr

## 4. Implement Official App Store Badges

**Files to modify:**

- `web/src/pages/index.tsx` (hero section and final CTA)
- `web/src/components/Footer.tsx` (download app section)

**Step 1:** Add badge images to `web/public/badges/` directory

- Download from: https://developer.apple.com/app-store/marketing/guidelines/
- Download from: https://play.google.com/intl/en_us/badges/

**Step 2:** Replace Button components with official badges:

```typescript
<div className="flex gap-md justify-center flex-wrap items-center">
  <a 
    href="https://apps.apple.com/app/blackpill" 
    target="_blank" 
    rel="noopener noreferrer"
    className="hover:opacity-80 transition"
  >
    <img 
      src="/badges/app-store-badge.svg" 
      alt="Download on the App Store" 
      className="h-[60px]"
    />
  </a>
  <a 
    href="https://play.google.com/store/apps/details?id=com.blackpill.app" 
    target="_blank" 
    rel="noopener noreferrer"
    className="hover:opacity-80 transition"
  >
    <img 
      src="/badges/google-play-badge.png" 
      alt="Get it on Google Play" 
      className="h-[60px]"
    />
  </a>
</div>
```

Apply this pattern to:

1. Hero section download CTAs
2. Final CTA section at bottom of page
3. Footer download section

## 5. Fix Dashboard Navigation Link

**File:** `web/src/components/Navigation.tsx`

The dashboard button currently causes page scroll instead of navigation. Verify the implementation:

**Check current code around the Dashboard button** - it should look like:

```typescript
<Button href="/dashboard" variant="primary" size="sm">
  Dashboard
</Button>
```

If the Button component isn't handling the href properly, wrap it in a Link:

```typescript
<Link href="/dashboard">
  <Button variant="primary" size="sm">
    Dashboard
  </Button>
</Link>
```

Ensure `href` prop is properly passed through in the Button component implementation.

## 6. Additional Context Notes

**Stripe Integration (from PRD):**

- Payment happens through mobile app → web redirect flow
- Landing page pricing cards are informational only
- CTAs should emphasize "Download App" not "Buy Now"
- Checkout URL format: `https://black-pill.app/subscribe?tier=[tier]&user_id=[id]`

**App Store Compliance:**

- Product name "BlackPill" ✅ Safe
- New tagline "Get Honest Feedback. Build Real Confidence." ✅ Safe
- Focus on self-improvement, not ideology
- Emphasize positive outcomes and actionable tips

## Files to Modify

1. **`web/src/pages/index.tsx`** - Main changes:

   - Remove gender FAQ item
   - Update hero tagline to "Get Honest Feedback. Build Real Confidence."
   - Update SEO metadata
   - Add billing interval state and toggle
   - Update pricing cards to use dynamic prices
   - Replace download buttons with official badges (3 locations)

2. **`web/src/components/Navigation.tsx`** - Fix dashboard link

3. **`web/src/components/Footer.tsx`** - Replace download buttons with official badges

4. **`web/public/badges/`** - Add official store badge images:

   - `app-store-badge.svg`
   - `google-play-badge.png`

## Testing Checklist

- [ ] FAQ section removed "Is this app for men or women?" question
- [ ] Hero section displays "Get Honest Feedback. Build Real Confidence."
- [ ] SEO title updated with new tagline
- [ ] Pricing toggle switches between Monthly/Annual correctly
- [ ] Toggle has visual active state (gradient background on selected)
- [ ] Free tier always shows $0 regardless of toggle
- [ ] Basic shows $4.99/mo or $54.99/yr based on toggle
- [ ] Pro shows $9.99/mo or $109.89/yr based on toggle
- [ ] Unlimited shows $19.99/mo or $209.89/yr based on toggle
- [ ] Annual toggle shows "Save 10%" badge
- [ ] Official App Store badge renders in hero section
- [ ] Official Google Play badge renders in hero section
- [ ] Official badges render in final CTA section
- [ ] Official badges render in footer
- [ ] All badge links have proper href, target="_blank", rel="noopener noreferrer"
- [ ] Dashboard button navigates to /dashboard (not scroll to top)
- [ ] Mobile responsive - badges scale properly on small screens
- [ ] Toggle buttons work on mobile (touch targets are adequate)

### To-dos

- [ ] Rebuild hero section for app promotion with download CTAs and phone mockup reference
- [ ] Update How It Works section to show app user flow (Upload → Analyze → Improve)
- [ ] Replace creator features with app features (AI Analysis, Tips, Referrals, Progress, Leaderboard, Privacy)
- [ ] Update pricing section to show app subscription tiers (Free, Premium, Pro, Elite)
- [ ] Update statistics for app users (downloads, analyses, ratings)
- [ ] Add small creator program teaser section at bottom with CTA to /creators
- [ ] Replace creator FAQs with app user FAQs
- [ ] Update SEO metadata for app focus and change structured data to MobileApplication schema
- [ ] Create /creators page and move all current landing page creator content there
- [ ] Update Navigation component with new links (For Creators, anchor pricing)
- [ ] Update Footer with Download App section and For Creators link
- [ ] Delete pricing.tsx page (pricing now on landing page)
- [ ] Update cancel.tsx to focus on app subscription cancellation
- [ ] Add breadcrumb/back link to /creators on apply.tsx
- [ ] Update sitemap.xml with new /creators page and remove /pricing