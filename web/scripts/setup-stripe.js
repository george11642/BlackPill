#!/usr/bin/env node

/**
 * Stripe Setup Script (Node.js)
 * Creates products and prices for BlackPill subscriptions
 * 
 * Usage: node web/scripts/setup-stripe.js
 */

const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('❌ Error: STRIPE_SECRET_KEY environment variable not set');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);

const prices = {
  'pro-monthly': { name: 'Pro Monthly', amount: 1299, interval: 'month', displayPrice: '$12.99/month' },
  'pro-annual': { name: 'Pro Annual', amount: 11999, interval: 'year', displayPrice: '$119.99/year' },
  'elite-monthly': { name: 'Elite Monthly', amount: 1999, interval: 'month', displayPrice: '$19.99/month' },
  'elite-annual': { name: 'Elite Annual', amount: 21999, interval: 'year', displayPrice: '$219.99/year' },
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

    const priceIds = {};

    // Create prices for Pro
    console.log('Creating Pro prices...');
    const proMonthlyPrice = await findOrCreatePrice(
      proProduct.id,
      prices['pro-monthly']
    );
    priceIds['pro-monthly'] = proMonthlyPrice.id;
    console.log(`  ✅ Pro Monthly (${prices['pro-monthly'].displayPrice}): ${proMonthlyPrice.id}`);

    const proAnnualPrice = await findOrCreatePrice(
      proProduct.id,
      prices['pro-annual']
    );
    priceIds['pro-annual'] = proAnnualPrice.id;
    console.log(`  ✅ Pro Annual (${prices['pro-annual'].displayPrice}): ${proAnnualPrice.id}\n`);

    // Create prices for Elite
    console.log('Creating Elite prices...');
    const eliteMonthlyPrice = await findOrCreatePrice(
      eliteProduct.id,
      prices['elite-monthly']
    );
    priceIds['elite-monthly'] = eliteMonthlyPrice.id;
    console.log(`  ✅ Elite Monthly (${prices['elite-monthly'].displayPrice}): ${eliteMonthlyPrice.id}`);

    const eliteAnnualPrice = await findOrCreatePrice(
      eliteProduct.id,
      prices['elite-annual']
    );
    priceIds['elite-annual'] = eliteAnnualPrice.id;
    console.log(`  ✅ Elite Annual (${prices['elite-annual'].displayPrice}): ${eliteAnnualPrice.id}\n`);

    // Generate environment variables
    const envVars = generateEnvVars(priceIds);
    
    // Save to file
    const outputPath = path.join(process.cwd(), 'STRIPE_ENV.txt');
    fs.writeFileSync(outputPath, envVars);
    
    console.log('✅ Setup complete!\n');
    console.log('📋 Environment variables saved to STRIPE_ENV.txt');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 COPY THESE TO YOUR .env.local:\n');
    console.log(envVars);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Error during Stripe setup:', error.message);
    process.exit(1);
  }
}

async function findOrCreateProduct(name, metadata) {
  try {
    // Search for existing product
    const products = await stripe.products.list({ limit: 100 });
    const existing = products.data.find(
      p => p.name === name && p.metadata?.tier === metadata
    );
    
    if (existing) {
      console.log(`  Found existing: ${name}`);
      return existing;
    }

    // Create new product
    console.log(`  Creating: ${name}`);
    const product = await stripe.products.create({
      name,
      metadata: {
        tier: metadata,
      },
    });

    return product;
  } catch (error) {
    console.error(`Error with product "${name}":`, error.message);
    throw error;
  }
}

async function findOrCreatePrice(productId, priceInfo) {
  try {
    // Search for existing price
    const prices = await stripe.prices.list({
      product: productId,
      limit: 100,
    });

    const existing = prices.data.find(
      p => p.unit_amount === priceInfo.amount &&
           p.recurring?.interval === priceInfo.interval &&
           p.recurring?.interval_count === 1 &&
           p.active
    );

    if (existing) {
      return existing;
    }

    // Create new price
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: priceInfo.amount,
      currency: 'usd',
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
    console.error(`Error creating price for "${priceInfo.name}":`, error.message);
    throw error;
  }
}

function generateEnvVars(priceIds) {
  return `# Stripe Configuration
# Copy these to your .env.local file

STRIPE_SECRET_KEY=${process.env.STRIPE_SECRET_KEY}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_live_YOUR_PUBLISHABLE_KEY_HERE'}
STRIPE_WEBHOOK_SECRET=${process.env.STRIPE_WEBHOOK_SECRET || 'whsec_YOUR_WEBHOOK_SECRET_HERE'}

# Price IDs (Auto-generated)
STRIPE_PRICE_PRO_MONTHLY=${priceIds['pro-monthly']}
STRIPE_PRICE_PRO_ANNUAL=${priceIds['pro-annual']}
STRIPE_PRICE_ELITE_MONTHLY=${priceIds['elite-monthly']}
STRIPE_PRICE_ELITE_ANNUAL=${priceIds['elite-annual']}`;
}

// Run setup
setupStripe().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

