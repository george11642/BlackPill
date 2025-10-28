const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * GET /api/referral/stats
 * Get referral statistics for the current user
 */
module.exports = async (req, res) => {
  await verifyAuth(req, res, async () => {
    try {
      // Get user's referral code
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('referral_code')
        .eq('id', req.user.id)
        .single();

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get referral statistics
      const { data: referrals, error } = await supabaseAdmin
        .from('referrals')
        .select('*')
        .eq('from_user_id', req.user.id);

      if (error) {
        throw error;
      }

      const totalInvited = referrals.length;
      const accepted = referrals.filter(r => r.status === 'accepted').length;
      const pending = referrals.filter(r => r.status === 'pending').length;
      const totalBonusScans = referrals
        .filter(r => r.status === 'accepted')
        .reduce((sum, r) => sum + r.bonus_scans_given, 0);

      // Calculate invite streak (simplified - consecutive days with at least 1 invite)
      const inviteStreak = 0; // TODO: Implement streak calculation

      res.status(200).json({
        referral_code: user.referral_code,
        total_invited: totalInvited,
        accepted,
        pending,
        total_bonus_scans: totalBonusScans,
        invite_streak: inviteStreak,
      });

    } catch (error) {
      console.error('Referral stats error:', error);
      res.status(500).json({
        error: 'Failed to get referral stats',
        message: error.message,
      });
    }
  });
};

