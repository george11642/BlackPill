const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * Award bonus scans or free tier
 */
async function awardBonus(userId, scans, achievementKey) {
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
    console.log('Achievements table not available:', error.message);
  }
}

/**
 * Grant free tier
 */
async function grantFreeTier(userId, tier, days) {
  // This would integrate with subscription system
  // For now, just log it
  console.log(`Granting ${tier} tier to user ${userId} for ${days} days`);
}

/**
 * Update streak based on task completion
 */
async function updateStreak(routineId, userId) {
  const today = new Date().toISOString().split('T')[0];

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
    .gte('completed_at', `${today}T00:00:00Z`)
    .lt('completed_at', `${today}T23:59:59Z`);

  const completionRate = completedToday.length / todaysTasks.length;

  // Consider day complete if 70%+ tasks done
  if (completionRate >= 0.7) {
    const { data: currentStreak } = await supabaseAdmin
      .from('routine_streaks')
      .select('current_streak, longest_streak, last_completed_date')
      .eq('routine_id', routineId)
      .eq('user_id', userId)
      .single();

    if (!currentStreak) {
      // Initialize streak
      await supabaseAdmin
        .from('routine_streaks')
        .insert({
          routine_id: routineId,
          user_id: userId,
          current_streak: 1,
          longest_streak: 1,
          last_completed_date: today,
        });
      return 1;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak;
    if (currentStreak.last_completed_date === yesterdayStr) {
      // Continuing streak
      newStreak = (currentStreak.current_streak || 0) + 1;
    } else if (currentStreak.last_completed_date === today) {
      // Already completed today
      newStreak = currentStreak.current_streak || 0;
    } else {
      // Streak broken, start fresh
      newStreak = 1;
    }

    const newLongest = Math.max(newStreak, currentStreak.longest_streak || 0);

    await supabaseAdmin
      .from('routine_streaks')
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_completed_date: today,
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
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const { taskId, routineId, skipped, notes } = req.body;
      const userId = req.user.id;

      if (!taskId || !routineId) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'taskId and routineId are required',
        });
      }

      // Verify task belongs to routine and user
      const { data: task, error: taskError } = await supabaseAdmin
        .from('routine_tasks')
        .select('id, routine_id')
        .eq('id', taskId)
        .eq('routine_id', routineId)
        .single();

      if (taskError || !task) {
        return res.status(404).json({
          error: 'Task not found',
        });
      }

      // Verify routine belongs to user
      const { data: routine, error: routineError } = await supabaseAdmin
        .from('routines')
        .select('id')
        .eq('id', routineId)
        .eq('user_id', userId)
        .single();

      if (routineError || !routine) {
        return res.status(403).json({
          error: 'Unauthorized',
          message: 'You do not have access to this routine',
        });
      }

      // Record completion
      const { data: completion, error: completionError } = await supabaseAdmin
        .from('routine_completions')
        .insert({
          task_id: taskId,
          routine_id: routineId,
          user_id: userId,
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
      let newStreak = null;
      if (!skipped) {
        newStreak = await updateStreak(routineId, userId);
      }

      return res.status(200).json({
        completion,
        newStreak,
      });
    } catch (error) {
      console.error('Task completion error:', error);
      return res.status(500).json({
        error: 'Failed to complete task',
        message: error.message,
      });
    }
  });
};

