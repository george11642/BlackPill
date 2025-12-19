# App Store Connect - IAP Product Verification & Submission Guide

**Purpose**: Step-by-step guide to verify and submit all 4 subscription products in App Store Connect before uploading Build 53.

**Critical**: Apple rejected your previous submission because subscription IAP products weren't submitted for review. This guide ensures all products are properly configured and submitted.

---

## Required Products

You must have all 4 subscription products created and submitted:

| Product ID | Price | Duration | Status Required |
|------------|-------|----------|----------------|
| `pro_monthly` | $12.99 | Monthly | Ready to Submit |
| `pro_yearly` | $119.99 | Yearly | Ready to Submit |
| `elite_monthly` | $19.99 | Monthly | Ready to Submit |
| `elite_yearly` | $219.99 | Yearly | Ready to Submit |

---

## Step 1: Access App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Sign in with your Apple Developer account
3. Navigate to **My Apps**
4. Select **BlackPill** (or your app name)

---

## Step 2: Navigate to In-App Purchases

1. In your app's dashboard, click on the **Features** tab (or **App Information** → **In-App Purchases**)
2. Click on **In-App Purchases** in the left sidebar
3. You should see a list of your subscription products

---

## Step 3: Verify Each Product Exists

For each of the 4 products, verify they exist:

### Check Product IDs Match Exactly

- ✅ `pro_monthly` (must match exactly - case sensitive)
- ✅ `pro_yearly` (must match exactly - case sensitive)
- ✅ `elite_monthly` (must match exactly - case sensitive)
- ✅ `elite_yearly` (must match exactly - case sensitive)

**If any product is missing**, click the **+** button to create it:
- Select **Auto-Renewable Subscription**
- Enter the exact Product ID (e.g., `pro_monthly`)
- Click **Create**

---

## Step 4: Configure Each Product

For each product, click on it to open the configuration page. Verify/complete the following:

### 4.1 Subscription Information

**Reference Name**: (e.g., "Pro Monthly", "Elite Yearly")
- This is for your reference only
- Can be different from Product ID

**Product ID**: 
- Must match exactly: `pro_monthly`, `pro_yearly`, `elite_monthly`, or `elite_yearly`
- ✅ Verify this matches your code exactly

**Subscription Group**: 
- All 4 products must be in the **same subscription group**
- If you don't have a group, create one: "BlackPill Subscriptions"
- This ensures users can only have one active subscription at a time

**Subscription Duration**:
- Monthly products: **1 Month**
- Yearly products: **1 Year**

### 4.2 Pricing and Availability

**Price**:
- `pro_monthly`: **$12.99** USD
- `pro_yearly`: **$119.99** USD
- `elite_monthly`: **$19.99** USD
- `elite_yearly`: **$219.99** USD

**Availability**: 
- Set to **All Countries and Regions** (or your target markets)

### 4.3 Localization

**Required for each product**:

1. Click **Add Localization** or edit existing
2. Select **English (U.S.)** (or your primary language)
3. Fill in:
   - **Display Name**: (e.g., "Pro Monthly", "Elite Yearly")
   - **Description**: Clear description of what the subscription includes
   
**Example Descriptions**:

- **Pro Monthly**: "Pro Monthly subscription - 10 unblurred scans per month, AI Coach access, and more premium features."
- **Pro Yearly**: "Pro Yearly subscription - 10 unblurred scans per month, AI Coach access, and more premium features. Save with annual billing."
- **Elite Monthly**: "Elite Monthly subscription - 30 unblurred scans per month, unlimited AI Coach, AI Transform, and all premium features."
- **Elite Yearly**: "Elite Yearly subscription - 30 unblurred scans per month, unlimited AI Coach, AI Transform, and all premium features. Save with annual billing."

### 4.4 Review Information

**Review Screenshot** (Required):
- Upload a screenshot showing the subscription purchase screen in your app
- Should clearly show the subscription options and pricing

**Review Notes** (Optional but recommended):
- Add any notes that help Apple reviewers understand your subscription model
- Example: "This is a subscription-based app that provides AI-powered attractiveness analysis and self-improvement features."

---

## Step 5: Check Product Status

For each product, check the status in the top-right corner:

### Status Options:

- **Missing Metadata**: ❌ Product is incomplete - fix missing fields
- **Ready to Submit**: ✅ Product is complete and ready for review
- **Waiting for Review**: ⏳ Product is submitted and awaiting Apple review
- **Approved**: ✅ Product has been approved by Apple
- **Rejected**: ❌ Product was rejected - check rejection reason

**Required Status**: All 4 products must be **"Ready to Submit"** or **"Approved"** before you submit your app.

---

## Step 6: Submit Products for Review

If any product shows "Missing Metadata" or "Ready to Submit":

