const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * GET /api/challenges/my-challenges
 * Get user's active challenges
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
        .from('challenge_participations')
        .select(
          `
          *,
          challenges (*),
          challenge_checkins (*)
        `
        )
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: participations, error } = await query;

      if (error) {
        console.error('My challenges fetch error:', error);
        throw error;
      }

      return res.status(200).json({
        participations: participations || [],
      });
    } catch (error) {
      console.error('Get my challenges error:', error);
      return res.status(500).json({
        error: 'Failed to fetch challenges',
        message: error.message,
      });
    }
  });
};

