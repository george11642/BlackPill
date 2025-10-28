const { createRateLimiter } = require('../../middleware/rate-limit');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * GET /api/leaderboard/referrals
 * Get referral leaderboard
 */
module.exports = async (req, res) => {
  await createRateLimiter('leaderboard')(req, res, async () => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;

      // Get referral counts
      const { data, error } = await supabaseAdmin.rpc('get_referral_leaderboard', {
        limit_count: limit,
        offset_count: offset,
      });

      if (error) {
        // If function doesn't exist, do it manually
        const { data: referrals } = await supabaseAdmin
          .from('referrals')
          .select('from_user_id, users!referrals_from_user_id_fkey(username)')
          .eq('status', 'accepted');

        // Count by user
        const counts = {};
        referrals?.forEach(r => {
          const userId = r.from_user_id;
          counts[userId] = (counts[userId] || 0) + 1;
        });

        // Sort and format
        const leaderboard = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(offset, offset + limit)
          .map(([userId, count], index) => ({
            rank: offset + index + 1,
            user_id: userId,
            total_invited: count,
            accepted: count,
          }));

        return res.status(200).json({ leaderboard });
      }

      res.status(200).json({ leaderboard: data || [] });

    } catch (error) {
      console.error('Get referral leaderboard error:', error);
      res.status(500).json({
        error: 'Failed to get leaderboard',
        message: error.message,
      });
    }
  });
};

