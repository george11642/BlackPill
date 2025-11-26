import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId, config } from '@/lib';

/**
 * POST /api/creators/coupons
 * Create a discount coupon
 */
export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const { code, discount_percent, max_uses, expires_at } = body;

    // Validate
    if (!code || discount_percent === undefined) {
      return createResponseWithId(
        {
          error: 'Code and discount_percent required',
        },
        { status: 400 },
        requestId
      );
    }

    if (discount_percent < 0 || discount_percent > 100) {
      return createResponseWithId(
        {
          error: 'Discount must be between 0 and 100',
        },
        { status: 400 },
        requestId
      );
    }

    // Get creator record
    const { data: creator } = await supabaseAdmin
      .from('creators')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!creator || creator.status !== 'approved') {
      return createResponseWithId(
        {
          error: 'Not approved creator',
        },
        { status: 403 },
        requestId
      );
    }

    // Create coupon
    const { data: coupon, error } = await supabaseAdmin
      .from('affiliate_coupons')
      .insert({
        creator_id: creator.id,
        code: code.toUpperCase(),
        discount_percent,
        max_uses: max_uses || 100,
        expires_at: expires_at || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return createResponseWithId(
          {
            error: 'Coupon code already exists',
          },
          { status: 409 },
          requestId
        );
      }
      throw error;
    }

    // Generate tracking URL
    const trackingUrl = `${config.app.url}/subscribe?coupon=${coupon.code}`;

    return createResponseWithId(
      {
        coupon_id: coupon.id,
        code: coupon.code,
        discount_percent: coupon.discount_percent,
        max_uses: coupon.max_uses,
        tracking_url: trackingUrl,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Create coupon error:', error);
    return handleApiError(error, request);
  }
});

