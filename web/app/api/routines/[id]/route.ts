import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';
import { NextResponse } from 'next/server';

/**
 * GET /api/routines/[id]
 * Get a specific routine by ID with tasks and streaks
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    // Extract routine ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const routineId = pathParts[pathParts.length - 1];

    if (!routineId) {
      return createResponseWithId(
        { error: 'Routine ID is required' },
        { status: 400 },
        requestId
      );
    }

    // Fetch the routine with tasks and streaks
    const { data: routine, error } = await supabaseAdmin
      .from('routines')
      .select(`
        *,
        routine_tasks (*),
        routine_streaks (*)
      `)
      .eq('id', routineId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return createResponseWithId(
          { error: 'Routine not found' },
          { status: 404 },
          requestId
        );
      }
      console.error('Routine fetch error:', error);
      throw error;
    }

    if (!routine) {
      return createResponseWithId(
        { error: 'Routine not found' },
        { status: 404 },
        requestId
      );
    }

    // Transform routine_tasks to tasks for consistency with mobile app expectations
    const transformedRoutine = {
      ...routine,
      tasks: routine.routine_tasks || [],
      streaks: routine.routine_streaks || [],
    };

    return createResponseWithId(
      { routine: transformedRoutine },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Get routine error:', error);
    return handleApiError(error, request);
  }
});

