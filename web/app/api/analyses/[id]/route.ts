import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * GET /api/analyses/[id] - Get single analysis
 * DELETE /api/analyses/[id] - Delete analysis
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  return withAuth(async (req: Request, user) => {
    const requestId = getRequestId(req);

    try {
      const { id } = params;

      const { data: analysis, error } = await supabaseAdmin
        .from('analyses')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error || !analysis) {
        return createResponseWithId(
          {
            error: 'Analysis not found',
          },
          { status: 404 },
          requestId
        );
      }

      // Check if user owns this analysis OR it's public
      if (analysis.user_id !== user.id && !analysis.is_public) {
        return createResponseWithId(
          {
            error: 'Not authorized to view this analysis',
          },
          { status: 403 },
          requestId
        );
      }

      return createResponseWithId(analysis, { status: 200 }, requestId);
    } catch (error) {
      console.error('Get analysis error:', error);
      return handleApiError(error, request);
    }
  })(request);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  return withAuth(async (req: Request, user) => {
    const requestId = getRequestId(req);

    try {
      const { id } = params;

      // Soft delete
      const { error } = await supabaseAdmin
        .from('analyses')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      return createResponseWithId(
        { success: true },
        { status: 200 },
        requestId
      );
    } catch (error) {
      console.error('Delete analysis error:', error);
      return handleApiError(error, request);
    }
  })(request);
}

