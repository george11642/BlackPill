import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * GET /api/insights
 * Get user's insights
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const { searchParams } = new URL(request.url);
    const unviewed_only = searchParams.get('unviewed_only');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('user_insights')
      .select('*')
      .eq('user_id', user.id)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unviewed_only === 'true') {
      query = query.eq('is_viewed', false);
    }

    const { data: insights, error } = await query;

    if (error) {
      console.error('Insights fetch error:', error);
      throw error;
    }

    return createResponseWithId(
      {
        insights: insights || [],
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('List insights error:', error);
    return handleApiError(error, request);
  }
});

