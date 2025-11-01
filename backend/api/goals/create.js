const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');
const OpenAI = require('openai');
const config = require('../../utils/config');

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

/**
 * Generate smart milestones for a goal
 */
async function generateMilestones(goalType, currentValue, targetValue, deadline) {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const daysBetween = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

  const prompt = `Generate milestones for a looksmaxxing goal:
- Goal type: ${goalType}
- Current value: ${currentValue}
- Target value: ${targetValue}
- Days until deadline: ${daysBetween}

Create 3-4 milestones spaced evenly across the timeline.
For each milestone, provide:
- Name (e.g., "Week 2", "Month 1", "Halfway")
- Target value (intermediate value between current and target)
- Target date (calculated from ${daysBetween} days)

Return as JSON array:
[
  {
    "milestone_name": "Week 2",
    "target_value": 6.5,
    "target_date": "2025-11-15"
  },
  ...
]`;

  try {
    const completion = await openai.chat.completions.create({
      model: config.openai.model || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a goal planning assistant. Generate realistic, evenly-spaced milestones.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return result.milestones || [];
  } catch (error) {
    console.error('Milestone generation error:', error);
    // Fallback to simple milestones
    return generateSimpleMilestones(currentValue, targetValue, daysBetween);
  }
}

function generateSimpleMilestones(currentValue, targetValue, daysBetween) {
  const milestones = [];
  const steps = 4;
  const valueDiff = targetValue - currentValue;

  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    const milestoneValue = currentValue + valueDiff * progress;
    const milestoneDate = new Date();
    milestoneDate.setDate(milestoneDate.getDate() + Math.floor(daysBetween * progress));

    milestones.push({
      milestone_name: i === steps ? 'Final Goal' : `Milestone ${i}`,
      target_value: parseFloat(milestoneValue.toFixed(1)),
      target_date: milestoneDate.toISOString().split('T')[0],
    });
  }

  return milestones;
}

/**
 * POST /api/goals/create
 * Create a new goal with smart milestones
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;
      const { goal_type, target_value, current_value, deadline, category } = req.body;

      if (!goal_type || !target_value || !deadline) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'goal_type, target_value, and deadline are required',
        });
      }

      // Create goal
      const { data: goal, error: goalError } = await supabaseAdmin
        .from('user_goals')
        .insert({
          user_id: userId,
          goal_type,
          target_value: parseFloat(target_value),
          current_value: current_value ? parseFloat(current_value) : null,
          deadline,
          status: 'active',
        })
        .select()
        .single();

      if (goalError) {
        throw goalError;
      }

      // Generate milestones
      const milestones = await generateMilestones(
        goal_type,
        current_value || 0,
        target_value,
        deadline
      );

      // Insert milestones
      if (milestones.length > 0) {
        const milestoneData = milestones.map((m) => ({
          goal_id: goal.id,
          milestone_name: m.milestone_name,
          target_value: m.target_value,
          target_date: m.target_date,
          completed: false,
        }));

        await supabaseAdmin
          .from('goal_milestones')
          .insert(milestoneData);
      }

      // Get goal with milestones
      const { data: goalWithMilestones } = await supabaseAdmin
        .from('user_goals')
        .select('*, goal_milestones(*)')
        .eq('id', goal.id)
        .single();

      return res.status(200).json({
        goal: goalWithMilestones,
      });
    } catch (error) {
      console.error('Create goal error:', error);
      return res.status(500).json({
        error: 'Failed to create goal',
        message: error.message,
      });
    }
  });
};

