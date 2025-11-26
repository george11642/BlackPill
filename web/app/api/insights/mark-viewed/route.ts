import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * PUT /api/insights/mark-viewed
 * Mark insight as viewed
 */
export const PUT = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const { insightId } = body;

    if (!insightId) {
      return createResponseWithId(
        {
          error: 'Invalid request',
          message: 'insightId is required',
        },
        { status: 400 },
        requestId
      );
    }

    // Verify insight belongs to user
    const { data: insight, error: insightError } = await supabaseAdmin
      .from('user_insights')
      .select('id')
      .eq('id', insightId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (insightError || !insight) {
      return createResponseWithId(
        {
          error: 'Insight not found',
        },
        { status: 404 },
        requestId
      );
    }

    // Mark as viewed
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('user_insights')
      .update({ is_viewed: true })
      .eq('id', insightId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Mark viewed error:', updateError);
      throw updateError;
    }

    return createResponseWithId(
      {
        insight: updated,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Mark insight viewed error:', error);
    return handleApiError(error, request);
  }
});

