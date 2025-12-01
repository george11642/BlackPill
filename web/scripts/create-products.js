#!/usr/bin/env node
const Stripe = require('stripe');
const fs = require('fs');

// You need to provide your actual key
const apiKey = process.argv[2];
if (!apiKey) {
  console.error('Usage: node create-products.js <STRIPE_SECRET_KEY>');
  process.exit(1);
}

const stripe = new Stripe(apiKey);

async function createProducts() {
  try {
    console.log('Creating Pro product...');
    const proProduct = await stripe.products.create({
      name: 'BlackPill Pro',
      metadata: { tier: 'pro' }
    });
    console.log(`✅ Pro Product: ${proProduct.id}`);

    console.log('Creating Elite product...');
    const eliteProduct = await stripe.products.create({
      name: 'BlackPill Elite',
      metadata: { tier: 'elite' }
    });
    console.log(`✅ Elite Product: ${eliteProduct.id}`);

    console.log('\nCreating prices...');
    
    const proMonthly = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 1299,
      currency: 'usd',
      recurring: { interval: 'month' }
    });
    console.log(`✅ Pro Monthly ($12.99): ${proMonthly.id}`);

    const proAnnual = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 11999,
      currency: 'usd',
      recurring: { interval: 'year' }
    });
    console.log(`✅ Pro Annual ($119.99): ${proAnnual.id}`);

    const eliteMonthly = await stripe.prices.create({
      product: eliteProduct.id,
      unit_amount: 1999,
      currency: 'usd',
      recurring: { interval: 'month' }
    });
    console.log(`✅ Elite Monthly ($19.99): ${eliteMonthly.id}`);

    const eliteAnnual = await stripe.prices.create({
      product: eliteProduct.id,
      unit_amount: 21999,
      currency: 'usd',
      recurring: { interval: 'year' }
    });
    console.log(`✅ Elite Annual ($219.99): ${eliteAnnual.id}`);

    console.log('\n=====================================');
    console.log('📋 ADD THESE TO YOUR .env.local:\n');
    console.log(`STRIPE_PRICE_PRO_MONTHLY=${proMonthly.id}`);
    console.log(`STRIPE_PRICE_PRO_ANNUAL=${proAnnual.id}`);
    console.log(`STRIPE_PRICE_ELITE_MONTHLY=${eliteMonthly.id}`);
    console.log(`STRIPE_PRICE_ELITE_ANNUAL=${eliteAnnual.id}`);
    console.log('\n=====================================');
    console.log('📋 ADD THESE TO VERCEL ENVIRONMENT:\n');
    console.log(`STRIPE_PRICE_PRO_MONTHLY=${proMonthly.id}`);
    console.log(`STRIPE_PRICE_PRO_ANNUAL=${proAnnual.id}`);
    console.log(`STRIPE_PRICE_ELITE_MONTHLY=${eliteMonthly.id}`);
    console.log(`STRIPE_PRICE_ELITE_ANNUAL=${eliteAnnual.id}`);
    console.log('=====================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createProducts();

