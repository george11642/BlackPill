const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * GET /api/auth/me
 * Get current user info
 */
module.exports = async (req, res) => {
  await verifyAuth(req, res, async () => {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, email, tier, scans_remaining, referral_code, username, avatar_url, bio, location')
        .eq('id', req.user.id)
        .single();

      if (error || !user) {
        return res.status(404).json({
          error: 'User not found',
        });
      }

      res.status(200).json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        error: 'Failed to get user',
        message: error.message,
      });
    }
  });
};

