import { Request } from 'next/server';
import {
  supabaseAdmin,
  createRateLimiter,
  initRedis,
  handleApiError,
  getRequestId,
  createResponseWithId,
} from '@/lib';

/**
 * GET /api/leaderboard/referrals
 * Get referral leaderboard
 */
export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    // Initialize Redis for rate limiting
    await initRedis();

    // Check rate limit (no auth required for leaderboard)
    await createRateLimiter('leaderboard')(request);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Try to use database function first
    const { data, error } = await supabaseAdmin.rpc('get_referral_leaderboard', {
      limit_count: limit,
      offset_count: offset,
    });

    if (error) {
      // If function doesn't exist, do it manually
      const { data: referrals } = await supabaseAdmin
        .from('referrals')
        .select('from_user_id, users!referrals_from_user_id_fkey(username)')
        .eq('status', 'accepted');

      // Count by user
      const counts: Record<string, number> = {};
      referrals?.forEach((r: any) => {
        const userId = r.from_user_id;
        counts[userId] = (counts[userId] || 0) + 1;
      });

      // Sort and format
      const leaderboard = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(offset, offset + limit)
        .map(([userId, count], index) => ({
          rank: offset + index + 1,
          user_id: userId,
          total_invited: count,
          accepted: count,
        }));

      return createResponseWithId({ leaderboard }, { status: 200 }, requestId);
    }

    return createResponseWithId({ leaderboard: data || [] }, { status: 200 }, requestId);
  } catch (error) {
    console.error('Get referral leaderboard error:', error);
    return handleApiError(error, request);
  }
}

