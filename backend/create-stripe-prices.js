require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createPrices() {
  try {
    console.log('Creating Stripe products and prices...\n');

    // 1. Basic Monthly
    const basicMonthly = await stripe.products.create({
      name: 'Basic Monthly',
      description: 'Basic plan - monthly billing',
      type: 'service',
    });
    const basicMonthlyPrice = await stripe.prices.create({
      product: basicMonthly.id,
      unit_amount: 499, // $4.99
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
    console.log(`✅ Basic Monthly: ${basicMonthlyPrice.id}`);

    // 2. Basic Annual
    const basicAnnual = await stripe.products.create({
      name: 'Basic Annual',
      description: 'Basic plan - annual billing',
      type: 'service',
    });
    const basicAnnualPrice = await stripe.prices.create({
      product: basicAnnual.id,
      unit_amount: 5499, // $54.99
      currency: 'usd',
      recurring: {
        interval: 'year',
      },
    });
    console.log(`✅ Basic Annual: ${basicAnnualPrice.id}`);

    // 3. Pro Monthly
    const proMonthly = await stripe.products.create({
      name: 'Pro Monthly',
      description: 'Pro plan - monthly billing',
      type: 'service',
    });
    const proMonthlyPrice = await stripe.prices.create({
      product: proMonthly.id,
      unit_amount: 999, // $9.99
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
    console.log(`✅ Pro Monthly: ${proMonthlyPrice.id}`);

    // 4. Pro Annual
    const proAnnual = await stripe.products.create({
      name: 'Pro Annual',
      description: 'Pro plan - annual billing',
      type: 'service',
    });
    const proAnnualPrice = await stripe.prices.create({
      product: proAnnual.id,
      unit_amount: 10989, // $109.89
      currency: 'usd',
      recurring: {
        interval: 'year',
      },
    });
    console.log(`✅ Pro Annual: ${proAnnualPrice.id}`);

    // 5. Unlimited Monthly
    const unlimitedMonthly = await stripe.products.create({
      name: 'Unlimited Monthly',
      description: 'Unlimited plan - monthly billing',
      type: 'service',
    });
    const unlimitedMonthlyPrice = await stripe.prices.create({
      product: unlimitedMonthly.id,
      unit_amount: 1999, // $19.99
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
    console.log(`✅ Unlimited Monthly: ${unlimitedMonthlyPrice.id}`);

    // 6. Unlimited Annual
    const unlimitedAnnual = await stripe.products.create({
      name: 'Unlimited Annual',
      description: 'Unlimited plan - annual billing',
      type: 'service',
    });
    const unlimitedAnnualPrice = await stripe.prices.create({
      product: unlimitedAnnual.id,
      unit_amount: 21989, // $219.89
      currency: 'usd',
      recurring: {
        interval: 'year',
      },
    });
    console.log(`✅ Unlimited Annual: ${unlimitedAnnualPrice.id}`);

    console.log('\n=== COPY THESE INTO YOUR ENV VARIABLES ===\n');
    console.log(`STRIPE_PRICE_BASIC_MONTHLY=${basicMonthlyPrice.id}`);
    console.log(`STRIPE_PRICE_BASIC_ANNUAL=${basicAnnualPrice.id}`);
    console.log(`STRIPE_PRICE_PRO_MONTHLY=${proMonthlyPrice.id}`);
    console.log(`STRIPE_PRICE_PRO_ANNUAL=${proAnnualPrice.id}`);
    console.log(`STRIPE_PRICE_UNLIMITED_MONTHLY=${unlimitedMonthlyPrice.id}`);
    console.log(`STRIPE_PRICE_UNLIMITED_ANNUAL=${unlimitedAnnualPrice.id}`);

  } catch (error) {
    console.error('Error creating Stripe prices:', error.message);
    process.exit(1);
  }
}

createPrices();
