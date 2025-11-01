const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * GET /api/checkins/status
 * Get current check-in status and streak
 */
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Get today's check-in
      const { data: todayCheckin } = await supabaseAdmin
        .from('daily_checkins')
        .select('*')
        .eq('user_id', userId)
        .eq('checkin_date', today)
        .single();

      // Get current streak (from today or yesterday)
      let currentStreak = 0;
      let longestStreak = 0;

      if (todayCheckin) {
        currentStreak = todayCheckin.streak_count;
      } else {
        // Check yesterday's streak
        const { data: yesterdayCheckin } = await supabaseAdmin
          .from('daily_checkins')
          .select('streak_count')
          .eq('user_id', userId)
          .eq('checkin_date', yesterdayStr)
          .single();

        if (yesterdayCheckin) {
          currentStreak = yesterdayCheckin.streak_count;
        }
      }

      // Get longest streak
      const { data: longestStreakData } = await supabaseAdmin
        .from('daily_checkins')
        .select('streak_count')
        .eq('user_id', userId)
        .order('streak_count', { ascending: false })
        .limit(1)
        .single();

      if (longestStreakData) {
        longestStreak = longestStreakData.streak_count;
      }

      // Check if streak is at risk (not checked in today and it's after 9 PM)
      const now = new Date();
      const hour = now.getHours();
      const isAtRisk = !todayCheckin && hour >= 21 && currentStreak > 0;

      return res.status(200).json({
        checked_in_today: !!todayCheckin,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        is_at_risk: isAtRisk,
        activities_completed: todayCheckin?.activities_completed || [],
      });
    } catch (error) {
      console.error('Check-in status error:', error);
      return res.status(500).json({
        error: 'Failed to get check-in status',
        message: error.message,
      });
    }
  });
};

