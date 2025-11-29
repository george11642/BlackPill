# RevenueCat MCP Commands Reference

This document shows how to set up BlackPill's subscription tiers using the RevenueCat MCP commands in Cursor.

## Prerequisites

Before using these MCP commands, ensure:
1. RevenueCat MCP is configured in `.cursor/mcp.json`
2. You have a valid RevenueCat API key for the BlackPill project
3. The API key belongs to project `2943af5e`

## MCP Configuration

Update `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "revenuecat": {
      "type": "http",
      "url": "https://mcp.revenuecat.ai/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_SECRET_API_KEY_HERE"
      }
    }
  }
}
```

## Creating Products (Test Store)

### 1. Create Monthly Product

```
mcp_revenuecat_mcp_RC_create_product(
  project_id: "2943af5e",
  app_id: "app28a4b81061",
  store_identifier: "monthly_subscription",
  type: "subscription",
  display_name: "Monthly Subscription",
  title: "BlackPill Pro Monthly",
  duration: "P1M"
)
```

**Result**: Product ID `prod4d0d7285f2`

Then add pricing:

```
mcp_revenuecat_mcp_RC_create_price(
  project_id: "2943af5e",
  product_id: "prod4d0d7285f2",
  prices: [
    { price: 9.99, currency: "USD" }
  ]
)
```

### 2. Create Yearly Product

```
mcp_revenuecat_mcp_RC_create_product(
  project_id: "2943af5e",
  app_id: "app28a4b81061",
  store_identifier: "yearly_subscription",
  type: "subscription",
  display_name: "Yearly Subscription",
  title: "BlackPill Pro Yearly",
  duration: "P1Y"
)
```

**Result**: Product ID `prod191e0be160`

Then add pricing:

```
mcp_revenuecat_mcp_RC_create_price(
  project_id: "2943af5e",
  product_id: "prod191e0be160",
  prices: [
    { price: 99.99, currency: "USD" }
  ]
)
```

## Creating Offering

### 3. Create Offering

```
mcp_revenuecat_mcp_RC_create_offering(
  project_id: "2943af5e",
  lookup_key: "default",
  display_name: "BlackPill Pro Subscriptions"
)
```

**Result**: Offering ID `ofrng313be02d14`

## Creating Packages

### 4. Create Monthly Package

```
mcp_revenuecat_mcp_RC_create_package(
  project_id: "2943af5e",
  offering_id: "ofrng313be02d14",
  lookup_key: "$rc_monthly",
  display_name: "BlackPill Pro Monthly - $9.99/month",
  position: 1
)
```

### 5. Create Annual Package

```
mcp_revenuecat_mcp_RC_create_package(
  project_id: "2943af5e",
  offering_id: "ofrng313be02d14",
  lookup_key: "$rc_annual",
  display_name: "BlackPill Pro Yearly - $99.99/year",
  position: 2
)
```

## Attaching Products to Packages

### 6. Attach Monthly Product to Monthly Package

```
mcp_revenuecat_mcp_RC_attach_products_to_package(
  project_id: "2943af5e",
  package_id: "pkg_monthly_id",  // Get from create_package response
  products: [
    {
      product_id: "prod4d0d7285f2",
      eligibility_criteria: "all"
    }
  ]
)
```

### 7. Attach Yearly Product to Annual Package

```
mcp_revenuecat_mcp_RC_attach_products_to_package(
  project_id: "2943af5e",
  package_id: "pkg_annual_id",  // Get from create_package response
  products: [
    {
      product_id: "prod191e0be160",
      eligibility_criteria: "all"
    }
  ]
)
```

## Creating Entitlements

### 8. Create Premium Entitlement (if needed)

```
mcp_revenuecat_mcp_RC_create_entitlement(
  project_id: "2943af5e",
  lookup_key: "premium",
  display_name: "BlackPill Pro Premium Access"
)
```

**Result**: Entitlement ID (e.g., `entX12345678`)

## Attaching Products to Entitlements

### 9. Attach Both Products to Premium Entitlement

```
mcp_revenuecat_mcp_RC_attach_products_to_entitlement(
  project_id: "2943af5e",
  entitlement_id: "entX12345678",
  product_ids: [
    "prod4d0d7285f2",   // Monthly
    "prod191e0be160"    // Yearly
  ]
)
```

## Creating Apps for Real Stores

### 10. Create iOS App

```
mcp_revenuecat_mcp_RC_create_app(
  project_id: "2943af5e",
  name: "BlackPill iOS",
  type: "app_store",
  bundle_id: "com.blackpill.app"
)
```

### 11. Create Android App

```
mcp_revenuecat_mcp_RC_create_app(
  project_id: "2943af5e",
  name: "BlackPill Android",
  type: "play_store",
  package_name: "com.blackpill.app"
)
```

## Listing/Retrieving Configuration

### List All Products

```
mcp_revenuecat_mcp_RC_list_products(
  project_id: "2943af5e"
)
```

### List All Offerings

```
mcp_revenuecat_mcp_RC_list_offerings(
  project_id: "2943af5e"
)
```

### List All Entitlements

```
mcp_revenuecat_mcp_RC_list_entitlements(
  project_id: "2943af5e"
)
```

### List All Apps

```
mcp_revenuecat_mcp_RC_list_apps(
  project_id: "2943af5e"
)
```

## Troubleshooting

### Authorization Error
If you get "The API key does not belong to the project":
1. Generate a new secret API key in RevenueCat
2. Update the API key in `.cursor/mcp.json`
3. Restart Cursor

### Product Not Found
If products aren't found after creation:
1. Wait a few seconds for propagation
2. List products to verify creation
3. Check the app_id is correct

### Package Creation Failed
Ensure:
1. The offering_id is correct
2. Lookup keys don't duplicate existing packages
3. Products are already created and available

## Environment Variables

Add to your `.env` files:

**Web (.env.local)**:
```bash
NEXT_PUBLIC_REVENUECAT_PROJECT_ID=2943af5e
NEXT_PUBLIC_REVENUECAT_API_KEY=your_public_api_key
```

**Mobile (.env)**:
```bash
EXPO_PUBLIC_REVENUECAT_PROJECT_ID=2943af5e
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=your_ios_key
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=your_android_key
```

## Current Configuration IDs

For quick reference, here are the IDs created during setup:

- **Project ID**: `2943af5e`
- **Offering ID**: `ofrng313be02d14`
- **Monthly Product ID**: `prod4d0d7285f2`
- **Yearly Product ID**: `prod191e0be160`
- **Test Store App ID**: `app28a4b81061`
- **Monthly Package ID**: `$rc_monthly`
- **Annual Package ID**: `$rc_annual`

## References

- [RevenueCat API Documentation](https://docs.revenuecat.com/reference)
- [RevenueCat Offerings Guide](https://docs.revenuecat.com/docs/offerings)
- [RevenueCat Products Guide](https://docs.revenuecat.com/docs/entitlements)
- [RevenueCat Packages Guide](https://docs.revenuecat.com/docs/packages)

