const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * GET /api/analyses/history
 * Get photo history with filtering and sorting options
 */
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;
      const {
        limit = 50,
        offset = 0,
        sort_by = 'created_at', // 'created_at', 'score'
        order = 'desc', // 'asc', 'desc'
        start_date,
        end_date,
        min_score,
        max_score,
      } = req.query;

      // Build query
      let query = supabaseAdmin
        .from('analyses')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null);

      // Date filtering
      if (start_date) {
        query = query.gte('created_at', start_date);
      }
      if (end_date) {
        query = query.lte('created_at', end_date);
      }

      // Score filtering
      if (min_score) {
        query = query.gte('score', parseFloat(min_score));
      }
      if (max_score) {
        query = query.lte('score', parseFloat(max_score));
      }

      // Sorting
      const ascending = order === 'asc';
      query = query.order(sort_by, { ascending });

      // Pagination
      query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      const { data: analyses, error } = await query;

      if (error) {
        throw error;
      }

      // Get total count for pagination
      const { count } = await supabaseAdmin
        .from('analyses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('deleted_at', null);

      return res.status(200).json({
        analyses: analyses || [],
        total: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
    } catch (error) {
      console.error('History fetch error:', error);
      return res.status(500).json({
        error: 'Failed to fetch photo history',
        message: error.message,
      });
    }
  });
};

