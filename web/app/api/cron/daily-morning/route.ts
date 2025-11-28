import { Request } from 'next/server';
import { supabaseAdmin, handleApiError, getRequestId, createResponseWithId, sendNotificationToUser } from '@/lib';

/**
 * Cron job to send morning routine reminders
 * Should run daily at 08:00 local time (or configured timezone)
 *
 * Scheduled via Supabase pg_cron
 * The job is configured in migration 20251129000000_add_cron_jobs.sql
 */
export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    // Verify this is from Supabase cron (via pg_net) - required
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;
    
    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return createResponseWithId(
        {
          error: 'Unauthorized',
        },
        { status: 401 },
        requestId
      );
    }

    // Get users with active morning routines
    // Morning routines typically have tasks scheduled for morning hours (6-10 AM)
    const { data: routines, error: routinesError } = await supabaseAdmin
      .from('routines')
      .select(`
        id,
        user_id,
        name,
        routine_tasks!inner(id, name, time_of_day)
      `)
      .eq('is_active', true)
      .in('routine_tasks.time_of_day', ['morning', 'both']);

    if (routinesError) {
      throw routinesError;
    }

    // Group by user_id to avoid duplicate notifications
    const userRoutineMap = new Map<string, any[]>();
    
    for (const routine of routines || []) {
      if (!userRoutineMap.has(routine.user_id)) {
        userRoutineMap.set(routine.user_id, []);
      }
      userRoutineMap.get(routine.user_id)!.push(routine);
    }

    let notificationsSent = 0;
    let errors = 0;

    // Send morning reminders to each user
    for (const [userId, userRoutines] of userRoutineMap.entries()) {
      try {
        const routineNames = userRoutines.map(r => r.name).join(', ');
        const taskCount = userRoutines.reduce((sum, r) => sum + (r.routine_tasks?.length || 0), 0);

        await sendNotificationToUser(
          userId,
          'Good morning ☀️',
          `Time to start your routine! You have ${taskCount} task${taskCount !== 1 ? 's' : ''} scheduled for this morning.`,
          {
            type: 'routine_reminder',
            routine_ids: userRoutines.map(r => r.id),
            screen: 'DailyRoutine',
          }
        );

        notificationsSent++;
      } catch (error) {
        console.error(`Failed to send morning reminder to user ${userId}:`, error);
        errors++;
      }
    }

    return createResponseWithId(
      {
        success: true,
        users_checked: userRoutineMap.size,
        notifications_sent: notificationsSent,
        errors,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Daily morning cron error:', error);
    return handleApiError(error, request);
  }
}

