import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * GET /api/goals
 * Get user's goals
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('user_goals')
      .select('*, goal_milestones(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: goals, error } = await query;

    if (error) {
      throw error;
    }

    return createResponseWithId(
      {
        goals: goals || [],
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Get goals error:', error);
    return handleApiError(error, request);
  }
});