1. **Complete all required fields** (see Step 4)
2. **Click "Save"** on each product page
3. **Return to the In-App Purchases list**
4. **Select all 4 products** (checkboxes)
5. **Click "Submit for Review"** button (top right)

**Note**: Products can be submitted individually or together. It's recommended to submit all 4 at once.

---

## Step 7: Link Products to App Version

When submitting your app build:

1. Go to your app's **App Store** tab
2. Select the version you're submitting (or create a new version)
3. Scroll to **In-App Purchases** section
4. **Add** all 4 subscription products to this version
5. This links the products to your app submission

**Critical**: Products must be linked to your app version for Apple to review them together.

---

## Step 8: Verify Before Submission

Before uploading Build 53, verify:

### ✅ Checklist:

- [ ] All 4 products exist in App Store Connect
- [ ] Product IDs match exactly: `pro_monthly`, `pro_yearly`, `elite_monthly`, `elite_yearly`
- [ ] Prices are correct: $12.99, $119.99, $19.99, $219.99
- [ ] All products are in the same subscription group
- [ ] All products have localizations (display name and description)
- [ ] All products have review screenshots
- [ ] All products show status "Ready to Submit" or "Approved"
- [ ] Products are submitted for review (if not already approved)
- [ ] Products are linked to your app version

---

## Step 9: Submit App with Products

When submitting Build 53:

1. **Upload your build** via EAS or Xcode
2. **Create or select app version** in App Store Connect
3. **Add In-App Purchases** section:
   - Click **+** next to "In-App Purchases"
   - Select all 4 subscription products
   - They should appear in the list
4. **Complete all other app metadata** (screenshots, description, etc.)
5. **Submit for Review**

**Important**: When you submit your app, Apple will review both the app and the IAP products together. If products aren't submitted, Apple will reject the app.

---

## Common Issues & Solutions

### Issue: "Missing Metadata" Status

**Solution**: 
- Check which fields are incomplete (red indicators)
- Common missing fields:
  - Localization (display name/description)
  - Review screenshot
  - Subscription group assignment
- Complete all required fields and save

### Issue: Products Not Showing in App Version

**Solution**:
- Ensure products are in "Ready to Submit" or "Approved" status
- Products must be submitted for review before they can be added to app version
- Try refreshing the page or waiting a few minutes

### Issue: Product ID Mismatch

**Solution**:
- Product IDs in App Store Connect must match your code exactly
- Check for typos, case sensitivity, underscores vs hyphens
- Your code uses: `pro_monthly`, `pro_yearly`, `elite_monthly`, `elite_yearly`
- Verify these match exactly in App Store Connect

### Issue: Subscription Group Not Configured

**Solution**:
- Create a subscription group: "BlackPill Subscriptions"
- Assign all 4 products to this group
- This ensures users can only have one active subscription

### Issue: Products Not Submitted for Review

**Solution**:
- Products must be explicitly submitted for review
- Go to In-App Purchases list
- Select products and click "Submit for Review"
- Wait for Apple to approve (usually 24-48 hours)

---

## Verification Commands

After completing the above steps, verify your setup:

### Check Product Status:
1. Go to App Store Connect → Your App → Features → In-App Purchases
2. Verify all 4 products show "Ready to Submit" or "Approved"

### Check Product IDs:
1. Click on each product
2. Verify Product ID matches exactly:
   - `pro_monthly`
   - `pro_yearly`
   - `elite_monthly`
   - `elite_yearly`

### Check Pricing:
1. Click on each product
2. Verify Pricing section shows correct prices:
   - Pro Monthly: $12.99
   - Pro Yearly: $119.99
   - Elite Monthly: $19.99
   - Elite Yearly: $219.99

---

## Timeline

**Estimated Time to Complete**:
- Creating/verifying products: 30-60 minutes
- Submitting products for review: 5 minutes
- Apple review time: 24-48 hours (usually)

**Recommendation**: Complete product setup and submission **before** uploading Build 53, so products are ready when you submit the app.

---

## Additional Resources

- [App Store Connect Help - In-App Purchases](https://help.apple.com/app-store-connect/#/devb57be10e7)
- [App Store Review Guidelines - Subscriptions](https://developer.apple.com/app-store/review/guidelines/#subscriptions)
- [RevenueCat Dashboard](https://app.revenuecat.com/projects/2943af5e) - Verify product mapping

---

## Summary

**The most critical step**: Ensure all 4 subscription products are:
1. ✅ Created in App Store Connect
2. ✅ Configured with correct Product IDs and pricing
3. ✅ Submitted for review (status: "Ready to Submit" or "Approved")
4. ✅ Linked to your app version when submitting Build 53

**Without completing these steps, Apple will reject your app submission again.**

---

**Last Updated**: For Build 53 submission  
**Next Action**: Complete Steps 1-8 above, then proceed with Build 53 upload

