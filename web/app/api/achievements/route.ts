import { Request } from 'next/server';
import {
  withAuth,
  supabaseAdmin,
  handleApiError,
  getRequestId,
  createResponseWithId,
} from '@/lib';
import { ACHIEVEMENT_DEFINITIONS } from '@/lib/achievements/service';

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
    const achievements = Object.keys(ACHIEVEMENT_DEFINITIONS).map((key) => {
      const achievement = ACHIEVEMENT_DEFINITIONS[key as keyof typeof ACHIEVEMENT_DEFINITIONS];
      const userAchievement = userAchievements?.find((ua) => ua.achievement_key === key);

      return {
        id: key, // Use key as id for frontend compatibility
        key,
        name: achievement.name,
        description: achievement.description,
        iconUrl: null, // Can be enhanced later with custom icons
        emoji: achievement.emoji,
        category: achievement.category,
        unlocked: !!userAchievement,
        unlockedAt: userAchievement?.unlocked_at || null,
        unlocked_at: userAchievement?.unlocked_at || null, // Keep for backward compatibility
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
        total_available: Object.keys(ACHIEVEMENT_DEFINITIONS).length,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Achievements list error:', error);
    return handleApiError(error, request);
  }
});

