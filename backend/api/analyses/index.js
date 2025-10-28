const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * GET /api/analyses
 * Get user's analysis history
 */
module.exports = async (req, res) => {
  await verifyAuth(req, res, async () => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;
      const orderBy = req.query.order_by || 'created_at';

      // Get analyses
      const { data: analyses, error, count } = await supabaseAdmin
        .from('analyses')
        .select('*', { count: 'exact' })
        .eq('user_id', req.user.id)
        .is('deleted_at', null)
        .order(orderBy, { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      res.status(200).json({
        analyses: analyses || [],
        total: count || 0,
      });
    } catch (error) {
      console.error('Get analyses error:', error);
      res.status(500).json({
        error: 'Failed to get analyses',
        message: error.message,
      });
    }
  });
};

