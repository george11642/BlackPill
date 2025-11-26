import { Request } from 'next/server';
import {
  withAuth,
  supabaseAdmin,
  handleApiError,
  getRequestId,
  createResponseWithId,
  getCache,
  setCache,
  createCacheKey,
} from '@/lib';

/**
 * GET /api/creators/dashboard
 * Get creator dashboard data
 * Cached for 1 hour
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    // Create cache key
    const cacheKey = createCacheKey('creators', 'dashboard', { userId: user.id });

    // Try to get from cache
    const cached = await getCache(cacheKey);
    if (cached) {
      return createResponseWithId(cached, { status: 200 }, requestId);
    }

    // Get creator record
    const { data: creator, error } = await supabaseAdmin
      .from('creators')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !creator) {
      return createResponseWithId(
        {
          error: 'Creator not found',
          message: 'You must apply and be approved first',
        },
        { status: 404 },
        requestId
      );
    }

    if (creator.status !== 'approved') {
      return createResponseWithId(
        {
          error: 'Not approved',
          status: creator.status,
        },
        { status: 403 },
        requestId
      );
    }

    // Get total clicks
    const { count: totalClicks } = await supabaseAdmin
      .from('affiliate_clicks')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', creator.id);

    // Get total conversions
    const { count: totalConversions } = await supabaseAdmin
      .from('affiliate_conversions')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', creator.id);

    // Get revenue this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: monthlyConversions } = await supabaseAdmin
      .from('affiliate_conversions')
      .select('commission_earned')
      .eq('creator_id', creator.id)
      .gte('created_at', monthStart.toISOString());

    const revenueThisMonth =
      monthlyConversions?.reduce((sum, c) => sum + parseFloat(c.commission_earned || 0), 0) || 0;

    // Get pending payout
    const { data: pendingConversions } = await supabaseAdmin
      .from('affiliate_conversions')
      .select('commission_earned')
      .eq('creator_id', creator.id)
      .eq('status', 'approved')
      .is('paid_at', null);

    const payoutPending =
      pendingConversions?.reduce((sum, c) => sum + parseFloat(c.commission_earned || 0), 0) || 0;

    // Calculate conversion rate
    const conversionRate = totalClicks && totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    // Next payout date (15th of next month)
    const nextPayout = new Date();
    nextPayout.setMonth(nextPayout.getMonth() + 1);
    nextPayout.setDate(15);

    const response = {
      creator_id: creator.id,
      affiliate_link: `https://${creator.affiliate_link}`,
      tier: creator.tier,
      commission_rate: creator.commission_rate,
      stats: {
        total_clicks: totalClicks || 0,
        total_conversions: totalConversions || 0,
        conversion_rate: conversionRate.toFixed(2),
        revenue_this_month: revenueThisMonth.toFixed(2),
        payout_pending: payoutPending.toFixed(2),
        next_payout_date: nextPayout.toISOString().split('T')[0],
      },
    };

    // Cache for 1 hour (3600 seconds)
    await setCache(cacheKey, response, 3600);

    return createResponseWithId(response, { status: 200 }, requestId);
  } catch (error) {
    console.error('Creator dashboard error:', error);
    return handleApiError(error, request);
  }
});

