const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * POST /api/achievements/unlock
 * Unlock an achievement (typically called internally by other services)
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;
      const { achievement_key } = req.body;

      if (!achievement_key) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'achievement_key is required',
        });
      }

      // Check if already unlocked
      const { data: existing } = await supabaseAdmin
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_key', achievement_key)
        .single();

      if (existing) {
        return res.status(200).json({
          success: true,
          already_unlocked: true,
        });
      }

      // Unlock achievement
      const { data, error } = await supabaseAdmin
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_key,
          unlocked_at: new Date().toISOString(),
          reward_claimed: false,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        achievement: data,
        newly_unlocked: true,
      });
    } catch (error) {
      console.error('Unlock achievement error:', error);
      return res.status(500).json({
        error: 'Failed to unlock achievement',
        message: error.message,
      });
    }
  });
};

