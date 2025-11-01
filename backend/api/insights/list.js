const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * GET /api/insights
 * Get user's insights
 */
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;
      const { unviewed_only, limit = 10, offset = 0 } = req.query;

      let query = supabaseAdmin
        .from('user_insights')
        .select('*')
        .eq('user_id', userId)
        .is('expires_at', null)
        .or('expires_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (unviewed_only === 'true') {
        query = query.eq('is_viewed', false);
      }

      const { data: insights, error } = await query;

      if (error) {
        console.error('Insights fetch error:', error);
        throw error;
      }

      return res.status(200).json({
        insights: insights || [],
      });
    } catch (error) {
      console.error('List insights error:', error);
      return res.status(500).json({
        error: 'Failed to fetch insights',
        message: error.message,
      });
    }
  });
};

