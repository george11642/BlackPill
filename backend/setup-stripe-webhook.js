require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function setupWebhook() {
  try {
    console.log('Setting up Stripe webhook endpoint...\n');

    // The webhook URL for your production backend
    const webhookUrl = 'https://api.black-pill.app/api/webhooks/stripe';

    // Events to listen for
    const enabledEvents = [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.paid',
      'invoice.payment_failed',
    ];

    // Create the webhook endpoint
    const endpoint = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: enabledEvents,
    });

    console.log('✅ Webhook endpoint created successfully!\n');
    console.log('Endpoint ID:', endpoint.id);
    console.log('URL:', endpoint.url);
    console.log('Events:', endpoint.enabled_events);
    console.log('\nWebhook Signing Secret:');
    console.log('(You need to get this from Stripe Dashboard → Developers → Webhooks)');
    console.log('\nTo retrieve your webhook secret later:');
    console.log(`- Go to https://dashboard.stripe.com/webhooks`);
    console.log(`- Find endpoint: ${webhookUrl}`);
    console.log(`- Click to view details and copy the signing secret`);
    console.log('\nAdd to your .env:');
    console.log('STRIPE_WEBHOOK_SECRET=whsec_xxx');

  } catch (error) {
    console.error('Error setting up webhook:', error.message);
    
    if (error.code === 'resource_missing') {
      console.error('\n❌ The webhook URL is not reachable yet.');
      console.error('Make sure your backend is deployed to: https://api.black-pill.app');
    }
    
    process.exit(1);
  }
}

setupWebhook();
