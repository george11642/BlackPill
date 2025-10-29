const Stripe = require('stripe');
const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');
const config = require('../../utils/config');

const stripe = new Stripe(config.stripe.secretKey);

/**
 * POST /api/subscriptions/create-checkout
 * Create a Stripe checkout session
 * Supports both authenticated (app) and unauthenticated (web) flows
 */
module.exports = async (req, res) => {
  try {
    const { tier, interval, coupon_code, email, source, user_id } = req.body;

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

    // Determine if user is authenticated (app flow) or not (web flow)
    const isAuthenticated = !!req.user;
    const checkoutSource = source || (isAuthenticated ? 'app' : 'web');
    
    // For authenticated users (app flow), use their user ID
    // For unauthenticated users (web flow), we'll create customer after checkout
    let customerId;
    let finalUserId = user_id;
    let finalEmail = email;

    if (isAuthenticated) {
      // Authenticated flow (from app)
      finalUserId = req.user.id;
      finalEmail = req.user.email;

      // Get or create Stripe customer
      const { data: existingUser } = await supabaseAdmin
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', finalUserId)
        .single();

      if (existingUser?.stripe_customer_id) {
        customerId = existingUser.stripe_customer_id;
      } else {
        const customer = await stripe.customers.create({
          email: finalEmail,
          metadata: {
            user_id: finalUserId,
          },
        });
        customerId = customer.id;
      }
    } else {
      // Unauthenticated flow (from web marketing)
      // We'll use customer_email instead of customer, and create customer after checkout
      if (!finalEmail) {
        return res.status(400).json({
          error: 'Email required',
          message: 'Email address is required for checkout',
        });
      }
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

    // Build success URL with source detection
    const successUrl = checkoutSource === 'app'
      ? `${config.app.url}/subscribe/success?session_id={CHECKOUT_SESSION_ID}&source=app`
      : `${config.app.url}/subscribe/success?session_id={CHECKOUT_SESSION_ID}&source=web`;

    // Create checkout session
    const sessionParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: `${config.app.url}/subscribe/cancel`,
      metadata: {
        tier,
        source: checkoutSource,
        ...(finalUserId && { user_id: finalUserId }),
      },
    };

    // For authenticated users, use customer ID
    // For unauthenticated users, use customer_email
    if (customerId) {
      sessionParams.customer = customerId;
    } else {
      sessionParams.customer_email = finalEmail;
    }

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
};

