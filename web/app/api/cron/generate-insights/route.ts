import { Request } from 'next/server';
import OpenAI from 'openai';
import {
  supabaseAdmin,
  handleApiError,
  getRequestId,
  createResponseWithId,
  config,
} from '@/lib';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

/**
 * Cron job to generate insights for active users
 * Should run weekly (e.g., Sunday at 02:00 UTC) or daily for smaller batches
 *
 * Scheduled via Supabase pg_cron
 * The job is configured in migration 20251129000000_add_cron_jobs.sql
 */
export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    // Verify this is from Supabase cron (via pg_net) - required
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;
    
    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return createResponseWithId(
        {
          error: 'Unauthorized',
        },
        { status: 401 },
        requestId
      );
    }

    // Get active users (active in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: activeUsers, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .gte('last_active_at', sevenDaysAgo.toISOString())
      .limit(50); // Process in batches to avoid timeout

    if (usersError) {
      throw usersError;
    }

    if (!activeUsers || activeUsers.length === 0) {
      return createResponseWithId(
        {
          success: true,
          users_processed: 0,
          insights_generated: 0,
          message: 'No active users found',
        },
        { status: 200 },
        requestId
      );
    }

    let insightsGenerated = 0;
    let errors = 0;

    // Generate insights for each user
    for (const user of activeUsers) {
      try {
        // Check if user already has recent insights (within last 7 days)
        const sevenDaysAgoISO = sevenDaysAgo.toISOString();
        const { data: recentInsights } = await supabaseAdmin
          .from('user_insights')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', sevenDaysAgoISO)
          .limit(1);

        if (recentInsights && recentInsights.length > 0) {
          // Skip if already has recent insights
          continue;
        }

        // Get user's analysis history
        const { data: analyses } = await supabaseAdmin
          .from('analyses')
          .select('score, breakdown, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!analyses || analyses.length < 2) {
          // Need at least 2 analyses to generate insights
          continue;
        }

        // Get routine completion data
        const { data: completions } = await supabaseAdmin
          .from('routine_completions')
          .select('completed_at, routine_id')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(100);

        // Get goals
        const { data: goals } = await supabaseAdmin
          .from('user_goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active');

        // Analyze patterns
        const scoreTrend = analyses.map((a: any) => ({
          score: parseFloat(a.score),
          date: a.created_at,
        }));

        const avgScore = scoreTrend.reduce((sum, s) => sum + s.score, 0) / scoreTrend.length;
        const recentAvg =
          scoreTrend.slice(0, 5).reduce((sum, s) => sum + s.score, 0) / Math.min(5, scoreTrend.length);
        const trend =
          recentAvg > avgScore ? 'improving' : recentAvg < avgScore ? 'declining' : 'stable';

        // Calculate routine compliance
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);
        const recentCompletions =
          completions?.filter((c: any) => new Date(c.completed_at) >= last30Days).length || 0;

        // Generate insights with AI
        const prompt = `Generate 3-5 personalized insights for a user with this data:

Score History (${analyses.length} analyses):
- Average score: ${avgScore.toFixed(1)}/10
- Recent trend: ${trend}
- Latest score: ${scoreTrend[0]?.score}/10

Routine Activity:
- Completions in last 30 days: ${recentCompletions}
- Active goals: ${goals?.length || 0}

Generate insights in these categories:
1. Correlation insights (e.g., "Your skin score improves X% when...")
2. Timing insights (e.g., "You're most consistent on...")
3. Progress predictions (e.g., "Based on your trend, you'll reach X in Y days")
4. Comparative insights (e.g., "You're progressing X% faster than average")

Return as JSON object with "insights" array:
{
  "insights": [
    {
      "insight_type": "correlation" | "timing" | "prediction" | "comparative",
      "title": "Short title",
      "description": "Full description",
      "actionable_recommendation": "What they should do",
      "confidence_score": 0.0-1.0,
      "data_points": {}
    },
    ...
  ]
}

Be specific, actionable, and encouraging.`;

        const completion = await openai.chat.completions.create({
          model: config.openai.model,
          messages: [
            {
              role: 'system',
              content:
                'You are a data analyst providing personalized insights. Be specific, actionable, and encouraging.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: 'json_object' },
        });

        const aiInsights = JSON.parse(completion.choices[0].message.content || '{}');
        const insights = Array.isArray(aiInsights.insights)
          ? aiInsights.insights
          : aiInsights.insight
          ? [aiInsights.insight]
          : [];

        // Save insights to database
        for (const insight of insights.slice(0, 5)) {
          // Set expiration (30 days)
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);

          await supabaseAdmin.from('user_insights').insert({
            user_id: user.id,
            insight_type: insight.insight_type || 'correlation',
            title: insight.title,
            description: insight.description,
            data_points: insight.data_points || {},
            actionable_recommendation: insight.actionable_recommendation || null,
            confidence_score: Math.min(
              Math.max(parseFloat(insight.confidence_score) || 0.7, 0),
              1
            ),
            expires_at: expiresAt.toISOString(),
          });

          insightsGenerated++;
        }
      } catch (error) {
        console.error(`Failed to generate insights for user ${user.id}:`, error);
        errors++;
      }
    }

    return createResponseWithId(
      {
        success: true,
        users_processed: activeUsers.length,
        insights_generated: insightsGenerated,
        errors,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Generate insights cron error:', error);
    return handleApiError(error, request);
  }
}

