const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * GET /api/routines/tasks
 * Get tasks for a specific routine
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
          message: 'You do not have access to this routine',
        });
      }

      // Get tasks for this routine
      const { data: tasks, error: tasksError } = await supabaseAdmin
        .from('routine_tasks')
        .select('*')
        .eq('routine_id', routine_id)
        .order('order_index', { ascending: true });

      if (tasksError) {
        console.error('Tasks fetch error:', tasksError);
        throw tasksError;
      }

      return res.status(200).json({
        tasks: tasks || [],
      });
    } catch (error) {
      console.error('Get tasks error:', error);
      return res.status(500).json({
        error: 'Failed to fetch tasks',
        message: error.message,
      });
    }
  });
};

