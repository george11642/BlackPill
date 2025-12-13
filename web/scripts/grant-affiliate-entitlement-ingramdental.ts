/**
 * RevenueCat Promotional Entitlement Script
 * Grants promotional "Smile Score Pro" entitlement to affiliate Ingramdental1@gmail.com
 * 
 * Usage: npx ts-node web/scripts/grant-affiliate-entitlement-ingramdental.ts
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// RevenueCat API Configuration
const REVENUECAT_API_KEY = 'sk_DvigqGHfvUKVTVSMoweFIwhKyAeym';
const REVENUECAT_BASE_URL = 'https://api.revenuecat.com/v2';
const PROJECT_ID = 'projeea6f328';
// This is the human-facing entitlement identifier you provided (we'll map it to the v2 entitlement id).
const ENTITLEMENT_IDENTIFIER = 'Smile Score Pro';
const AFFILIATE_EMAIL = 'Ingramdental1@gmail.com';

// "No expiration" isn't a first-class concept in v2 grant_entitlement; we use a far-future timestamp.
const LIFETIME_EXPIRES_AT_MS = 253402300799000; // 9999-12-31T23:59:59.000Z

// Generate App User ID
function generateAppUserId(): string {
  const uuid = uuidv4();
  return `affiliate_ingramdental_${uuid}`;
}

function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${REVENUECAT_API_KEY}`,
    'Content-Type': 'application/json',
  } as const;
}

// Create or get customer (API v2)
async function getOrCreateCustomer(customerId: string): Promise<void> {
  try {
    const getUrl = `${REVENUECAT_BASE_URL}/projects/${PROJECT_ID}/customers/${customerId}`;

    try {
      const getResp = await axios.get(getUrl, { headers: getAuthHeaders() });
      if (getResp.status === 200) {
        console.log('✅ Customer retrieved successfully');
        return;
      }
    } catch (err: any) {
      if (err?.response?.status !== 404) throw err;
      console.log('Customer not found, creating...');
    }

    const createUrl = `${REVENUECAT_BASE_URL}/projects/${PROJECT_ID}/customers`;
    const createResp = await axios.post(
      createUrl,
      { id: customerId },
      { headers: getAuthHeaders() }
    );

    if (createResp.status === 201) {
      console.log('✅ Customer created successfully');
      return;
    }

    throw new Error(`Unexpected status code: ${createResp.status}`);
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        `Failed to create/get customer: ${error.response.status} ${error.response.statusText} - ${JSON.stringify(error.response.data)}`
      );
    }
    if (error.request) {
      throw new Error(`No response received from RevenueCat API: ${error.message}`);
    }
    throw new Error(`Error setting up request: ${error.message}`);
  }
}

// Set email as custom attribute
async function setEmailAttribute(appUserId: string, email: string): Promise<void> {
  try {
    const url = `${REVENUECAT_BASE_URL}/projects/${PROJECT_ID}/customers/${appUserId}/attributes`;
    const response = await axios.post(
      url,
      {
        attributes: [
          {
            name: '$email',
            value: email,
          },
        ],
      },
      {
        headers: getAuthHeaders(),
      }
    );
    
    if (response.status === 200 || response.status === 201) {
      console.log(`✅ Email attribute set successfully: ${email}`);
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Failed to set email attribute: ${error.response.status} ${error.response.statusText} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      throw new Error(`No response received from RevenueCat API: ${error.message}`);
    } else {
      throw new Error(`Error setting up request: ${error.message}`);
    }
  }
}

async function resolveEntitlementId(entitlementIdentifier: string): Promise<string> {
  const url = `${REVENUECAT_BASE_URL}/projects/${PROJECT_ID}/entitlements?limit=100`;

  const resp = await axios.get(url, { headers: getAuthHeaders() });
  const items = resp.data?.items as Array<any> | undefined;
  if (!Array.isArray(items)) {
    throw new Error(`Unexpected entitlements response shape: ${JSON.stringify(resp.data)}`);
  }

  const needle = entitlementIdentifier.trim().toLowerCase();
  const match = items.find((e) => {
    const lookupKey = String(e?.lookup_key ?? '').toLowerCase();
    const displayName = String(e?.display_name ?? '').toLowerCase();
    const id = String(e?.id ?? '').toLowerCase();
    return lookupKey === needle || displayName === needle || id === needle;
  });

  if (!match?.id) {
    throw new Error(
      `Could not find entitlement matching "${entitlementIdentifier}". Available entitlements: ${items
        .map((e) => `${e?.display_name ?? e?.lookup_key ?? e?.id}`)
        .join(', ')}`
    );
  }

  return String(match.id);
}

// Grant entitlement (API v2)
async function grantEntitlementLifetime(appUserId: string, entitlementId: string): Promise<void> {
  try {
    const url = `${REVENUECAT_BASE_URL}/projects/${PROJECT_ID}/customers/${appUserId}/actions/grant_entitlement`;

    const response = await axios.post(
      url,
      {
        entitlement_id: entitlementId,
        expires_at: LIFETIME_EXPIRES_AT_MS,
      },
      { headers: getAuthHeaders() }
    );

    if (response.status === 201) {
      console.log(`✅ Entitlement granted successfully (lifetime)`);
      return;
    }

    throw new Error(`Unexpected status code: ${response.status}`);
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        `Failed to grant entitlement: ${error.response.status} ${error.response.statusText} - ${JSON.stringify(error.response.data)}`
      );
    }
    if (error.request) {
      throw new Error(`No response received from RevenueCat API: ${error.message}`);
    }
    throw new Error(`Error setting up request: ${error.message}`);
  }
}

// Main function
async function grantAffiliateEntitlement() {
  try {
    console.log('🚀 Starting RevenueCat promotional entitlement grant...\n');
    
    // Validate API key
    if (!REVENUECAT_API_KEY) {
      console.error('❌ Error: RevenueCat API key is not set');
      process.exit(1);
    }
    
    // Generate App User ID
    const appUserId = generateAppUserId();
    console.log(`📝 Generated App User ID: ${appUserId}\n`);
    
    // Step 1: Create or get subscriber
    console.log('Step 1: Creating/getting customer...');
    await getOrCreateCustomer(appUserId);
    
    // Step 2: Set email attribute
    console.log('\nStep 2: Setting email attribute...');
    await setEmailAttribute(appUserId, AFFILIATE_EMAIL);
    
    // Step 3: Grant promotional entitlement
    console.log('\nStep 3: Resolving entitlement id...');
    const entitlementId = await resolveEntitlementId(ENTITLEMENT_IDENTIFIER);
    console.log(`✅ Entitlement id: ${entitlementId}`);

    console.log('\nStep 4: Granting entitlement (lifetime)...');
    await grantEntitlementLifetime(appUserId, entitlementId);
    
    // Success output
    console.log('\n✅ Setup complete!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 IMPORTANT: App User ID for affiliate');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n${appUserId}\n`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n💡 When the affiliate creates their account in the app,');
    console.log('   they should call: Purchases.logIn(APP_USER_ID)');
    console.log(`   with the App User ID above to get their Pro access.\n`);
    
  } catch (error: any) {
    console.error('\n❌ Error during entitlement grant:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the script
grantAffiliateEntitlement();
