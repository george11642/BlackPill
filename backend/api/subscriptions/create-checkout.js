const Stripe = require('stripe');
const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');
const config = require('../../utils/config');

const stripe = new Stripe(config.stripe.secretKey);

/**
 * POST /api/subscriptions/create-checkout
 * Create a Stripe checkout session
 */
module.exports = async (req, res) => {
  await verifyAuth(req, res, async () => {
    try {
      const { tier, interval, coupon_code } = req.body;

      // Validate tier
      const validTiers = ['basic', 'pro', 'unlimited'];
      if (!validTiers.includes(tier)) {
        return res.status(400).json({
          error: 'Invalid tier',
          message: 'Tier must be one of: basic, pro, unlimited',
        });
      }

      // Validate interval
      if (!['monthly', 'annual'].includes(interval)) {
        return res.status(400).json({
          error: 'Invalid interval',
          message: 'Interval must be monthly or annual',
        });
      }

      // Get or create Stripe customer
      let customerId;
      const { data: existingUser } = await supabaseAdmin
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', req.user.id)
        .single();

      if (existingUser?.stripe_customer_id) {
        customerId = existingUser.stripe_customer_id;
      } else {
        const customer = await stripe.customers.create({
          email: req.user.email,
          metadata: {
            user_id: req.user.id,
          },
        });
        customerId = customer.id;
      }

      // Define price IDs (these should be created in Stripe Dashboard)
      const priceMap = {
        'basic-monthly': process.env.STRIPE_PRICE_BASIC_MONTHLY,
        'basic-annual': process.env.STRIPE_PRICE_BASIC_ANNUAL,
        'pro-monthly': process.env.STRIPE_PRICE_PRO_MONTHLY,
        'pro-annual': process.env.STRIPE_PRICE_PRO_ANNUAL,
        'unlimited-monthly': process.env.STRIPE_PRICE_UNLIMITED_MONTHLY,
        'unlimited-annual': process.env.STRIPE_PRICE_UNLIMITED_ANNUAL,
      };

      const priceId = priceMap[`${tier}-${interval}`];

      if (!priceId) {
        return res.status(400).json({
          error: 'Price not configured',
          message: 'This subscription tier is not available',
        });
      }

      // Create checkout session
      const sessionParams = {
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${config.app.url}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.app.url}/subscribe/cancel`,
        metadata: {
          user_id: req.user.id,
          tier,
        },
      };

      // Apply coupon if provided
      if (coupon_code) {
        sessionParams.discounts = [{ coupon: coupon_code }];
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      res.status(200).json({
        session_id: session.id,
        checkout_url: session.url,
      });

    } catch (error) {
      console.error('Checkout creation error:', error);
      res.status(500).json({
        error: 'Failed to create checkout session',
        message: error.message,
      });
    }
  });
};

