const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * POST /api/goals/update-progress
 * Update goal progress and check milestones
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;
      const { goal_id, current_value } = req.body;

      if (!goal_id || current_value === undefined) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'goal_id and current_value are required',
        });
      }

      // Verify goal belongs to user
      const { data: goal } = await supabaseAdmin
        .from('user_goals')
        .select('*')
        .eq('id', goal_id)
        .eq('user_id', userId)
        .single();

      if (!goal) {
        return res.status(403).json({
          error: 'Unauthorized',
        });
      }

      // Update current value
      await supabaseAdmin
        .from('user_goals')
        .update({ current_value: parseFloat(current_value) })
        .eq('id', goal_id);

      // Check if goal is completed
      if (parseFloat(current_value) >= parseFloat(goal.target_value)) {
        await supabaseAdmin
          .from('user_goals')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', goal_id);
      }

      // Check milestones
      const { data: milestones } = await supabaseAdmin
        .from('goal_milestones')
        .select('*')
        .eq('goal_id', goal_id)
        .eq('completed', false)
        .order('target_date', { ascending: true });

      const completedMilestones = [];
      if (milestones) {
        for (const milestone of milestones) {
          if (parseFloat(current_value) >= parseFloat(milestone.target_value)) {
            await supabaseAdmin
              .from('goal_milestones')
              .update({
                completed: true,
                completed_at: new Date().toISOString(),
              })
              .eq('id', milestone.id);

            completedMilestones.push(milestone);
          }
        }
      }

      // Get updated goal
      const { data: updatedGoal } = await supabaseAdmin
        .from('user_goals')
        .select('*, goal_milestones(*)')
        .eq('id', goal_id)
        .single();

      return res.status(200).json({
        goal: updatedGoal,
        completed_milestones: completedMilestones,
        goal_completed: parseFloat(current_value) >= parseFloat(goal.target_value),
      });
    } catch (error) {
      console.error('Update progress error:', error);
      return res.status(500).json({
        error: 'Failed to update progress',
        message: error.message,
      });
    }
  });
};

