
import OpenAI from 'openai';
import {
  withAuth,
  supabaseAdmin,
  config,
  handleApiError,
  getRequestId,
  createResponseWithId,
} from '@/lib';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

/**
 * Generate 3-tier action plans for weak areas (F18)
 */
async function generateActionPlans(
  breakdown: Record<string, number>,
  analysisScore: number
): Promise<Array<{
  category: string;
  currentScore: number;
  targetScore: number;
  severity: string;
  diy: unknown;
  otc: unknown;
  professional: unknown;
}>> {
  const weakAreas = Object.entries(breakdown)
    .filter(([, value]) => parseFloat(String(value)) < 7.0)
    .map(([category, score]) => ({ category, score: parseFloat(String(score)) }));

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
        model: config.openai.model,
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

      const plan = JSON.parse(completion.choices[0].message.content || '{}');

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
export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const { analysisId, focusAreas, timeCommitment, preferences, scheduleType, daysOfWeek, customGoal, tierPreference } = body;

    if (!analysisId || !focusAreas || !Array.isArray(focusAreas) || focusAreas.length === 0) {
      return createResponseWithId(
        {
          error: 'Invalid request',
          message: 'analysisId and focusAreas are required',
        },
        { status: 400 },
        requestId
      );
    }

    // Get analysis data
    const { data: analysis, error: analysisError } = await supabaseAdmin
      .from('analyses')
      .select('score, breakdown')
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .single();

    if (analysisError || !analysis) {
      return createResponseWithId(
        {
          error: 'Analysis not found',
          message: 'The specified analysis does not exist or you do not have access to it',
        },
        { status: 404 },
        requestId
      );
    }

    // Identify weak areas
    const breakdown = analysis.breakdown as Record<string, number>;
    const weakAreas = Object.entries(breakdown)
      .filter(([, value]) => value < 7.0)
      .map(([key, value]) => ({ category: key, score: parseFloat(String(value)) }));

    // Generate 3-tier action plans for weak areas (F18)
    const actionPlans = await generateActionPlans(breakdown, analysis.score);

    // Generate routine with AI
    const customGoalSection = customGoal 
      ? `\n- SPECIFIC USER GOAL: "${customGoal}" (IMPORTANT: Tailor tasks specifically to help achieve this goal)`
      : '';
    
    const prompt = `Create a personalized looksmaxxing routine for someone with:
- Overall score: ${analysis.score}/10
- Weak areas: ${weakAreas.map((a) => `${a.category} (${a.score}/10)`).join(', ')}
- Focus goals: ${focusAreas.join(', ')}
- Daily time commitment: ${timeCommitment || 'medium'} minutes
- Preferences: ${JSON.stringify(preferences || {})}${customGoalSection}

Generate a comprehensive routine with:
- 8-10 DAILY tasks (things to do every day)
- 2-4 WEEKLY tasks (things to do once a week, like deep treatments, exfoliation, etc.)
${scheduleType === 'monthly' ? '- 1-3 MONTHLY tasks (things to do once per month, like deep cleaning, major treatments, etc.)' : ''}

Organize tasks by time of day (morning/evening).
For each task, include:
- Title (concise, e.g., "Apply Sunscreen")
- Description (specific instructions)
- Category (skincare/grooming/fitness/nutrition/mewing)
- Frequency ("daily", "weekly", or "monthly")
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
      "frequency": "daily",
      "time_of_day": ["morning"],
      "duration_minutes": 2,
      "why_it_helps": "Protects from UV damage, prevents premature aging",
      "product_name": "CeraVe Hydrating Sunscreen",
      "product_link": null
    },
    {
      "title": "Deep Exfoliation",
      "description": "Use a chemical exfoliant (AHA/BHA) to remove dead skin cells",
      "category": "skincare",
      "frequency": "weekly",
      "time_of_day": ["evening"],
      "duration_minutes": 5,
      "why_it_helps": "Promotes cell turnover, improves skin texture",
      "product_name": "Paula's Choice BHA Exfoliant",
      "product_link": null
    }
  ]
}

Be constructive and avoid toxic terminology. Focus on actionable, evidence-based improvements.`;

    const completion = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content:
            'You are a supportive looksmaxxing coach. Generate practical, evidence-based routines. Be specific and actionable. Never use toxic terminology.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const generatedRoutine = JSON.parse(completion.choices[0].message.content || '{}');

    if (!generatedRoutine.tasks || !Array.isArray(generatedRoutine.tasks)) {
      throw new Error('Invalid routine format from AI');
    }

    // Deactivate existing routines before creating new one
    const { error: deactivateError } = await supabaseAdmin
      .from('routines')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (deactivateError) {
      console.error('Error deactivating old routines:', deactivateError);
      // Continue anyway - not critical
    }

    // Create routine in database
    const { data: routine, error: routineError } = await supabaseAdmin
      .from('routines')
      .insert({
        user_id: user.id,
        name: customGoal 
          ? `Custom: ${customGoal.slice(0, 50)}${customGoal.length > 50 ? '...' : ''}`
          : `${focusAreas.join(' & ')} Improvement Plan`,
        goal: customGoal || `Improve ${focusAreas.join(', ')}`,
        focus_categories: focusAreas,
        created_from_analysis_id: analysisId,
        is_active: true,
        routine_set_type: scheduleType || 'daily',
        days_of_week: daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
        time_commitment: timeCommitment || 'medium',
        tier_preference: tierPreference || 'all',
      })
      .select()
      .single();

    if (routineError) {
      console.error('Routine creation error:', routineError);
      throw routineError;
    }

    // Insert tasks with tier metadata from action plans
    const tasks = generatedRoutine.tasks.map((task: any, index: number) => {
      // Determine tier based on product/treatment type
      let tier = 'DIY'; // default
      if (task.product_name) {
        tier = 'OTC';
      }
      if (task.is_professional) {
        tier = 'Professional';
      }

      // Get corresponding action plan for this category to extract metadata
      const relatedPlan = actionPlans.find(p => 
        p.category.toLowerCase() === task.category?.toLowerCase()
      );
      
      let tierData: any = {};
      if (relatedPlan) {
        if (tier === 'DIY' && relatedPlan.diy) {
          tierData = relatedPlan.diy;
        } else if (tier === 'OTC' && relatedPlan.otc) {
          tierData = relatedPlan.otc;
        } else if (tier === 'Professional' && relatedPlan.professional) {
          tierData = relatedPlan.professional;
        }
      }

      return {
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
        tier: tier,
        estimated_cost: tierData.estimatedCost || tierData.estimated_cost || null,
        time_to_results: tierData.timeToResults || tierData.time_to_results || null,
        effectiveness: tierData.effectiveness || null,
        science_backing: tierData.scienceBacking || tierData.science_backing || task.why_it_helps || null,
        professional_warning: tierData.warning || tierData.professional_warning || null,
      };
    });

    const { data: insertedTasks, error: tasksError } = await supabaseAdmin
      .from('routine_tasks')
      .insert(tasks)
      .select();

    if (tasksError) {
      console.error('Tasks insertion error:', tasksError);
      throw tasksError;
    }

    // Create additional tasks from action plans for OTC and Professional tiers
    const additionalTasks: any[] = [];
    let orderIndex = tasks.length;

    for (const plan of actionPlans) {
      // OTC tasks from products
      if ((plan.otc as any)?.products && Array.isArray((plan.otc as any).products)) {
        for (const product of (plan.otc as any).products.slice(0, 2)) { // Limit to 2 per category
          additionalTasks.push({
            routine_id: routine.id,
            title: product.name || `${plan.category} Product`,
            description: product.purpose || `Recommended for ${plan.category} improvement`,
            category: plan.category,
            time_of_day: ['morning', 'evening'],
            frequency: 'daily',
            order_index: orderIndex++,
            tier: 'OTC',
            estimated_cost: (plan.otc as any).estimatedCost || '$50-150',
            time_to_results: (plan.otc as any).timeToResults || '4-8 weeks',
            effectiveness: (plan.otc as any).effectiveness || 'high',
            science_backing: (plan.otc as any).scienceBacking,
            product_name: product.name,
          });
        }
      }

      // Professional tasks from treatments
      if ((plan.professional as any)?.treatments && Array.isArray((plan.professional as any).treatments)) {
        for (const treatment of (plan.professional as any).treatments.slice(0, 1)) { // Limit to 1 per category
          additionalTasks.push({
            routine_id: routine.id,
            title: treatment.name || `${plan.category} Treatment`,
            description: treatment.description || `Professional treatment for ${plan.category}`,
            category: plan.category,
            time_of_day: ['morning'],
            frequency: 'monthly',
            order_index: orderIndex++,
            tier: 'Professional',
            estimated_cost: treatment.cost_range || (plan.professional as any).estimatedCost || '$200-1500',
            time_to_results: (plan.professional as any).timeToResults || '2-6 months',
            effectiveness: (plan.professional as any).effectiveness || 'very high',
            science_backing: (plan.professional as any).scienceBacking,
            professional_warning: (plan.professional as any).warning || 'Consult a licensed professional before proceeding.',
          });
        }
      }
    }

    // Insert additional OTC/Professional tasks
    if (additionalTasks.length > 0) {
      const { error: additionalTasksError } = await supabaseAdmin
        .from('routine_tasks')
        .insert(additionalTasks);

      if (additionalTasksError) {
        console.error('Additional tasks insertion error:', additionalTasksError);
        // Non-critical, continue
      }
    }

    // Initialize streak
    await supabaseAdmin.from('routine_streaks').insert({
      routine_id: routine.id,
      user_id: user.id,
      current_streak: 0,
      longest_streak: 0,
    });

    // Fetch all tasks including the newly added ones
    const { data: allTasks } = await supabaseAdmin
      .from('routine_tasks')
      .select('*')
      .eq('routine_id', routine.id)
      .order('order_index');

    return createResponseWithId(
      {
        routine: {
          ...routine,
          tasks: allTasks || insertedTasks,
        },
        actionPlans: actionPlans, // F18: 3-Tier Action Plans
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Routine generation error:', error);
    return handleApiError(error, request);
  }
});

