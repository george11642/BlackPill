import { Request } from 'next/server';
import {
  withAuth,
  supabaseAdmin,
  handleApiError,
  getRequestId,
  createResponseWithId,
} from '@/lib';

/**
 * Achievement definitions
 */
const ACHIEVEMENTS = {
  // Analysis Milestones
  first_scan: { name: 'First Steps', emoji: '🎯', category: 'analysis' },
  score_7_plus: { name: 'Rising Star', emoji: '⭐', category: 'analysis' },
  score_8_plus: { name: 'Top Tier', emoji: '💎', category: 'analysis' },
  score_9_plus: { name: 'Elite Status', emoji: '👑', category: 'analysis' },
  perfect_10: { name: 'Legendary', emoji: '✨', category: 'analysis' },

  // Improvement
  improved_05: { name: 'Progress Made', emoji: '📈', category: 'improvement' },
  improved_10: { name: 'Major Transformation', emoji: '🦋', category: 'improvement' },
  improved_20: { name: 'Complete Makeover', emoji: '🔥', category: 'improvement' },

  // Engagement
  week_streak: { name: 'Committed', emoji: '🔥', category: 'engagement' },
  month_streak: { name: 'Dedicated', emoji: '💪', category: 'engagement' },
  quarter_streak: { name: 'Unstoppable', emoji: '⚡', category: 'engagement' },
  year_streak: { name: 'Year Warrior', emoji: '👑', category: 'engagement' },

  // Routine Mastery
  completed_routine_7: { name: 'Habit Starter', emoji: '✅', category: 'routine' },
  completed_routine_30: { name: 'Habit Master', emoji: '🎖️', category: 'routine' },
  completed_routine_90: { name: 'Lifestyle Legend', emoji: '🏆', category: 'routine' },
  perfect_week: { name: 'Perfectionist', emoji: '💯', category: 'routine' },

  // Social
  first_share: { name: 'Spreading the Word', emoji: '📱', category: 'social' },
  viral_share: { name: 'Influencer', emoji: '🌟', category: 'social' },
  referral_5: { name: 'Networker', emoji: '👥', category: 'social' },
  referral_25: { name: 'Ambassador', emoji: '🎯', category: 'social' },
  referral_100: { name: 'Legend', emoji: '👑', category: 'social' },

  // Community
  leaderboard_top10: { name: 'Top Performer', emoji: '🥇', category: 'community' },
  leaderboard_1st: { name: 'Champion', emoji: '👑', category: 'community' },
  helpful_commenter: { name: 'Community Leader', emoji: '💬', category: 'community' },
};

/**
 * GET /api/achievements
 * Get user's achievements
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    // Get user's unlocked achievements
    const { data: userAchievements, error } = await supabaseAdmin
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Map to include achievement details
    const achievements = Object.keys(ACHIEVEMENTS).map((key) => {
      const achievement = ACHIEVEMENTS[key as keyof typeof ACHIEVEMENTS];
      const userAchievement = userAchievements?.find((ua) => ua.achievement_key === key);

      return {
        key,
        name: achievement.name,
        emoji: achievement.emoji,
        category: achievement.category,
        unlocked: !!userAchievement,
        unlocked_at: userAchievement?.unlocked_at || null,
        reward_claimed: userAchievement?.reward_claimed || false,
      };
    });

    // Group by category
    const grouped = achievements.reduce(
      (acc, achievement) => {
        const category = achievement.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(achievement);
        return acc;
      },
      {} as Record<string, typeof achievements>
    );

    return createResponseWithId(
      {
        achievements,
        grouped,
        total_unlocked: userAchievements?.length || 0,
        total_available: Object.keys(ACHIEVEMENTS).length,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Achievements list error:', error);
    return handleApiError(error, request);
  }
});

