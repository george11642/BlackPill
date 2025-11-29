
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * GET /api/routines
 * Get user's routines with tasks and streaks
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') === 'true';

    // Build query
    let query = supabaseAdmin
      .from('routines')
      .select(`
        *,
        routine_tasks (*),
        routine_streaks (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: routines, error } = await query;

    if (error) {
      console.error('Routines fetch error:', error);
      throw error;
    }

    return createResponseWithId(
      {
        routines: routines || [],
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('List routines error:', error);
    return handleApiError(error, request);
  }
});

