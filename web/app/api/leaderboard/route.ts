import { NextResponse } from 'next/server';
import {
  supabaseAdmin,
  createRateLimiter,
  initRedis,
  initCache,
  getCache,
  setCache,
  createCacheKey,
  getRequestId,
  createResponseWithId,
  handleApiError,
} from '@/lib';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
  'Access-Control-Max-Age': '86400',
};

/**
 * OPTIONS /api/leaderboard - Handle CORS preflight
 */
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * GET /api/leaderboard
 * Get score leaderboard (weekly or all-time)
 * Cached for 15 minutes as per PRD Section 4.4
 * Public endpoint - no auth required
 */
export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    // Initialize Redis for caching and rate limiting
    await initRedis();
    await initCache();

    // Check rate limit (use IP-based since no auth required)
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    await createRateLimiter('leaderboard')(request, ip);

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
      return createResponseWithId(cached as { entries: unknown[] }, { status: 200 }, requestId);
    }

    let query = supabaseAdmin
      .from('analyses')
      .select(`
        user_id,
        score,
        created_at,
        image_url,
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
        image_url: string | null;
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
          image_url: analysis.image_url || null,
          location: analysis.users?.location || null,
          created_at: analysis.created_at,
        };
      }
    });

    // Convert to array and sort
    const sortedUsers = Object.values(userScores)
      .sort((a, b) => {
        // Sort by score descending
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // Tie-breaker: earliest timestamp
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      })
      .slice(offset, offset + limit);

    // Generate signed URLs for analysis images
    const entries = await Promise.all(
      sortedUsers.map(async (item, index) => {
        let imageUrl = item.avatar_url; // Default to profile avatar if set

        // If no avatar but has analysis image, generate signed URL
        if (!imageUrl && item.image_url) {
          try {
            // Extract file path from image_url
            let filePath = '';
            if (item.image_url.includes('/storage/v1/object/sign/analyses/')) {
              const match = item.image_url.match(/\/storage\/v1\/object\/sign\/analyses\/([^?]+)/);
              if (match) filePath = match[1];
            } else if (item.image_url.includes('/storage/v1/object/public/analyses/')) {
              const match = item.image_url.match(/\/storage\/v1\/object\/public\/analyses\/([^?]+)/);
              if (match) filePath = match[1];
            } else if (!item.image_url.startsWith('http')) {
              filePath = item.image_url;
            }

            if (filePath) {
              const { data: signedUrlData, error: signError } = await supabaseAdmin.storage
                .from('analyses')
                .createSignedUrl(filePath, 3600); // 1 hour expiry

              if (!signError && signedUrlData?.signedUrl) {
                imageUrl = signedUrlData.signedUrl;
              }
            }
          } catch (err) {
            console.error('Failed to generate signed URL for leaderboard image:', err);
          }
        }

        return {
          rank: offset + index + 1,
          userId: item.user_id,
          username: item.username,
          avatarUrl: imageUrl,
          location: item.location,
          score: item.score,
        };
      })
    );

    const response = { entries };

    // Cache response (5 minutes = 300 seconds) - shorter due to signed URLs
    await setCache(cacheKey, response, 300);

    return createResponseWithId(response, { status: 200 }, requestId);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return handleApiError(error, request);
  }
}

