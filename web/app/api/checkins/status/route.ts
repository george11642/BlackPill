import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * GET /api/checkins/status
 * Get current check-in status and streak
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Get today's check-in
    const { data: todayCheckin } = await supabaseAdmin
      .from('daily_checkins')
      .select('*')
      .eq('user_id', user.id)
      .eq('checkin_date', today)
      .maybeSingle();

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
        .eq('user_id', user.id)
        .eq('checkin_date', yesterdayStr)
        .maybeSingle();

      if (yesterdayCheckin) {
        currentStreak = yesterdayCheckin.streak_count;
      }
    }

    // Get longest streak
    const { data: longestStreakData } = await supabaseAdmin
      .from('daily_checkins')
      .select('streak_count')
      .eq('user_id', user.id)
      .order('streak_count', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (longestStreakData) {
      longestStreak = longestStreakData.streak_count;
    }

    // Check if streak is at risk (not checked in today and it's after 9 PM)
    const now = new Date();
    const hour = now.getHours();
    const isAtRisk = !todayCheckin && hour >= 21 && currentStreak > 0;

    return createResponseWithId(
      {
        checked_in_today: !!todayCheckin,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        is_at_risk: isAtRisk,
        activities_completed: todayCheckin?.activities_completed || [],
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Check-in status error:', error);
    return handleApiError(error, request);
  }
});

