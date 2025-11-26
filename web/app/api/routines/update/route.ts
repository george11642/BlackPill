import { Request } from 'next/server';
import {
  withAuth,
  supabaseAdmin,
  handleApiError,
  getRequestId,
  createResponseWithId,
} from '@/lib';

/**
 * PUT /api/routines/update
 * Update routine details
 */
export const PUT = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const { routine_id, name, goal, focus_categories, is_active } = body;

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

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name;
    if (goal !== undefined) updates.goal = goal;
    if (focus_categories !== undefined) updates.focus_categories = focus_categories;
    if (is_active !== undefined) updates.is_active = is_active;

    // Update routine
    const { data: updatedRoutine, error: updateError } = await supabaseAdmin
      .from('routines')
      .update(updates)
      .eq('id', routine_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Routine update error:', updateError);
      throw updateError;
    }

    return createResponseWithId(
      {
        routine: updatedRoutine,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Update routine error:', error);
    return handleApiError(error, request);
  }
});

