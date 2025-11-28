import { Request } from 'next/server';
import {
  withAuth,
  supabaseAdmin,
  handleApiError,
  getRequestId,
  createResponseWithId,
} from '@/lib';

/**
 * Award bonus scans or free tier
 */
async function awardBonus(userId: string, scans: number, achievementKey: string): Promise<void> {
  // Add scans
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('scans_remaining')
    .eq('id', userId)
    .single();

  if (user) {
    await supabaseAdmin
      .from('users')
      .update({ scans_remaining: (user.scans_remaining || 0) + scans })
      .eq('id', userId);
  }

  // Track achievement (if achievements table exists)
  try {
    await supabaseAdmin
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_key: achievementKey,
        unlocked_at: new Date().toISOString(),
      })
      .onConflict('user_id,achievement_key')
      .ignore();
  } catch (error) {
    // Achievements table might not exist yet, skip
    console.log('Achievements table not available:', error);
  }
}

/**
 * Grant free tier
 */
async function grantFreeTier(userId: string, tier: string, days: number): Promise<void> {
  // This would integrate with subscription system
  // For now, just log it
  console.log(`Granting ${tier} tier to user ${userId} for ${days} days`);
}

/**
 * Helper function to get ISO week string (week starts on Monday)
 */
function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
}

/**
 * Update streak based on task completion
 */
async function updateStreak(routineId: string, userId: string): Promise<number | null> {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentWeek = getISOWeek(today);
  const currentMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;

  // Get tasks for this routine
  const { data: todaysTasks } = await supabaseAdmin
    .from('routine_tasks')
    .select('id')
    .eq('routine_id', routineId);

  if (!todaysTasks || todaysTasks.length === 0) {
    return null;
  }

  // Count completed tasks today
  const { data: completedToday } = await supabaseAdmin
    .from('routine_completions')
    .select('task_id')
    .eq('routine_id', routineId)
    .eq('user_id', userId)
    .eq('skipped', false)
    .gte('completed_at', `${todayStr}T00:00:00Z`)
    .lt('completed_at', `${todayStr}T23:59:59Z`);

  const completionRate = (completedToday?.length || 0) / todaysTasks.length;

  // Consider day complete if 70%+ tasks done
  if (completionRate >= 0.7) {
    const { data: currentStreak } = await supabaseAdmin
      .from('routine_streaks')
      .select('current_streak, longest_streak, last_completed_date, weekly_streak, monthly_streak, longest_weekly_streak, longest_monthly_streak, last_weekly_completion, last_monthly_completion')
      .eq('routine_id', routineId)
      .eq('user_id', userId)
      .single();

    if (!currentStreak) {
      // Initialize streak
      await supabaseAdmin.from('routine_streaks').insert({
        routine_id: routineId,
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        weekly_streak: 1,
        monthly_streak: 1,
        longest_weekly_streak: 1,
        longest_monthly_streak: 1,
        last_completed_date: todayStr,
        last_weekly_completion: currentWeek,
        last_monthly_completion: currentMonth,
      });
      return 1;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Calculate daily streak
    let newStreak: number;
    if (currentStreak.last_completed_date === yesterdayStr) {
      // Continuing streak
      newStreak = (currentStreak.current_streak || 0) + 1;
    } else if (currentStreak.last_completed_date === todayStr) {
      // Already completed today
      newStreak = currentStreak.current_streak || 0;
    } else {
      // Streak broken, start fresh
      newStreak = 1;
    }

    const newLongest = Math.max(newStreak, currentStreak.longest_streak || 0);

    // Calculate weekly streak
    let newWeeklyStreak = currentStreak.weekly_streak || 0;
    let newLongestWeekly = currentStreak.longest_weekly_streak || 0;
    
    if (currentStreak.last_weekly_completion !== currentWeek) {
      // Check if last week was completed (within 7 days)
      if (currentStreak.last_weekly_completion) {
        const lastWeekDate = new Date();
        // Try to find if we completed last week
        const lastWeek = getISOWeek(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));
        if (currentStreak.last_weekly_completion === lastWeek) {
          // Continuing weekly streak
          newWeeklyStreak = (currentStreak.weekly_streak || 0) + 1;
        } else {
          // Weekly streak broken, start fresh
          newWeeklyStreak = 1;
        }
      } else {
        // First week
        newWeeklyStreak = 1;
      }
      newLongestWeekly = Math.max(newWeeklyStreak, newLongestWeekly);
    }

    // Calculate monthly streak
    let newMonthlyStreak = currentStreak.monthly_streak || 0;
    let newLongestMonthly = currentStreak.longest_monthly_streak || 0;
    
    if (currentStreak.last_monthly_completion !== currentMonth) {
      // Check if last month was completed
      if (currentStreak.last_monthly_completion) {
        const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonth = `${lastMonthDate.getFullYear()}-${(lastMonthDate.getMonth() + 1).toString().padStart(2, '0')}`;
        if (currentStreak.last_monthly_completion === lastMonth) {
          // Continuing monthly streak
          newMonthlyStreak = (currentStreak.monthly_streak || 0) + 1;
        } else {
          // Monthly streak broken, start fresh
          newMonthlyStreak = 1;
        }
      } else {
        // First month
        newMonthlyStreak = 1;
      }
      newLongestMonthly = Math.max(newMonthlyStreak, newLongestMonthly);
    }

    await supabaseAdmin
      .from('routine_streaks')
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        weekly_streak: newWeeklyStreak,
        monthly_streak: newMonthlyStreak,
        longest_weekly_streak: newLongestWeekly,
        longest_monthly_streak: newLongestMonthly,
        last_completed_date: todayStr,
        last_weekly_completion: currentWeek,
        last_monthly_completion: currentMonth,
        updated_at: new Date().toISOString(),
      })
      .eq('routine_id', routineId)
      .eq('user_id', userId);

    // Award milestone bonuses
    if (newStreak === 7) {
      await awardBonus(userId, 5, '7_day_routine_streak');
    } else if (newStreak === 30) {
      await awardBonus(userId, 10, '30_day_routine_streak');
    } else if (newStreak === 90) {
      await grantFreeTier(userId, 'pro', 30);
    }

    return newStreak;
  }

  return null;
}

