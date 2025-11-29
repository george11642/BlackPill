# BlackPill RevenueCat - 2 Subscription Tiers Configuration

**Setup Date**: November 29, 2025  
**Project ID**: `2943af5e`

## Overview

BlackPill has been configured with 2 subscription tiers in RevenueCat:
1. **Monthly Subscription** - $9.99/month
2. **Yearly Subscription** - $99.99/year (25% savings vs monthly)

## Offering Configuration

### Offering Details
- **Identifier**: `default`
- **Display Name**: BlackPill Pro Subscriptions
- **RevenueCat ID**: `ofrng313be02d14`
- **Created**: 2025-11-29 at 04:25 AM UTC
- **Dashboard**: https://app.revenuecat.com/projects/2943af5e/product-catalog/offerings/ofrng313be02d14

## Products

### 1. Monthly Subscription
- **Product ID**: `prod4d0d7285f2`
- **Identifier**: `monthly_subscription`
- **Display Name**: Monthly Subscription
- **Type**: Auto-renewing subscription
- **Duration**: 1 month (P1M)
- **Price**: $9.99 USD
- **Dashboard**: https://app.revenuecat.com/projects/2943af5e/product-catalog/products/prod4d0d7285f2

### 2. Yearly Subscription
- **Product ID**: `prod191e0be160`
- **Identifier**: `yearly_subscription`
- **Display Name**: Yearly Subscription
- **Type**: Auto-renewing subscription
- **Duration**: 1 year (P1Y)
- **Price**: $99.99 USD
- **Dashboard**: https://app.revenuecat.com/projects/2943af5e/product-catalog/products/prod191e0be160

## Packages

### Package 1: Monthly ($rc_monthly)
- **Identifier**: `$rc_monthly`
- **Description**: BlackPill Pro Monthly - $9.99/month
- **Product**: Monthly Subscription (`monthly_subscription`)
- **Position**: Primary

### Package 2: Annual ($rc_annual)
- **Identifier**: `$rc_annual`
- **Description**: BlackPill Pro Yearly - $99.99/year
- **Product**: Yearly Subscription (`yearly_subscription`)
- **Position**: Best Value

## Entitlements

The BlackPill Pro entitlement was pre-configured by RevenueCat and is available for attachment to these products.

## Accessing from SDK

### iOS/Android (React Native/Expo)

```typescript
import { Offering } from 'purchases-flutter';

// Get the default offering
const offering = await Purchases.getOfferings();
const packages = offering.current?.availablePackages ?? [];

// Access specific packages
const monthlyPackage = offering.current?.getPackage('$rc_monthly');
const yearlyPackage = offering.current?.getPackage('$rc_annual');

// Get pricing info
console.log(monthlyPackage?.product.price); // "$9.99"
console.log(yearlyPackage?.product.price); // "$99.99"
```

### Web (JavaScript)

```javascript
import { revenuecatClient } from '@/lib/revenuecat/client';

// Fetch the offering
const { data } = await revenuecatClient.getOffering('default');

// Access packages
const monthlyPkg = data.packages.find(p => p.identifier === '$rc_monthly');
const yearlyPkg = data.packages.find(p => p.identifier === '$rc_annual');
```

## Test Store Configuration

For testing purposes, both products are available in the **Test Store** app (ID: `app28a4b81061`).

- **Test Store API Key**: `test_TbhCtnFLvgMVSSihzkBYOPUpQil`
- **Test Store Dashboard**: https://app.revenuecat.com/projects/2943af5e/apps/app28a4b81061

## Pricing Strategy

### Monthly vs Yearly
- **Monthly**: $9.99/month = $119.88/year
- **Yearly**: $99.99/year
- **Annual Savings**: $19.89 (16.6% discount)

This pricing encourages annual commitments while remaining competitive.

## Next Steps

### 1. Create Real Store Apps
- [ ] Create iOS App Store configuration
- [ ] Create Google Play Store configuration
- [ ] Add subscription credentials for each platform

### 2. Configure Payment Methods
- [ ] Connect App Store Connect API keys
- [ ] Connect Google Play Service Account
- [ ] Set up webhook endpoint for subscription events

### 3. Create Paywall
- [ ] Design paywall UI with both tiers
- [ ] Link to offering: `default`
- [ ] Test on test devices

### 4. Set Up Webhooks
- [ ] Configure webhook URL
- [ ] Implement subscription event handlers
- [ ] Set up database to track subscriptions

### 5. Production Setup
- [ ] Create production API keys
- [ ] Generate production images/app store assets
- [ ] Enable analytics and monitoring
- [ ] Set up subscription alerts

## Promotion Examples

You can create variants of this offering for promotions:

```typescript
// Example: Holiday promotion offering
{
  identifier: 'holiday_2024',
  displayName: 'Holiday Special - Limited Time',
  packages: [
    {
      identifier: '$rc_monthly_holiday',
      product: { id: 'monthly_subscription', price: 4.99 }, // 50% off
    },
    {
      identifier: '$rc_annual_holiday',
      product: { id: 'yearly_subscription', price: 59.99 }, // 40% off
    }
  ]
}
```

## RevenueCat Dashboard Links

- **Project Overview**: https://app.revenuecat.com/projects/2943af5e/overview
- **Product Catalog**: https://app.revenuecat.com/projects/2943af5e/product-catalog
- **Offerings**: https://app.revenuecat.com/projects/2943af5e/product-catalog/offerings
- **API Keys**: https://app.revenuecat.com/projects/2943af5e/api-keys

## Documentation & Support

- [RevenueCat Offerings Guide](https://docs.revenuecat.com/docs/offerings)
- [RevenueCat Packages](https://docs.revenuecat.com/docs/packages)
- [RevenueCat REST API](https://docs.revenuecat.com/reference/getting-started-1)
- [RevenueCat SDKs](https://docs.revenuecat.com/docs/installation)

---

**Status**: ✅ Complete - Ready for app store integration

