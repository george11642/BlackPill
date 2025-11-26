import { Request } from 'next/server';
import {
  withAuth,
  supabaseAdmin,
  handleApiError,
  getRequestId,
  createResponseWithId,
} from '@/lib';

/**
 * GET /api/routines/stats
 * Get routine completion statistics
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
        },
        { status: 403 },
        requestId
      );
    }

    // Get streak info
    const { data: streak, error: streakError } = await supabaseAdmin
      .from('routine_streaks')
      .select('*')
      .eq('routine_id', routine_id)
      .eq('user_id', user.id)
      .single();

    // Get total tasks
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('routine_tasks')
      .select('id')
      .eq('routine_id', routine_id);

    // Get completions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: completions, error: completionsError } = await supabaseAdmin
      .from('routine_completions')
      .select('completed_at, skipped')
      .eq('routine_id', routine_id)
      .eq('user_id', user.id)
      .gte('completed_at', thirtyDaysAgo.toISOString());

    if (streakError || tasksError || completionsError) {
      throw new Error('Failed to fetch stats');
    }

    // Calculate statistics
    const totalTasks = tasks?.length || 0;
    const totalCompletions = completions?.filter((c: any) => !c.skipped).length || 0;
    const skippedCount = completions?.filter((c: any) => c.skipped).length || 0;

    // Group by date
    const completionByDate: Record<string, { completed: number; skipped: number }> = {};
    completions?.forEach((c: any) => {
      const date = new Date(c.completed_at).toISOString().split('T')[0];
      if (!completionByDate[date]) {
        completionByDate[date] = { completed: 0, skipped: 0 };
      }
      if (c.skipped) {
        completionByDate[date].skipped++;
      } else {
        completionByDate[date].completed++;
      }
    });

    const completionRate =
      totalTasks > 0 ? parseFloat(((totalCompletions / (totalTasks * 30)) * 100).toFixed(1)) : 0;

    return createResponseWithId(
      {
        streak: streak || {
          current_streak: 0,
          longest_streak: 0,
        },
        stats: {
          total_tasks: totalTasks,
          total_completions: totalCompletions,
          skipped_count: skippedCount,
          completion_rate: completionRate,
          completion_by_date: completionByDate,
        },
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Stats error:', error);
    return handleApiError(error, request);
  }
});

