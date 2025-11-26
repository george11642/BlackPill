import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * POST /api/goals/update-progress
 * Update goal progress and check milestones
 */
export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const { goal_id, current_value } = body;

    if (!goal_id || current_value === undefined) {
      return createResponseWithId(
        {
          error: 'Invalid request',
          message: 'goal_id and current_value are required',
        },
        { status: 400 },
        requestId
      );
    }

    // Verify goal belongs to user
    const { data: goal } = await supabaseAdmin
      .from('user_goals')
      .select('*')
      .eq('id', goal_id)
      .eq('user_id', user.id)
      .single();

    if (!goal) {
      return createResponseWithId(
        {
          error: 'Unauthorized',
        },
        { status: 403 },
        requestId
      );
    }

    // Update current value
    await supabaseAdmin
      .from('user_goals')
      .update({ current_value: parseFloat(current_value) })
      .eq('id', goal_id);

    // Check if goal is completed
    if (parseFloat(current_value) >= parseFloat(goal.target_value)) {
      await supabaseAdmin
        .from('user_goals')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', goal_id);
    }

    // Check milestones
    const { data: milestones } = await supabaseAdmin
      .from('goal_milestones')
      .select('*')
      .eq('goal_id', goal_id)
      .eq('completed', false)
      .order('target_date', { ascending: true });

    const completedMilestones = [];
    if (milestones) {
      for (const milestone of milestones) {
        if (parseFloat(current_value) >= parseFloat(milestone.target_value)) {
          await supabaseAdmin
            .from('goal_milestones')
            .update({
              completed: true,
              completed_at: new Date().toISOString(),
            })
            .eq('id', milestone.id);

          completedMilestones.push(milestone);
        }
      }
    }

    // Get updated goal
    const { data: updatedGoal } = await supabaseAdmin
      .from('user_goals')
      .select('*, goal_milestones(*)')
      .eq('id', goal_id)
      .single();

    return createResponseWithId(
      {
        goal: updatedGoal,
        completed_milestones: completedMilestones,
        goal_completed: parseFloat(current_value) >= parseFloat(goal.target_value),
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Update progress error:', error);
    return handleApiError(error, request);
  }
});

