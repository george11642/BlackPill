const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');
const OpenAI = require('openai');
const config = require('../../utils/config');

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

/**
 * Generate 3-tier action plans for weak areas (F18)
 */
async function generateActionPlans(breakdown, analysisScore) {
  const weakAreas = Object.entries(breakdown)
    .filter(([key, value]) => parseFloat(value) < 7.0)
    .map(([category, score]) => ({ category, score: parseFloat(score) }));

  if (weakAreas.length === 0) {
    return [];
  }

  const actionPlans = [];

  for (const area of weakAreas) {
    const severity = area.score < 5 ? 'severe' : area.score < 6.5 ? 'moderate' : 'mild';

    // Generate with AI
    const prompt = `Create a 3-tier action plan for improving ${area.category} (current score: ${area.score}/10, severity: ${severity}).

Provide three approaches:
1. DIY: Free or low-cost (<$30) home remedies and routines. Time: 8-12 weeks. List 4-5 specific actions.
2. OTC: Over-the-counter products ($50-150). Time: 4-8 weeks. List 3-4 specific products with prices.
3. Professional: Medical/professional treatments ($200-1500). Time: 2-6 months. List 2-3 treatments with details.

For each tier, include:
- estimatedCost: Cost range (e.g., "$0-30", "$50-150")
- timeToResults: Timeframe (e.g., "8-12 weeks")
- effectiveness: "low" | "medium" | "high" | "very high"
- scienceBacking: Brief scientific explanation
- whenToConsider: When this approach makes sense

For DIY tier, include:
- routine: Array of 4-5 specific actions

For OTC tier, include:
- products: Array of {name, price, purpose}

For Professional tier, include:
- treatments: Array of {name, description, cost_range}
- warning: Important safety/disclaimer note

Return as JSON object with diy, otc, and professional keys.`;

    try {
      const completion = await openai.chat.completions.create({
        model: config.openai.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a knowledgeable beauty and wellness advisor. Provide evidence-based, safe recommendations. Always include safety warnings for professional treatments.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const plan = JSON.parse(completion.choices[0].message.content);

      actionPlans.push({
        category: area.category,
        currentScore: area.score,
        targetScore: Math.min(area.score + 1.5, 9.5),
        severity,
        diy: plan.diy || {},
        otc: plan.otc || {},
        professional: plan.professional || {},
      });
    } catch (error) {
      console.error(`Error generating action plan for ${area.category}:`, error);
      // Continue with other areas even if one fails
    }
  }

  return actionPlans;
}

/**
 * POST /api/routines/generate
 * Generate a personalized routine based on analysis results
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const { analysisId, focusAreas, timeCommitment, preferences } = req.body;
      const userId = req.user.id;

      if (!analysisId || !focusAreas || !Array.isArray(focusAreas) || focusAreas.length === 0) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'analysisId and focusAreas are required',
        });
      }

      // Get analysis data
      const { data: analysis, error: analysisError } = await supabaseAdmin
        .from('analyses')
        .select('score, breakdown')
        .eq('id', analysisId)
        .eq('user_id', userId)
        .single();

      if (analysisError || !analysis) {
        return res.status(404).json({
          error: 'Analysis not found',
          message: 'The specified analysis does not exist or you do not have access to it',
        });
      }

      // Identify weak areas
      const breakdown = analysis.breakdown;
      const weakAreas = Object.entries(breakdown)
        .filter(([key, value]) => value < 7.0)
        .map(([key, value]) => ({ category: key, score: parseFloat(value) }));

      // Generate 3-tier action plans for weak areas (F18)
      const actionPlans = await generateActionPlans(breakdown, analysis.score);

      // Generate routine with AI
      const prompt = `Create a personalized looksmaxxing routine for someone with:
- Overall score: ${analysis.score}/10
- Weak areas: ${weakAreas.map((a) => `${a.category} (${a.score}/10)`).join(', ')}
- Focus goals: ${focusAreas.join(', ')}
- Daily time commitment: ${timeCommitment || 'medium'} minutes
- Preferences: ${JSON.stringify(preferences || {})}

Generate a daily routine with 8-12 specific, actionable tasks organized by time of day (morning/evening).
For each task, include:
- Title (concise, e.g., "Apply Sunscreen")
- Description (specific instructions)
- Category (skincare/grooming/fitness/nutrition/mewing)
- Time of day (morning/evening or both)
- Duration in minutes
- Why it helps (scientific benefit)
- Product suggestion (optional, real product name)

Format as JSON with this structure:
{
  "tasks": [
    {
      "title": "Apply Sunscreen",
      "description": "Use broad-spectrum SPF 50+ every morning",
      "category": "skincare",
      "time_of_day": ["morning"],
      "duration_minutes": 2,
      "why_it_helps": "Protects from UV damage, prevents premature aging",
      "product_name": "CeraVe Hydrating Sunscreen",
      "product_link": null
    },
    ...
  ]
}

Be constructive and avoid toxic terminology. Focus on actionable, evidence-based improvements.`;

      const completion = await openai.chat.completions.create({
        model: config.openai.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a supportive looksmaxxing coach. Generate practical, evidence-based routines. Be specific and actionable. Never use toxic terminology.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const generatedRoutine = JSON.parse(completion.choices[0].message.content);

      if (!generatedRoutine.tasks || !Array.isArray(generatedRoutine.tasks)) {
        throw new Error('Invalid routine format from AI');
      }

      // Create routine in database
      const { data: routine, error: routineError } = await supabaseAdmin
        .from('routines')
        .insert({
          user_id: userId,
          name: `${focusAreas.join(' & ')} Improvement Plan`,
          goal: `Improve ${focusAreas.join(', ')}`,
          focus_categories: focusAreas,
          created_from_analysis_id: analysisId,
          is_active: true,
        })
        .select()
        .single();

      if (routineError) {
        console.error('Routine creation error:', routineError);
        throw routineError;
      }

      // Insert tasks
      const tasks = generatedRoutine.tasks.map((task, index) => ({
        routine_id: routine.id,
        title: task.title,
        description: task.description || null,
        category: task.category,
        time_of_day: Array.isArray(task.time_of_day) ? task.time_of_day : [task.time_of_day || 'morning'],
        frequency: task.frequency || 'daily',
        order_index: index,
        duration_minutes: task.duration_minutes || null,
        why_it_helps: task.why_it_helps || null,
        product_name: task.product_name || null,
        product_link: task.product_link || null,
      }));

      const { data: insertedTasks, error: tasksError } = await supabaseAdmin
        .from('routine_tasks')
        .insert(tasks)
        .select();

      if (tasksError) {
        console.error('Tasks insertion error:', tasksError);
        throw tasksError;
      }

      // Initialize streak
      await supabaseAdmin
        .from('routine_streaks')
        .insert({
          routine_id: routine.id,
          user_id: userId,
          current_streak: 0,
          longest_streak: 0,
        });

      return res.status(200).json({
        routine: {
          ...routine,
          tasks: insertedTasks,
        },
        actionPlans: actionPlans, // F18: 3-Tier Action Plans
      });
    } catch (error) {
      console.error('Routine generation error:', error);
      return res.status(500).json({
        error: 'Failed to generate routine',
        message: error.message,
      });
    }
  });
};

