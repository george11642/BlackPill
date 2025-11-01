const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * GET /api/challenges
 * List available challenges
 */
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const { difficulty, focus_area } = req.query;

      let query = supabaseAdmin
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .order('duration_days', { ascending: true });

      if (difficulty) {
        query = query.eq('difficulty', difficulty);
      }

      if (focus_area) {
        query = query.contains('focus_areas', [focus_area]);
      }

      const { data: challenges, error } = await query;

      if (error) {
        console.error('Challenges fetch error:', error);
        throw error;
      }

      return res.status(200).json({
        challenges: challenges || [],
      });
    } catch (error) {
      console.error('List challenges error:', error);
      return res.status(500).json({
        error: 'Failed to fetch challenges',
        message: error.message,
      });
    }
  });
};

