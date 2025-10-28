const Stripe = require('stripe');
const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');
const config = require('../../utils/config');

const stripe = new Stripe(config.stripe.secretKey);

/**
 * POST /api/subscriptions/cancel
 * Cancel user's subscription (at end of period)
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
        return res.status(404).json({
          error: 'No active subscription found',
        });
      }

      if (!subscription.stripe_subscription_id) {
        return res.status(400).json({
          error: 'Invalid subscription',
        });
      }

      // Cancel subscription at period end in Stripe
      const updatedSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          cancel_at_period_end: true,
        }
      );

      // Update local record
      await supabaseAdmin
        .from('subscriptions')
        .update({
          canceled_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      res.status(200).json({
        success: true,
        effective_date: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
      });

    } catch (error) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({
        error: 'Failed to cancel subscription',
        message: error.message,
      });
    }
  });
};

