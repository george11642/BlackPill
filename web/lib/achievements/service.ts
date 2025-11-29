import { supabaseServer as supabaseAdmin } from '@/lib/supabase/server';

// Log warning if supabase client may not be properly configured
if (process.env.NODE_ENV === 'development') {
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log(`[Achievements] Service role key configured: ${hasServiceKey}`);
}

/**
 * Achievement definitions with descriptions
 */
export const ACHIEVEMENT_DEFINITIONS = {
  // Analysis Milestones
  first_scan: { 
    name: 'First Steps', 
    emoji: '🎯', 
    category: 'analysis',
    description: 'Complete your first facial analysis scan'
  },
  score_7_plus: { 
    name: 'Rising Star', 
    emoji: '⭐', 
    category: 'analysis',
    description: 'Achieve a score of 7.0 or higher'
  },
  score_8_plus: { 
    name: 'Top Tier', 
    emoji: '💎', 
    category: 'analysis',
    description: 'Achieve a score of 8.0 or higher'
  },
  score_9_plus: { 
    name: 'Elite Status', 
    emoji: '👑', 
    category: 'analysis',
    description: 'Achieve a score of 9.0 or higher'
  },
  perfect_10: { 
    name: 'Legendary', 
    emoji: '✨', 
    category: 'analysis',
    description: 'Achieve a perfect score of 10.0'
  },

  // Improvement
  improved_05: { 
    name: 'Progress Made', 
    emoji: '📈', 
    category: 'improvement',
    description: 'Improve your score by 0.5 points or more'
  },
  improved_10: { 
    name: 'Major Transformation', 
    emoji: '🦋', 
    category: 'improvement',
    description: 'Improve your score by 1.0 point or more'
  },
  improved_20: { 
    name: 'Complete Makeover', 
    emoji: '🔥', 
    category: 'improvement',
    description: 'Improve your score by 2.0 points or more'
  },

  // Engagement
  week_streak: { 
    name: 'Committed', 
    emoji: '🔥', 
    category: 'engagement',
    description: 'Maintain a 7-day streak'
  },
  month_streak: { 
    name: 'Dedicated', 
    emoji: '💪', 
    category: 'engagement',
    description: 'Maintain a 30-day streak'
  },
  quarter_streak: { 
    name: 'Unstoppable', 
    emoji: '⚡', 
    category: 'engagement',
    description: 'Maintain a 90-day streak'
  },
  year_streak: { 
    name: 'Year Warrior', 
    emoji: '👑', 
    category: 'engagement',
    description: 'Maintain a 365-day streak'
  },

  // Routine Mastery
  completed_routine_7: { 
    name: 'Habit Starter', 
    emoji: '✅', 
    category: 'routine',
    description: 'Complete 7 routine tasks'
  },
  completed_routine_30: { 
    name: 'Habit Master', 
    emoji: '🎖️', 
    category: 'routine',
    description: 'Complete 30 routine tasks'
  },
  completed_routine_90: { 
    name: 'Lifestyle Legend', 
    emoji: '🏆', 
    category: 'routine',
    description: 'Complete 90 routine tasks'
  },
  perfect_week: { 
    name: 'Perfectionist', 
    emoji: '💯', 
    category: 'routine',
    description: 'Complete all routine tasks for a week'
  },

  // Social
  first_share: { 
    name: 'Spreading the Word', 
    emoji: '📱', 
    category: 'social',
    description: 'Share your first analysis result'
  },
  viral_share: { 
    name: 'Influencer', 
    emoji: '🌟', 
    category: 'social',
    description: 'Get 100+ views on a shared analysis'
  },
  referral_5: { 
    name: 'Networker', 
    emoji: '👥', 
    category: 'social',
    description: 'Refer 5 friends to the app'
  },
  referral_25: { 
    name: 'Ambassador', 
    emoji: '🎯', 
    category: 'social',
    description: 'Refer 25 friends to the app'
  },
  referral_100: { 
    name: 'Legend', 
    emoji: '👑', 
    category: 'social',
    description: 'Refer 100 friends to the app'
  },

  // Community
  leaderboard_top10: { 
    name: 'Top Performer', 
    emoji: '🥇', 
    category: 'community',
    description: 'Rank in the top 10 on the leaderboard'
  },
  leaderboard_1st: { 
    name: 'Champion', 
    emoji: '👑', 
    category: 'community',
    description: 'Achieve #1 rank on the leaderboard'
  },
  helpful_commenter: { 
    name: 'Community Leader', 
    emoji: '💬', 
    category: 'community',
    description: 'Make 10 helpful comments'
  },

  // Goals
  goal_completed: {
    name: 'Goal Achiever',
    emoji: '🎯',
    category: 'goals',
    description: 'Complete your first goal'
  },
} as const;

export type AchievementKey = keyof typeof ACHIEVEMENT_DEFINITIONS;

/**
 * Unlock an achievement for a user
 */