/**
 * POST /api/routines/complete-task
 * Mark a task as complete
 */
export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const { taskId, routineId, skipped, notes } = body;

    if (!taskId || !routineId) {
      return createResponseWithId(
        {
          error: 'Invalid request',
          message: 'taskId and routineId are required',
        },
        { status: 400 },
        requestId
      );
    }

    // Verify task belongs to routine and user
    const { data: task, error: taskError } = await supabaseAdmin
      .from('routine_tasks')
      .select('id, routine_id')
      .eq('id', taskId)
      .eq('routine_id', routineId)
      .single();

    if (taskError || !task) {
      return createResponseWithId(
        {
          error: 'Task not found',
        },
        { status: 404 },
        requestId
      );
    }

    // Verify routine belongs to user
    const { data: routine, error: routineError } = await supabaseAdmin
      .from('routines')
      .select('id')
      .eq('id', routineId)
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

    // Record completion
    const { data: completion, error: completionError } = await supabaseAdmin
      .from('routine_completions')
      .insert({
        task_id: taskId,
        routine_id: routineId,
        user_id: user.id,
        skipped: skipped || false,
        notes: notes || null,
      })
      .select()
      .single();

    if (completionError) {
      console.error('Completion error:', completionError);
      throw completionError;
    }

    // Update streak (only if not skipped)
    let newStreak: number | null = null;
    if (!skipped) {
      newStreak = await updateStreak(routineId, user.id);
    }

    return createResponseWithId(
      {
        completion,
        newStreak,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Task completion error:', error);
    return handleApiError(error, request);
  }
});

