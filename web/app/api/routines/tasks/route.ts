import { Request } from 'next/server';
import {
  withAuth,
  supabaseAdmin,
  handleApiError,
  getRequestId,
  createResponseWithId,
} from '@/lib';

/**
 * GET /api/routines/tasks
 * Get tasks for a specific routine
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const { searchParams } = new URL(request.url);
    const routine_id = searchParams.get('routine_id');

    if (!routine_id) {
      return createResponseWithId(
        {
          error: 'Invalid request',
          message: 'routine_id is required',
        },
        { status: 400 },
        requestId
      );
    }

    // Verify routine belongs to user
    const { data: routine, error: routineError } = await supabaseAdmin
      .from('routines')
      .select('id')
      .eq('id', routine_id)
      .eq('user_id', user.id)
      .single();

    if (routineError || !routine) {
      return createResponseWithId(
        {
          error: 'Unauthorized',
          message: 'You do not have access to this routine',
        },
        { status: 403 },
        requestId
      );
    }

    // Get tasks for this routine
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('routine_tasks')
      .select('*')
      .eq('routine_id', routine_id)
      .order('order_index', { ascending: true });

    if (tasksError) {
      console.error('Tasks fetch error:', tasksError);
      throw tasksError;
    }

    return createResponseWithId(
      {
        tasks: tasks || [],
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Get tasks error:', error);
    return handleApiError(error, request);
  }
});

