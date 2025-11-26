import { Request } from 'next/server';
import {
  withAuth,
  supabaseAdmin,
  createRateLimiter,
  initRedis,
  initCache,
  getCache,
  setCache,
  createCacheKey,
  handleApiError,
  getRequestId,
  createResponseWithId,
} from '@/lib';

/**
 * GET /api/leaderboard
 * Get score leaderboard (weekly or all-time)
 * Cached for 15 minutes as per PRD Section 4.4
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    // Initialize Redis for caching and rate limiting
    await initRedis();
    await initCache();

    // Check rate limit
    await createRateLimiter('leaderboard')(request, user.id);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const filter = searchParams.get('filter') || 'this_week'; // this_week, all_time, by_location

    // Create cache key
    const cacheKey = createCacheKey('/api/leaderboard', {
      limit: limit.toString(),
      offset: offset.toString(),
      filter,
    });

    // Check cache (15 minutes = 900 seconds)
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`Cache hit: ${cacheKey}`);
      return createResponseWithId(cached as { leaderboard: unknown[] }, { status: 200 }, requestId);
    }

    let query = supabaseAdmin
      .from('analyses')
      .select(`
        user_id,
        score,
        created_at,
        users!inner (
          username,
          avatar_url,
          location
        )
      `)
      .eq('is_public', true)
      .is('deleted_at', null);

    // Apply filter
    if (filter === 'this_week') {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      query = query.gte('created_at', weekStart.toISOString());
    }

    // Get data
    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Group by user and get highest score
    const userScores: Record<
      string,
      {
        user_id: string;
        score: number;
        username: string;
        avatar_url: string | null;
        location: string | null;
        created_at: string;
      }
    > = {};

    data?.forEach((analysis: any) => {
      const userId = analysis.user_id;
      if (!userScores[userId] || analysis.score > userScores[userId].score) {
        userScores[userId] = {
          user_id: userId,
          score: analysis.score,
          username: analysis.users?.username || 'Anonymous',
          avatar_url: analysis.users?.avatar_url || null,
          location: analysis.users?.location || null,
          created_at: analysis.created_at,
        };
      }
    });

    // Convert to array and sort
    const leaderboard = Object.values(userScores)
      .sort((a, b) => {
        // Sort by score descending
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // Tie-breaker: earliest timestamp
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      })
      .slice(offset, offset + limit)
      .map((item, index) => ({
        rank: offset + index + 1,
        user_id: item.user_id,
        username: item.username,
        avatar_url: item.avatar_url,
        location: item.location,
        score: item.score,
      }));

    const response = { leaderboard };

    // Cache response (15 minutes = 900 seconds)
    await setCache(cacheKey, response, 900);

    return createResponseWithId(response, { status: 200 }, requestId);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return handleApiError(error, request);
  }
});

