import { Request } from 'next/server';
import Stripe from 'stripe';
import { withAuth, supabaseAdmin, config, handleApiError, getRequestId, createResponseWithId } from '@/lib';

const stripe = new Stripe(config.stripe.secretKey);

/**
 * GET /api/subscriptions/status
 * Get user's subscription status
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !subscription) {
      // User has no subscription (free tier)
      return createResponseWithId(
        {
          tier: 'free',
          status: 'none',
          scans_remaining: 1,
          manage_url: null,
        },
        { status: 200 },
        requestId
      );
    }

    // Get Stripe customer portal URL
    let manageUrl: string | null = null;
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

    return createResponseWithId(
      {
        tier: subscription.tier,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: !!subscription.canceled_at,
        manage_url: manageUrl,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Get subscription status error:', error);
    return handleApiError(error, request);
  }
});

