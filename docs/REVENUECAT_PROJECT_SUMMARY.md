# BlackPill RevenueCat Project - Setup Summary

**Created**: November 29, 2025

## Project Created ✅

- **Project Name**: BlackPill
- **Project ID**: `2943af5e`
- **Category**: Health
- **Platforms**: Native Apple, Native Android, Web
- **Dashboard URL**: https://app.revenuecat.com/projects/2943af5e/overview

## MCP Configuration ✅

The RevenueCat MCP has been configured in `~/.cursor/mcp.json` with:
- **Type**: HTTP
- **URL**: https://mcp.revenuecat.ai/mcp
- **Authorization**: Bearer token (API key)

Location: `c:\Users\john\.cursor\mcp.json`

## Environment Variables Updated ✅

### Web (`web/env.example`)
```bash
NEXT_PUBLIC_REVENUECAT_API_KEY=your_revenuecat_api_key
NEXT_PUBLIC_REVENUECAT_PROJECT_ID=2943af5e
REVENUECAT_WEBHOOK_SECRET=your_revenuecat_webhook_secret
```

### Mobile (`mobile/env.example`)
```bash
EXPO_PUBLIC_REVENUECAT_PROJECT_ID=2943af5e
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=your_revenuecat_ios_api_key
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=your_revenuecat_android_api_key
```

## Default Configuration Provided by RevenueCat ✅

### Entitlement
- **Name**: BlackPill Pro
- **Status**: Ready to use

### Offering (Default)
Three packages automatically configured:
1. **Monthly** (Subscription)
2. **Yearly** (Subscription)
3. **Lifetime** (In-App Purchase)

## Documentation Created ✅

- `docs/REVENUECAT_SETUP.md` - Complete setup and integration guide
- `docs/REVENUECAT_PROJECT_SUMMARY.md` - This file

## Next Steps

### Immediate Actions Required

1. **Obtain API Keys**
   - Get RevenueCat API key for server-side operations
   - Get iOS app-specific configuration from App Store Connect
   - Get Android app-specific configuration from Google Play Console

2. **Create Apps in RevenueCat**
   - Go to https://app.revenuecat.com/projects/2943af5e/overview
   - Create iOS App (Apple App Store)
   - Create Android App (Google Play Store)
   - Create Web App (if using RevenueCat web billing)

3. **Configure Products**
   - Create products for iOS subscriptions
   - Create products for Android subscriptions
   - Link products to the default offering

4. **Add to Environment Variables**
   - Set `NEXT_PUBLIC_REVENUECAT_API_KEY` in web and mobile
   - Set platform-specific API keys
   - Set `REVENUECAT_WEBHOOK_SECRET` for webhook validation

5. **Set Up Webhooks** (for backend)
   - Configure webhook URL in RevenueCat
   - Create webhook handler in backend API

6. **Test Integration**
   - Test on iOS device/simulator
   - Test on Android device/emulator
   - Test web checkout flow

## Important Notes

- ⚠️ **API Key Security**: The RevenueCat API key has been provided and should be rotated immediately for security
- 📱 **Mobile Testing**: Requires actual Apple Developer Account and Google Play Developer Account
- 🔐 **Production Keys**: Use separate API keys for development and production
- 💳 **Stripe Integration**: For web billing, Stripe account connection is required

## Links

- **RevenueCat Dashboard**: https://app.revenuecat.com/projects/2943af5e/overview
- **RevenueCat Docs**: https://docs.revenuecat.com
- **BlackPill Docs**: See `REVENUECAT_SETUP.md` for detailed configuration guide

---

**Status**: RevenueCat project created and ready for app configuration

