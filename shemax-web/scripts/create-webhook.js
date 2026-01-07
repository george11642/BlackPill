#!/usr/bin/env node
const Stripe = require('stripe');

const apiKey = process.argv[2];
if (!apiKey) {
  console.error('Usage: node create-webhook.js <STRIPE_SECRET_KEY>');
  process.exit(1);
}

const stripe = new Stripe(apiKey);

async function createWebhook() {
  try {
    console.log('Creating Stripe webhook for black-pill.app...\n');

    const webhook = await stripe.webhookEndpoints.create({
      url: 'https://black-pill.app/api/webhooks/stripe',
      enabled_events: [
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.paid',
        'invoice.payment_failed',
        'charge.dispute.created',
      ],
    });

    console.log('✅ Webhook created successfully!\n');
    console.log('Webhook ID:', webhook.id);
    console.log('URL:', webhook.url);
    console.log('Status:', webhook.status);
    console.log('Events:', webhook.enabled_events.join(', '));
    
    console.log('\n=====================================');
    console.log('📋 YOUR WEBHOOK SIGNING SECRET:\n');
    console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
    console.log('\n=====================================');
    console.log('⚠️  KEEP THIS SECRET SAFE!\n');
    console.log('Add this to:');
    console.log('1. Your .env.local file');
    console.log('2. Vercel environment variables\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\nℹ️  Webhook already exists. Check your Stripe dashboard for existing webhooks.');
    }
    process.exit(1);
  }
}

createWebhook();

