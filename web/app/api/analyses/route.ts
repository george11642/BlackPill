import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * GET /api/analyses
 * Get user's analysis history
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const orderBy = searchParams.get('order_by') || 'created_at';

    // Get analyses
    const { data: analyses, error, count } = await supabaseAdmin
      .from('analyses')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order(orderBy, { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return createResponseWithId(
      {
        analyses: analyses || [],
        total: count || 0,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Get analyses error:', error);
    return handleApiError(error, request);
  }
});

