import { Request } from 'next/server';
import {
  supabaseAdmin,
  handleApiError,
  getRequestId,
  createResponseWithId,
  getCache,
  setCache,
  createCacheKey,
} from '@/lib';

/**
 * GET /api/community/public-analyses
 * Get public analyses for community feed
 * Cached for 5 minutes
 */
export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Create cache key
    const cacheKey = createCacheKey('community', 'public-analyses', { limit, offset });

    // Try to get from cache
    const cached = await getCache(cacheKey);
    if (cached) {
      return createResponseWithId(cached, { status: 200 }, requestId);
    }

    // Get public analyses with user info
    const { data: analyses, error, count } = await supabaseAdmin
      .from('analyses')
      .select(
        `
        id,
        score,
        breakdown,
        image_thumbnail_url,
        like_count,
        view_count,
        created_at,
        users!inner (
          id,
          username,
          avatar_url
        )
      `,
        { count: 'exact' }
      )
      .eq('is_public', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    const response = {
      analyses: analyses || [],
      total: count || 0,
      limit,
      offset,
    };

    // Cache for 5 minutes (300 seconds)
    await setCache(cacheKey, response, 300);

    return createResponseWithId(response, { status: 200 }, requestId);
  } catch (error) {
    console.error('Get public analyses error:', error);
    return handleApiError(error, request);
  }
}

