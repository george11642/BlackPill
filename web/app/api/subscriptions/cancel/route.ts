
import Stripe from 'stripe';
import { withAuth, supabaseAdmin, config, handleApiError, getRequestId, createResponseWithId } from '@/lib';

const stripe = new Stripe(config.stripe.secretKey);

/**
 * POST /api/subscriptions/cancel
 * Cancel user's subscription (at end of period)
 */
export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !subscription) {
      return createResponseWithId(
        {
          error: 'No active subscription found',
        },
        { status: 404 },
        requestId
      );
    }

    if (!subscription.stripe_subscription_id) {
      return createResponseWithId(
        {
          error: 'Invalid subscription',
        },
        { status: 400 },
        requestId
      );
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

    return createResponseWithId(
      {
        success: true,
        effective_date: new Date((updatedSubscription as any).current_period_end * 1000).toISOString(),
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return handleApiError(error, request);
  }
});

