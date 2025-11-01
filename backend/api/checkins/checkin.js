const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * Award bonus scans
 */
async function awardBonus(userId, scans, achievementKey) {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('scans_remaining')
    .eq('id', userId)
    .single();

  if (user) {
    await supabaseAdmin
      .from('users')
      .update({ scans_remaining: (user.scans_remaining || 0) + scans })
      .eq('id', userId);
  }

  // Track achievement
  try {
    await supabaseAdmin
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_key: achievementKey,
        unlocked_at: new Date().toISOString(),
      })
      .onConflict('user_id,achievement_key')
      .ignore();
  } catch (error) {
    // Achievements table might not exist yet
    console.log('Achievements table not available:', error.message);
  }
}

/**
 * Check and award streak milestones
 */
async function checkStreakMilestones(userId, streakCount) {
  if (streakCount === 7) {
    await awardBonus(userId, 5, 'week_streak');
  } else if (streakCount === 14) {
    await awardBonus(userId, 0, 'dedicated_badge'); // Badge only
  } else if (streakCount === 30) {
    await awardBonus(userId, 10, 'month_streak');
  } else if (streakCount === 90) {
    // Grant free month Pro tier (would integrate with subscription system)
    await awardBonus(userId, 0, 'quarter_streak');
    console.log(`Granting free Pro tier month to user ${userId}`);
  } else if (streakCount === 365) {
    await awardBonus(userId, 0, 'year_streak');
    console.log(`Granting Year Warrior badge to user ${userId}`);
  }
}

/**
 * POST /api/checkins/checkin
 * Record a daily check-in
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;
      const { activities } = req.body; // ['scan', 'routine', 'checkin']

      const today = new Date().toISOString().split('T')[0];

      // Check if already checked in today
      const { data: existingCheckin } = await supabaseAdmin
        .from('daily_checkins')
        .select('*')
        .eq('user_id', userId)
        .eq('checkin_date', today)
        .single();

      let streakCount;
      if (existingCheckin) {
        // Update existing check-in
        streakCount = existingCheckin.streak_count;
        
        // Merge activities
        const existingActivities = existingCheckin.activities_completed || [];
        const newActivities = activities || [];
        const mergedActivities = [...new Set([...existingActivities, ...newActivities])];

        await supabaseAdmin
          .from('daily_checkins')
          .update({
            activities_completed: mergedActivities,
            checkin_time: new Date().toISOString(),
          })
          .eq('id', existingCheckin.id);
      } else {
        // Check yesterday's check-in to determine streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const { data: yesterdayCheckin } = await supabaseAdmin
          .from('daily_checkins')
          .select('streak_count')
          .eq('user_id', userId)
          .eq('checkin_date', yesterdayStr)
          .single();

        if (yesterdayCheckin) {
          // Continue streak
          streakCount = yesterdayCheckin.streak_count + 1;
        } else {
          // Start new streak
          streakCount = 1;
        }

        // Create new check-in
        await supabaseAdmin
          .from('daily_checkins')
          .insert({
            user_id: userId,
            checkin_date: today,
            streak_count: streakCount,
            activities_completed: activities || ['checkin'],
          });
      }

      // Check for milestone rewards
      await checkStreakMilestones(userId, streakCount);

      return res.status(200).json({
        success: true,
        streak_count: streakCount,
        checkin_date: today,
      });
    } catch (error) {
      console.error('Check-in error:', error);
      return res.status(500).json({
        error: 'Failed to record check-in',
        message: error.message,
      });
    }
  });
};

