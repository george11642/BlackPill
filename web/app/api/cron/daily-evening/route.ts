
import { supabaseAdmin, handleApiError, getRequestId, createResponseWithId, sendNotificationToUser } from '@/lib';

/**
 * Cron job to send evening reminders & check streaks
 * Should run daily at 20:00 local time (or configured timezone)
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString().split('T')[0];

    // Get users with active routines who have incomplete tasks for today
    const { data: routines, error: routinesError } = await supabaseAdmin
      .from('routines')
      .select(`
        id,
        user_id,
        name,
        routine_tasks!inner(
          id,
          name,
          time_of_day,
          routine_task_completions!left(
            id,
            completed_at
          )
        ),
        routine_streaks!inner(
          id,
          current_streak,
          last_completed_date
        )
      `)
      .eq('is_active', true);

    if (routinesError) {
      throw routinesError;
    }

    // Group by user and check for incomplete tasks
    const userReminderMap = new Map<string, { incompleteTasks: number; streak: number; routineNames: string[] }>();
    
    for (const routine of routines || []) {
      const userId = routine.user_id;
      const tasks = routine.routine_tasks || [];
      
      // Count incomplete tasks (tasks without completions for today)
      const incompleteTasks = tasks.filter((task: any) => {
        const completions = task.routine_task_completions || [];
        const hasTodayCompletion = completions.some((c: any) => {
          if (!c.completed_at) return false;
          const completionDate = new Date(c.completed_at).toISOString().split('T')[0];
          return completionDate === todayISO;
        });
        return !hasTodayCompletion;
      }).length;

      // Get streak info
      const streaks = routine.routine_streaks || [];
      const maxStreak = streaks.length > 0 
        ? Math.max(...streaks.map((s: any) => s.current_streak || 0))
        : 0;

      if (incompleteTasks > 0) {
        if (!userReminderMap.has(userId)) {
          userReminderMap.set(userId, {
            incompleteTasks: 0,
            streak: maxStreak,
            routineNames: [],
          });
        }
        
        const userData = userReminderMap.get(userId)!;
        userData.incompleteTasks += incompleteTasks;
        userData.streak = Math.max(userData.streak, maxStreak);
        if (!userData.routineNames.includes(routine.name)) {
          userData.routineNames.push(routine.name);
        }
      }
    }

    let notificationsSent = 0;
    let errors = 0;

    // Send evening reminders to users with incomplete tasks
    for (const [userId, data] of userReminderMap.entries()) {
      try {
        const streakMessage = data.streak > 0 
          ? `Don't lose your ${data.streak}-day streak! 🔥`
          : 'Complete your tasks to start building a streak! 💪';

        await sendNotificationToUser(
          userId,
          'Evening Reminder',
          `You have ${data.incompleteTasks} incomplete task${data.incompleteTasks !== 1 ? 's' : ''} today. ${streakMessage}`,
          {
            type: 'streak_reminder',
            incomplete_tasks: data.incompleteTasks,
            current_streak: data.streak,
            screen: 'DailyRoutine',
          }
        );

        notificationsSent++;
      } catch (error) {
        console.error(`Failed to send evening reminder to user ${userId}:`, error);
        errors++;
      }
    }

    return createResponseWithId(
      {
        success: true,
        users_checked: routines?.length || 0,
        users_with_incomplete_tasks: userReminderMap.size,
        notifications_sent: notificationsSent,
        errors,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Daily evening cron error:', error);
    return handleApiError(error, request);
  }
}

