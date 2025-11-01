const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * GET /api/routines/today
 * Get today's tasks for active routines
 */
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;
      const today = new Date().toISOString().split('T')[0];
      const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Get active routines
      const { data: routines, error: routinesError } = await supabaseAdmin
        .from('routines')
        .select('id, name')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (routinesError) {
        throw routinesError;
      }

      if (!routines || routines.length === 0) {
        return res.status(200).json({
          tasks: [],
        });
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

      const todayTasks = allTasks.filter((task) => {
        // Check frequency
        if (task.frequency === 'weekly' && task.specific_days) {
          // Convert day of week: 0=Sunday -> 7, 1=Monday -> 1, etc.
          const taskDay = task.specific_days.includes(dayOfWeek === 0 ? 7 : dayOfWeek);
          if (!taskDay) return false;
        }

        // Check time of day
        if (isMorning && task.time_of_day.includes('morning')) return true;
        if (isEvening && task.time_of_day.includes('evening')) return true;
        if (!isMorning && !isEvening && task.time_of_day.length === 0) return true;
        if (task.time_of_day.includes('both') || task.time_of_day.length === 0) return true;

        return false;
      });

      // Get completion status for today
      const { data: completions, error: completionsError } = await supabaseAdmin
        .from('routine_completions')
        .select('task_id, skipped')
        .eq('user_id', userId)
        .in('task_id', todayTasks.map((t) => t.id))
        .gte('completed_at', `${today}T00:00:00Z`)
        .lt('completed_at', `${today}T23:59:59Z`);

      if (completionsError) {
        throw completionsError;
      }

      const completionMap = {};
      completions.forEach((c) => {
        completionMap[c.task_id] = !c.skipped;
      });

      // Attach completion status and routine name
      const tasksWithStatus = todayTasks.map((task) => {
        const routine = routines.find((r) => r.id === task.routine_id);
        return {
          ...task,
          routine_name: routine?.name,
          completed: completionMap[task.id] || false,
        };
      });

      return res.status(200).json({
        tasks: tasksWithStatus,
      });
    } catch (error) {
      console.error('Today tasks error:', error);
      return res.status(500).json({
        error: 'Failed to fetch today\'s tasks',
        message: error.message,
      });
    }
  });
};

