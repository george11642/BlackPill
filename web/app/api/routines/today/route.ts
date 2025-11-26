import { Request } from 'next/server';
import {
  withAuth,
  supabaseAdmin,
  handleApiError,
  getRequestId,
  createResponseWithId,
} from '@/lib';

/**
 * GET /api/routines/today
 * Get today's tasks for active routines
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Get active routines
    const { data: routines, error: routinesError } = await supabaseAdmin
      .from('routines')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (routinesError) {
      throw routinesError;
    }

    if (!routines || routines.length === 0) {
      return createResponseWithId(
        {
          tasks: [],
        },
        { status: 200 },
        requestId
      );
    }

    const routineIds = routines.map((r) => r.id);

    // Get all tasks for these routines
    const { data: allTasks, error: tasksError } = await supabaseAdmin
      .from('routine_tasks')
      .select('*')
      .in('routine_id', routineIds)
      .order('order_index', { ascending: true });

    if (tasksError) {
      throw tasksError;
    }

    // Filter tasks by time of day and frequency
    const now = new Date();
    const hour = now.getHours();
    const isMorning = hour >= 6 && hour < 12;
    const isEvening = hour >= 18 || hour < 22;

    const todayTasks = (allTasks || []).filter((task: any) => {
      // Check frequency
      if (task.frequency === 'weekly' && task.specific_days) {
        // Convert day of week: 0=Sunday -> 7, 1=Monday -> 1, etc.
        const taskDay = task.specific_days.includes(dayOfWeek === 0 ? 7 : dayOfWeek);
        if (!taskDay) return false;
      }

      // Check time of day
      const timeOfDay = Array.isArray(task.time_of_day) ? task.time_of_day : [task.time_of_day];
      if (isMorning && timeOfDay.includes('morning')) return true;
      if (isEvening && timeOfDay.includes('evening')) return true;
      if (!isMorning && !isEvening && timeOfDay.length === 0) return true;
      if (timeOfDay.includes('both') || timeOfDay.length === 0) return true;

      return false;
    });

    // Get completion status for today
    const { data: completions, error: completionsError } = await supabaseAdmin
      .from('routine_completions')
      .select('task_id, skipped')
      .eq('user_id', user.id)
      .in(
        'task_id',
        todayTasks.map((t: any) => t.id)
      )
      .gte('completed_at', `${today}T00:00:00Z`)
      .lt('completed_at', `${today}T23:59:59Z`);

    if (completionsError) {
      throw completionsError;
    }

    const completionMap: Record<string, boolean> = {};
    (completions || []).forEach((c: any) => {
      completionMap[c.task_id] = !c.skipped;
    });

    // Attach completion status and routine name
    const tasksWithStatus = todayTasks.map((task: any) => {
      const routine = routines.find((r) => r.id === task.routine_id);
      return {
        ...task,
        routine_name: routine?.name,
        completed: completionMap[task.id] || false,
      };
    });

    return createResponseWithId(
      {
        tasks: tasksWithStatus,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error("Today tasks error:", error);
    return handleApiError(error, request);
  }
});

