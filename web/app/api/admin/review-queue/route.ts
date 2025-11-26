import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * GET /api/admin/review-queue
 * Get flagged content for manual review
 *
 * Note: In production, add proper admin role verification
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    // TODO: Add admin role check
    // For now, any authenticated user can access (NOT FOR PRODUCTION)

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: queue, error } = await supabaseAdmin
      .from('review_queue')
      .select(
        `
        *,
        analyses(id, score, image_url),
        users(id, email, username)
      `
      )
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return createResponseWithId(
      {
        queue: queue || [],
        total: queue?.length || 0,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Review queue error:', error);
    return handleApiError(error, request);
  }
});

