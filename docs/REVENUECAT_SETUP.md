# RevenueCat Configuration for BlackPill

## Project Overview

**Project Name**: BlackPill
**Project ID**: `2943af5e`
**Category**: Health
**Platforms**: Native Apple (iOS), Native Android, Web

## RevenueCat Dashboard

Access the RevenueCat dashboard for BlackPill here:
- **Dashboard**: https://app.revenuecat.com/projects/2943af5e/overview
- **Get Started Guide**: https://app.revenuecat.com/projects/2943af5e/get-started/create-offering

## Current Configuration

### Entitlements
- **BlackPill Pro**: Main premium subscription entitlement

### Default Offering
The following packages have been suggested by RevenueCat:

1. **Monthly Subscription**
   - Duration: 1 month
   - Type: Subscription
   
2. **Yearly Subscription**
   - Duration: 1 year
   - Type: Subscription
   
3. **Lifetime In-App Purchase**
   - Duration: Lifetime
   - Type: In-App Purchase

## Environment Variables

### Web Configuration (`.env.local`)

```bash
# RevenueCat Project ID
NEXT_PUBLIC_REVENUECAT_PROJECT_ID=2943af5e

# RevenueCat API Key (for server-side operations)
NEXT_PUBLIC_REVENUECAT_API_KEY=your_revenuecat_api_key

# RevenueCat Webhook Secret (for validating webhook requests)
REVENUECAT_WEBHOOK_SECRET=your_revenuecat_webhook_secret
```

### Mobile Configuration (`mobile/.env`)

```bash
# RevenueCat Project ID
EXPO_PUBLIC_REVENUECAT_PROJECT_ID=2943af5e

# RevenueCat API Keys (platform-specific)
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=your_revenuecat_ios_api_key
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=your_revenuecat_android_api_key
```

## Next Steps

### 1. Create Apps in RevenueCat

You need to create apps for each platform in RevenueCat:

#### iOS App
1. Go to Project Settings → Apps
2. Click "Create App"
3. Select "Apple App Store"
4. Enter Bundle ID: `com.blackpill.app` (or your actual bundle ID)
5. Add shared secret (from App Store Connect)
6. Add subscription private key and issuer ID

#### Android App
1. Click "Create App"
2. Select "Google Play Store"
3. Enter Package Name: `com.blackpill.app` (or your actual package name)

#### Web App (Optional - for web checkout)
1. Click "Create App"
2. Select "Web Billing" (RevenueCat's web billing solution)
3. Configure Stripe account connection

### 2. Create Products

Products should be created for each:
- iOS subscription
- Android subscription
- Lifetime purchase

### 3. Connect to Payment Processors

#### App Store
- Requires App Store Connect credentials
- Subscription shared secret
- Subscription key ID and issuer ID

#### Google Play
- Requires Google Play Service Account JSON
- Subscription billing setup

#### Web (Optional)
- Requires Stripe account connection

### 4. Configure Webhooks

RevenueCat will send webhooks to your backend for subscription events.

**Webhook URL**: `https://your-domain.com/api/webhooks/revenuecat`

Configure in RevenueCat:
1. Go to Project Settings → Webhooks
2. Add your webhook URL
3. Add the webhook secret to your environment variables

## Integration in BlackPill

### Mobile (React Native/Expo)

The mobile app uses RevenueCat SDK for in-app purchases. Configuration is handled in:
- `mobile/lib/revenuecat/client.ts` - RevenueCat client setup
- `mobile/lib/subscription/` - Subscription state management

### Web (Next.js)

The web app uses RevenueCat for subscription management and checkout:
- Server-side APIs use RevenueCat SDK
- Client-side uses RevenueCat webhooks for subscription status

## Security Notes

- Never expose `REVENUECAT_WEBHOOK_SECRET` to the client
- `NEXT_PUBLIC_REVENUECAT_API_KEY` should be a limited API key (public key)
- Rotate API keys regularly in production
- Store secrets securely in your deployment platform (Vercel, Supabase)

## Resources

- [RevenueCat Documentation](https://docs.revenuecat.com)
- [RevenueCat Dashboard](https://app.revenuecat.com)
- [RevenueCat REST API](https://docs.revenuecat.com/reference/getting-started-1)
- [RevenueCat Mobile SDKs](https://docs.revenuecat.com/docs/installation)

## Support

For RevenueCat-specific issues:
1. Check [RevenueCat Documentation](https://docs.revenuecat.com)
2. Visit [RevenueCat Help Center](https://support.revenuecat.com)
3. Contact RevenueCat support through your dashboard

## Configuration Checklist

- [ ] Created and connected iOS App
- [ ] Created and connected Android App
- [ ] Created and connected Web App (optional)
- [ ] Set up products for each platform
- [ ] Configured payment processors (App Store, Google Play)
- [ ] Set up webhook endpoint
- [ ] Added environment variables to all deployment environments
- [ ] Tested subscription flow on test devices
- [ ] Configured production API keys

