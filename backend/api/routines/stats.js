const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * GET /api/routines/stats
 * Get routine completion statistics
 */
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;
      const { routine_id } = req.query;

      if (!routine_id) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'routine_id is required',
        });
      }

      // Verify routine belongs to user
      const { data: routine, error: routineError } = await supabaseAdmin
        .from('routines')
        .select('id')
        .eq('id', routine_id)
        .eq('user_id', userId)
        .single();

      if (routineError || !routine) {
        return res.status(403).json({
          error: 'Unauthorized',
        });
      }

      // Get streak info
      const { data: streak, error: streakError } = await supabaseAdmin
        .from('routine_streaks')
        .select('*')
        .eq('routine_id', routine_id)
        .eq('user_id', userId)
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
        .eq('user_id', userId)
        .gte('completed_at', thirtyDaysAgo.toISOString());

      if (streakError || tasksError || completionsError) {
        throw new Error('Failed to fetch stats');
      }

      // Calculate statistics
      const totalTasks = tasks?.length || 0;
      const totalCompletions = completions?.filter((c) => !c.skipped).length || 0;
      const skippedCount = completions?.filter((c) => c.skipped).length || 0;

      // Group by date
      const completionByDate = {};
      completions?.forEach((c) => {
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

      const completionRate = totalTasks > 0
        ? ((totalCompletions / (totalTasks * 30)) * 100).toFixed(1)
        : 0;

      return res.status(200).json({
        streak: streak || {
          current_streak: 0,
          longest_streak: 0,
        },
        stats: {
          total_tasks: totalTasks,
          total_completions: totalCompletions,
          skipped_count: skippedCount,
          completion_rate: parseFloat(completionRate),
          completion_by_date: completionByDate,
        },
      });
    } catch (error) {
      console.error('Stats error:', error);
      return res.status(500).json({
        error: 'Failed to fetch stats',
        message: error.message,
      });
    }
  });
};

