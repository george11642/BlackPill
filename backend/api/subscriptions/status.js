const Stripe = require('stripe');
const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');
const config = require('../../utils/config');

const stripe = new Stripe(config.stripe.secretKey);

/**
 * GET /api/subscriptions/status
 * Get user's subscription status
 */
module.exports = async (req, res) => {
  await verifyAuth(req, res, async () => {
    try {
      const { data: subscription, error } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('user_id', req.user.id)
        .single();

      if (error || !subscription) {
        // User has no subscription (free tier)
        return res.status(200).json({
          tier: 'free',
          status: 'none',
          scans_remaining: 1,
          manage_url: null,
        });
      }

      // Get Stripe customer portal URL
      let manageUrl = null;
      if (subscription.stripe_customer_id) {
        try {
          const session = await stripe.billingPortal.sessions.create({
            customer: subscription.stripe_customer_id,
            return_url: `${config.app.url}/settings`,
          });
          manageUrl = session.url;
        } catch (err) {
          console.error('Failed to create portal session:', err);
        }
      }

      res.status(200).json({
        tier: subscription.tier,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.canceled_at ? true : false,
        manage_url: manageUrl,
      });

    } catch (error) {
      console.error('Get subscription status error:', error);
      res.status(500).json({
        error: 'Failed to get subscription status',
        message: error.message,
      });
    }
  });
};

