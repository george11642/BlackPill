const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * GET /api/goals
 * Get user's goals
 */
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      let query = supabaseAdmin
        .from('user_goals')
        .select('*, goal_milestones(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: goals, error } = await query;

      if (error) {
        throw error;
      }

      return res.status(200).json({
        goals: goals || [],
      });
    } catch (error) {
      console.error('Get goals error:', error);
      return res.status(500).json({
        error: 'Failed to fetch goals',
        message: error.message,
      });
    }
  });
};

