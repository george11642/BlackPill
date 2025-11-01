const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * GET /api/routines
 * Get user's routines with tasks and streaks
 */
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;
      const { active_only } = req.query;

      // Build query
      let query = supabaseAdmin
        .from('routines')
        .select(`
          *,
          routine_tasks (*),
          routine_streaks (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (active_only === 'true') {
        query = query.eq('is_active', true);
      }

      const { data: routines, error } = await query;

      if (error) {
        console.error('Routines fetch error:', error);
        throw error;
      }

      return res.status(200).json({
        routines: routines || [],
      });
    } catch (error) {
      console.error('List routines error:', error);
      return res.status(500).json({
        error: 'Failed to fetch routines',
        message: error.message,
      });
    }
  });
};

