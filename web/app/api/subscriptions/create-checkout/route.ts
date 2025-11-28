import { Request } from 'next/server';
import Stripe from 'stripe';
import { withAuth, supabaseAdmin, config, handleApiError, getRequestId, createResponseWithId } from '@/lib';

const stripe = new Stripe(config.stripe.secretKey);

/**
 * POST /api/subscriptions/create-checkout
 * Create a Stripe checkout session
 * Supports both authenticated (app) and unauthenticated (web) flows
 */
export async function POST(request: Request) {
  const requestId = getRequestId(request);

  // Handle CORS
  const origin = request.headers.get('origin');
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // Try to get authenticated user (optional for this endpoint)
    let user: { id: string; email?: string } | null = null;
    try {
      const authHeader = request.headers.get('authorization');
      if (authHeader) {
        const { getAuthenticatedUser } = await import('@/lib');
        user = await getAuthenticatedUser(request);
      }
    } catch {
      // Not authenticated - that's okay for web flow
    }

    const body = await request.json();
    const { tier, interval, coupon_code, email, source, user_id, affiliateReferralCode } = body;

    // Validate tier
    const validTiers = ['pro', 'elite'];
    if (!validTiers.includes(tier)) {
      return createResponseWithId(
        {
          error: 'Invalid tier',
          message: 'Tier must be one of: pro, elite',
        },
        { status: 400, headers: corsHeaders },
        requestId
      );
    }

    // Validate interval
    if (!['monthly', 'annual'].includes(interval)) {
      return createResponseWithId(
        {
          error: 'Invalid interval',
          message: 'Interval must be monthly or annual',
        },
        { status: 400, headers: corsHeaders },
        requestId
      );
    }

    // Determine if user is authenticated (app flow) or not (web flow)
    const isAuthenticated = !!user;
    const checkoutSource = source || (isAuthenticated ? 'app' : 'web');
    
    // For authenticated users (app flow), use their user ID
    // For unauthenticated users (web flow), we'll create customer after checkout
    let customerId: string | undefined;
    let finalUserId = user_id;
    let finalEmail = email;

    if (isAuthenticated && user) {
      // Authenticated flow (from app)
      finalUserId = user.id;
      finalEmail = user.email || email;

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
        return createResponseWithId(
          {
            error: 'Email required',
            message: 'Email address is required for checkout',
          },
          { status: 400, headers: corsHeaders },
          requestId
        );
      }
    }

    // Define price IDs (these should be created in Stripe Dashboard)
    const priceMap: Record<string, string | undefined> = {
      'pro-monthly': process.env.STRIPE_PRICE_PRO_MONTHLY,
      'pro-annual': process.env.STRIPE_PRICE_PRO_ANNUAL,
      'elite-monthly': process.env.STRIPE_PRICE_ELITE_MONTHLY,
      'elite-annual': process.env.STRIPE_PRICE_ELITE_ANNUAL,
    };

    const priceId = priceMap[`${tier}-${interval}`];

    if (!priceId) {
      return createResponseWithId(
        {
          error: 'Price not configured',
          message: 'This subscription tier is not available',
        },
        { status: 400, headers: corsHeaders },
        requestId
      );
    }

    // Build success URL with source detection
    const successUrl =
      checkoutSource === 'app'
        ? `${config.app.url}/success?session_id={CHECKOUT_SESSION_ID}&source=app`
        : `${config.app.url}/success?session_id={CHECKOUT_SESSION_ID}&source=web`;

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: `${config.app.url}/cancel`,
      metadata: {
        tier,
        source: checkoutSource,
        ...(finalUserId && { user_id: finalUserId }),
        ...(affiliateReferralCode && { affiliate_referral_code: affiliateReferralCode }),
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

    return createResponseWithId(
      {
        session_id: session.id,
        checkout_url: session.url,
      },
      { status: 200, headers: corsHeaders },
      requestId
    );
  } catch (error) {
    console.error('Checkout creation error:', error);
    return handleApiError(error, request);
  }
}

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