export async function unlockAchievement(
  userId: string,
  achievementKey: AchievementKey
): Promise<{ unlocked: boolean; alreadyUnlocked: boolean }> {
  console.log(`[Achievements] Attempting to unlock ${achievementKey} for user ${userId}`);
  
  try {
    // Check if already unlocked
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_key', achievementKey)
      .maybeSingle();

    if (checkError) {
      console.error(`[Achievements] Error checking existing achievement ${achievementKey}:`, checkError);
      return { unlocked: false, alreadyUnlocked: false };
    }

    if (existing) {
      console.log(`[Achievements] Achievement ${achievementKey} already unlocked for user ${userId}`);
      return { unlocked: false, alreadyUnlocked: true };
    }

    // Unlock achievement
    console.log(`[Achievements] Inserting new achievement ${achievementKey} for user ${userId}`);
    const { error } = await supabaseAdmin
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_key: achievementKey,
        unlocked_at: new Date().toISOString(),
        reward_claimed: false,
      });

    if (error) {
      console.error(`[Achievements] Failed to insert achievement ${achievementKey} for user ${userId}:`, error);
      return { unlocked: false, alreadyUnlocked: false };
    }

    console.log(`[Achievements] ✅ Successfully unlocked: ${achievementKey} for user ${userId}`);
    return { unlocked: true, alreadyUnlocked: false };
  } catch (error) {
    console.error(`[Achievements] Exception unlocking ${achievementKey}:`, error);
    return { unlocked: false, alreadyUnlocked: false };
  }
}

/**
 * Check and unlock analysis-related achievements
 */
export interface UnlockedAchievement {
  key: string;
  name: string;
  emoji: string;
  description: string;
}

export async function checkAnalysisAchievements(
  userId: string,
  score: number,
  isFirstScan: boolean
): Promise<UnlockedAchievement[]> {
  console.log(`[Achievements] Checking analysis achievements for user ${userId}, score: ${score}, isFirstScan: ${isFirstScan}`);
  
  const unlocked: UnlockedAchievement[] = [];
  
  // First scan achievement
  if (isFirstScan) {
    console.log(`[Achievements] User ${userId} completed first scan, unlocking first_scan achievement`);
    const result = await unlockAchievement(userId, 'first_scan');
    if (result.unlocked) {
      const def = ACHIEVEMENT_DEFINITIONS.first_scan;
      unlocked.push({ key: 'first_scan', name: def.name, emoji: def.emoji, description: def.description });
    }
  }

  // Score-based achievements
  if (score >= 7.0) {
    const result = await unlockAchievement(userId, 'score_7_plus');
    if (result.unlocked) {
      const def = ACHIEVEMENT_DEFINITIONS.score_7_plus;
      unlocked.push({ key: 'score_7_plus', name: def.name, emoji: def.emoji, description: def.description });
    }
  }
  if (score >= 8.0) {
    const result = await unlockAchievement(userId, 'score_8_plus');
    if (result.unlocked) {
      const def = ACHIEVEMENT_DEFINITIONS.score_8_plus;
      unlocked.push({ key: 'score_8_plus', name: def.name, emoji: def.emoji, description: def.description });
    }
  }
  if (score >= 9.0) {
    const result = await unlockAchievement(userId, 'score_9_plus');
    if (result.unlocked) {
      const def = ACHIEVEMENT_DEFINITIONS.score_9_plus;
      unlocked.push({ key: 'score_9_plus', name: def.name, emoji: def.emoji, description: def.description });
    }
  }
  if (score >= 10.0) {
    const result = await unlockAchievement(userId, 'perfect_10');
    if (result.unlocked) {
      const def = ACHIEVEMENT_DEFINITIONS.perfect_10;
      unlocked.push({ key: 'perfect_10', name: def.name, emoji: def.emoji, description: def.description });
    }
  }
  
  console.log(`[Achievements] Finished checking analysis achievements for user ${userId}, unlocked: ${unlocked.length}`);
  return unlocked;
}

/**
 * Check and unlock improvement achievements
 */
export async function checkImprovementAchievements(
  userId: string,
  newScore: number
): Promise<void> {
  try {
    // Get user's first analysis score
    const { data: firstAnalysis } = await supabaseAdmin
      .from('analyses')
      .select('score')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!firstAnalysis) {
      return; // No previous score to compare
    }

    const firstScore = firstAnalysis.score;
    const improvement = newScore - firstScore;

    // Check improvement milestones
    if (improvement >= 0.5) {
      await unlockAchievement(userId, 'improved_05');
    }
    if (improvement >= 1.0) {
      await unlockAchievement(userId, 'improved_10');
    }
    if (improvement >= 2.0) {
      await unlockAchievement(userId, 'improved_20');
    }
  } catch (error) {
    console.error('Error checking improvement achievements:', error);
  }
}

/**
 * Check and unlock leaderboard achievements
 */
export async function checkLeaderboardAchievements(
  userId: string,
  rank: number
): Promise<void> {
  if (rank <= 10 && rank > 0) {
    await unlockAchievement(userId, 'leaderboard_top10');
  }
  if (rank === 1) {
    await unlockAchievement(userId, 'leaderboard_1st');
  }
}

/**
 * Check and unlock referral achievements
 */
export async function checkReferralAchievements(
  userId: string,
  referralCount: number
): Promise<void> {
  if (referralCount >= 5) {
    await unlockAchievement(userId, 'referral_5');
  }
  if (referralCount >= 25) {
    await unlockAchievement(userId, 'referral_25');
  }
  if (referralCount >= 100) {
    await unlockAchievement(userId, 'referral_100');
  }
}

/**
 * Check and unlock goal-related achievements
 */
export async function checkGoalAchievements(userId: string): Promise<void> {
  try {
    // Check if user has completed any goals
    const { data: completedGoals } = await supabaseAdmin
      .from('user_goals')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .limit(1);

    if (completedGoals && completedGoals.length > 0) {
      await unlockAchievement(userId, 'goal_completed');
    }
  } catch (error) {
    console.error('Error checking goal achievements:', error);
  }
}

