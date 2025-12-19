# BlackPill IAP Pre-Submission Checklist - Build 53

Use this checklist before uploading to App Store Connect.

## ✅ Code Verification (COMPLETE)

- [x] Product IDs defined correctly: `pro_monthly`, `pro_yearly`, `elite_monthly`, `elite_yearly`
- [x] RevenueCat initialized in App.tsx
- [x] Subscription screen uses correct product IDs
- [x] Entitlement checks use "pro" and "elite"
- [x] Price fallbacks match requirements ($12.99, $119.99, $19.99, $219.99)

## ❌ CRITICAL: StoreKit Configuration File

- [ ] **Create `.storekit` file in Xcode**
  - [ ] File → New → File → StoreKit Configuration File
  - [ ] Save as `Products.storekit` in iOS project
  - [ ] Add all 4 subscription products:
    - [ ] `pro_monthly` - $12.99/month
    - [ ] `pro_yearly` - $119.99/year
    - [ ] `elite_monthly` - $19.99/month
    - [ ] `elite_yearly` - $219.99/year
  - [ ] Configure subscription group (all 4 in same group)
  - [ ] Add localizations (display names and descriptions)
  - [ ] Add to Xcode scheme: Edit Scheme → Run → Options → StoreKit Configuration

## ⚠️ RevenueCat Dashboard Verification

- [ ] Log into https://app.revenuecat.com/projects/2943af5e
- [ ] **Offering Configuration**:
  - [ ] Offering identifier is **"default"**
  - [ ] Offering contains 4 packages (one for each product)
  - [ ] Package identifiers match product IDs or contain tier/interval
- [ ] **Products**:
  - [ ] Product store identifiers match exactly:
    - [ ] `pro_monthly`
    - [ ] `pro_yearly`
    - [ ] `elite_monthly`
    - [ ] `elite_yearly`
  - [ ] All products are connected to App Store Connect
- [ ] **Entitlements**:
  - [ ] Pro entitlement identifier is **"pro"**
  - [ ] Elite entitlement identifier is **"elite"**
  - [ ] Both entitlements attached to correct products

## ⚠️ App Store Connect Verification

- [ ] **Subscription Products Created**:
  - [ ] `pro_monthly` - $12.99/month - Status: Ready to Submit
  - [ ] `pro_yearly` - $119.99/year - Status: Ready to Submit
  - [ ] `elite_monthly` - $19.99/month - Status: Ready to Submit
  - [ ] `elite_yearly` - $219.99/year - Status: Ready to Submit
- [ ] **Subscription Group**:
  - [ ] All 4 products in same subscription group
  - [ ] Subscription group configured correctly
- [ ] **Metadata**:
  - [ ] Display names set for all products
  - [ ] Descriptions set for all products
  - [ ] Localizations added (at least English)

## ⚠️ Environment Configuration

- [ ] **`.env` file exists** in `mobile/` directory
- [ ] `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` is set
- [ ] API key is **production** key (not sandbox/test)
- [ ] `EXPO_PUBLIC_REVENUECAT_PROJECT_ID=2943af5e` is set

## ⚠️ Build Configuration

- [ ] Build is configured for **App Store** (not sandbox)
- [ ] RevenueCat SDK version: `^8.2.0` (already installed)
- [ ] Bundle ID matches: `com.blackpill.blackpill`

## ⚠️ Testing (Before Submission)

- [ ] Build app on physical iOS device
- [ ] Test subscription purchase flow:
  - [ ] Pro Monthly purchase works
  - [ ] Pro Yearly purchase works
  - [ ] Elite Monthly purchase works
  - [ ] Elite Yearly purchase works
- [ ] Verify prices display correctly from StoreKit
- [ ] Test "Restore Purchases" functionality
- [ ] Verify entitlement checks work (features unlock correctly)

## 📋 Quick Reference

### Product IDs (Must Match Exactly):
```
pro_monthly
pro_yearly
elite_monthly
elite_yearly
```

### Prices (Must Match Exactly):
```
Pro Monthly: $12.99/month
Pro Yearly: $119.99/year
Elite Monthly: $19.99/month
Elite Yearly: $219.99/year
```

### Entitlement Identifiers:
```
pro
elite
```

### Offering Identifier:
```
default
```

---

## 🚨 Most Critical Issue

**The missing `.storekit` file is likely why Apple rejected your submission.**

This file is required for Apple to detect and validate your subscription products during submission. Without it, Apple cannot verify that your IAP products are properly configured.

**Action**: Create the StoreKit Configuration file in Xcode before building for submission.

