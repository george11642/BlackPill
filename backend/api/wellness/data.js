const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * GET /api/wellness/data
 * Get user's wellness data
 */
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;
      const { start_date, end_date, limit = 30 } = req.query;

      let query = supabaseAdmin
        .from('user_wellness_data')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(parseInt(limit));

      if (start_date) {
        query = query.gte('date', start_date);
      }

      if (end_date) {
        query = query.lte('date', end_date);
      }

      const { data: wellnessData, error } = await query;

      if (error) {
        console.error('Wellness data fetch error:', error);
        throw error;
      }

      return res.status(200).json({
        wellnessData: wellnessData || [],
      });
    } catch (error) {
      console.error('Get wellness data error:', error);
      return res.status(500).json({
        error: 'Failed to fetch wellness data',
        message: error.message,
      });
    }
  });
};

