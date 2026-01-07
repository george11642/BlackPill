/**
 * Stripe Setup Script
 * Creates products and prices for BlackPill subscriptions
 * 
 * Usage: npx ts-node web/scripts/setup-stripe.ts
 * 
 * Products to create:
 * - Pro Monthly: $12.99/month
 * - Pro Annual: $119.99/year
 * - Elite Monthly: $19.99/month
 * - Elite Annual: $219.99/year
 */

import Stripe from 'stripe';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('Error: STRIPE_SECRET_KEY environment variable not set');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-06-20' as any,
});

interface PriceInfo {
  name: string;
  amount: number;
  interval: 'month' | 'year';
  currency: string;
}

const prices: Record<string, PriceInfo> = {
  'pro-monthly': { name: 'Pro Monthly', amount: 1299, interval: 'month', currency: 'usd' },
  'pro-annual': { name: 'Pro Annual', amount: 11999, interval: 'year', currency: 'usd' },
  'elite-monthly': { name: 'Elite Monthly', amount: 1999, interval: 'month', currency: 'usd' },
  'elite-annual': { name: 'Elite Annual', amount: 21999, interval: 'year', currency: 'usd' },
};

async function setupStripe() {
  try {
    console.log('🚀 Starting Stripe setup...\n');

    // Create or get Pro product
    let proProduct = await findOrCreateProduct('BlackPill Pro', 'pro');
    console.log(`✅ Pro Product ID: ${proProduct.id}`);

    // Create or get Elite product
    let eliteProduct = await findOrCreateProduct('BlackPill Elite', 'elite');
    console.log(`✅ Elite Product ID: ${eliteProduct.id}\n`);

    const priceIds: Record<string, string> = {};

    // Create prices for Pro
    console.log('Creating Pro prices...');
    const proMonthlyPrice = await findOrCreatePrice(
      proProduct.id,
      prices['pro-monthly']
    );
    priceIds['pro-monthly'] = proMonthlyPrice.id;
    console.log(`  ✅ Pro Monthly: ${proMonthlyPrice.id}`);

    const proAnnualPrice = await findOrCreatePrice(
      proProduct.id,
      prices['pro-annual']
    );
    priceIds['pro-annual'] = proAnnualPrice.id;
    console.log(`  ✅ Pro Annual: ${proAnnualPrice.id}\n`);

    // Create prices for Elite
    console.log('Creating Elite prices...');
    const eliteMonthlyPrice = await findOrCreatePrice(
      eliteProduct.id,
      prices['elite-monthly']
    );
    priceIds['elite-monthly'] = eliteMonthlyPrice.id;
    console.log(`  ✅ Elite Monthly: ${eliteMonthlyPrice.id}`);

    const eliteAnnualPrice = await findOrCreatePrice(
      eliteProduct.id,
      prices['elite-annual']
    );
    priceIds['elite-annual'] = eliteAnnualPrice.id;
    console.log(`  ✅ Elite Annual: ${eliteAnnualPrice.id}\n`);

    // Generate environment variables
    const envVars = generateEnvVars(priceIds);
    
    // Save to file
    const outputPath = path.join(process.cwd(), 'STRIPE_ENV.txt');
    fs.writeFileSync(outputPath, envVars);
    
    console.log('✅ Setup complete!\n');
    console.log('📋 Environment variables have been saved to STRIPE_ENV.txt');
    console.log('\n📋 Copy these to your .env.local and Vercel environment variables:\n');
    console.log(envVars);
    
  } catch (error) {
    console.error('❌ Error during Stripe setup:', error);
    process.exit(1);
  }
}

async function findOrCreateProduct(name: string, metadata: string): Promise<Stripe.Product> {
  try {
    // Search for existing product
    const products = await stripe.products.list({ limit: 100 });
    const existing = products.data.find(
      p => p.name === name && p.metadata?.tier === metadata
    );
    
    if (existing) {
      console.log(`Found existing product: ${name} (${existing.id})`);
      return existing;
    }

    // Create new product
    console.log(`Creating new product: ${name}`);
    const product = await stripe.products.create({
      name,
      metadata: {
        tier: metadata,
      },
    });

    return product;
  } catch (error) {
    console.error(`Error with product "${name}":`, error);
    throw error;
  }
}

async function findOrCreatePrice(
  productId: string,
  priceInfo: PriceInfo
): Promise<Stripe.Price> {
  try {
    // Search for existing price
    const prices = await stripe.prices.list({
      product: productId,
      limit: 100,
    });

    const existing = prices.data.find(
      p => p.unit_amount === priceInfo.amount &&
           p.recurring?.interval === priceInfo.interval &&
           p.recurring?.interval_count === 1
    );

    if (existing && existing.active) {
      console.log(`Found existing price for ${priceInfo.name}: ${existing.id}`);
      return existing;
    }

    // Create new price
    console.log(`Creating new price: ${priceInfo.name}`);
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: priceInfo.amount,
      currency: priceInfo.currency,
      recurring: {
        interval: priceInfo.interval,
        interval_count: 1,
      },
      metadata: {
        tier: priceInfo.name,
      },
    });

    return price;
  } catch (error) {
    console.error(`Error creating price for "${priceInfo.name}":`, error);
    throw error;
  }
}

function generateEnvVars(priceIds: Record<string, string>): string {
  return `
# Stripe Environment Variables
# Add these to your .env.local and Vercel

STRIPE_SECRET_KEY=${process.env.STRIPE_SECRET_KEY}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_live_...'}

# Price IDs (create these based on your setup)
STRIPE_PRICE_PRO_MONTHLY=${priceIds['pro-monthly']}
STRIPE_PRICE_PRO_ANNUAL=${priceIds['pro-annual']}
STRIPE_PRICE_ELITE_MONTHLY=${priceIds['elite-monthly']}
STRIPE_PRICE_ELITE_ANNUAL=${priceIds['elite-annual']}

# Webhook
STRIPE_WEBHOOK_SECRET=${process.env.STRIPE_WEBHOOK_SECRET || 'whsec_...'}
`.trim();
}

// Run setup
setupStripe();

