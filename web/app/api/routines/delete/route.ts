import { Request } from 'next/server';
import {
  withAuth,
  supabaseAdmin,
  handleApiError,
  getRequestId,
  createResponseWithId,
} from '@/lib';

/**
 * DELETE /api/routines/delete
 * Delete a routine (and all associated tasks, completions, streaks)
 */
export const DELETE = withAuth(async (request: Request, user) => {
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

    // Delete routine (cascade will delete tasks, completions, streaks)
    const { error: deleteError } = await supabaseAdmin
      .from('routines')
      .delete()
      .eq('id', routine_id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Routine delete error:', deleteError);
      throw deleteError;
    }

    return createResponseWithId(
      {
        success: true,
        message: 'Routine deleted successfully',
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Delete routine error:', error);
    return handleApiError(error, request);
  }
});

