
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * Award bonus scans
 */
async function awardBonus(userId: string, scans: number, achievementKey: string) {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('scans_remaining')
    .eq('id', userId)
    .maybeSingle();

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
      .upsert({
        user_id: userId,
        achievement_key: achievementKey,
        unlocked_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,achievement_key',
        ignoreDuplicates: true
      });
  } catch (error) {
    // Achievements table might not exist yet
    console.log('Achievements table not available:', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Check and award streak milestones
 */
async function checkStreakMilestones(userId: string, streakCount: number) {
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
export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const { activities } = body; // ['scan', 'routine', 'checkin']

    const today = new Date().toISOString().split('T')[0];

    // Check if already checked in today
    const { data: existingCheckin } = await supabaseAdmin
      .from('daily_checkins')
      .select('*')
      .eq('user_id', user.id)
      .eq('checkin_date', today)
      .maybeSingle();

    let streakCount: number;
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
        .eq('user_id', user.id)
        .eq('checkin_date', yesterdayStr)
        .maybeSingle();

      if (yesterdayCheckin) {
        // Continue streak
        streakCount = yesterdayCheckin.streak_count + 1;
      } else {
        // Start new streak
        streakCount = 1;
      }

      // Create new check-in
      await supabaseAdmin.from('daily_checkins').insert({
        user_id: user.id,
        checkin_date: today,
        streak_count: streakCount,
        activities_completed: activities || ['checkin'],
      });
    }

    // Check for milestone rewards
    await checkStreakMilestones(user.id, streakCount);

    return createResponseWithId(
      {
        success: true,
        streak_count: streakCount,
        checkin_date: today,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Check-in error:', error);
    return handleApiError(error, request);
  }
});

