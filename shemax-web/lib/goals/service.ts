import { supabaseServer as supabaseAdmin } from '@/lib/supabase/server';
import { checkGoalAchievements } from '@/lib/achievements/service';

/**
 * Update goal progress based on analysis score
 * Returns information about completed milestones and goals
 */
export async function updateGoalsFromAnalysis(
  userId: string,
  score: number,
  breakdown?: Record<string, number>
): Promise<{
  updatedGoals: Array<{ id: string; goal_completed: boolean }>;
  completedMilestones: Array<{ goal_id: string; milestone_id: string; milestone_name: string }>;
}> {
  const updatedGoals: Array<{ id: string; goal_completed: boolean }> = [];
  const completedMilestones: Array<{ goal_id: string; milestone_id: string; milestone_name: string }> = [];

  try {
    // Fetch user's active goals that are relevant to analysis scores
    const { data: activeGoals, error: goalsError } = await supabaseAdmin
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .in('goal_type', ['score_improvement', 'category_improvement']);

    if (goalsError || !activeGoals || activeGoals.length === 0) {
      return { updatedGoals, completedMilestones };
    }

    // Update each relevant goal
    for (const goal of activeGoals) {
      let currentValue = score;

      // For category_improvement goals, we'd need to check the breakdown
      // For now, we'll use overall score for all goals
      // TODO: In the future, match category_improvement goals to specific breakdown categories

      // Update goal's current value
      await supabaseAdmin
        .from('user_goals')
        .update({ current_value: currentValue })
        .eq('id', goal.id);

      // Check if goal is completed
      const goalCompleted = currentValue >= parseFloat(goal.target_value);
      
      if (goalCompleted) {
        await supabaseAdmin
          .from('user_goals')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', goal.id);

        // Check for goal achievements (fire and forget)
        checkGoalAchievements(userId).catch((error) => {
          console.error('Error checking goal achievements:', error);
        });
      }

      // Check milestones
      const { data: milestones } = await supabaseAdmin
        .from('goal_milestones')
        .select('*')
        .eq('goal_id', goal.id)
        .eq('completed', false)
        .order('target_date', { ascending: true });

      if (milestones) {
        for (const milestone of milestones) {
          if (currentValue >= parseFloat(milestone.target_value)) {
            await supabaseAdmin
              .from('goal_milestones')
              .update({
                completed: true,
                completed_at: new Date().toISOString(),
              })
              .eq('id', milestone.id);

            completedMilestones.push({
              goal_id: goal.id,
              milestone_id: milestone.id,
              milestone_name: milestone.milestone_name || 'Milestone',
            });
          }
        }
      }

      updatedGoals.push({
        id: goal.id,
        goal_completed: goalCompleted,
      });
    }
  } catch (error) {
    console.error('Error updating goals from analysis:', error);
    // Don't throw - goal updates are non-critical
  }

  return { updatedGoals, completedMilestones };
}

