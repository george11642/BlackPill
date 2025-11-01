const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');
const OpenAI = require('openai');
const config = require('../../utils/config');

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

/**
 * POST /api/insights/generate
 * Generate personalized insights based on user data patterns
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;

      // Get user's analysis history
      const { data: analyses } = await supabaseAdmin
        .from('analyses')
        .select('score, breakdown, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      // Get routine completion data
      const { data: completions } = await supabaseAdmin
        .from('routine_completions')
        .select('completed_at, routine_id')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(100);

      // Get goals
      const { data: goals } = await supabaseAdmin
        .from('user_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (!analyses || analyses.length < 2) {
        return res.status(200).json({
          insights: [],
          message: 'Need at least 2 analyses to generate insights',
        });
      }

      // Analyze patterns
      const scoreTrend = analyses.map((a) => ({
        score: parseFloat(a.score),
        date: a.created_at,
      }));

      const avgScore = scoreTrend.reduce((sum, s) => sum + s.score, 0) / scoreTrend.length;
      const recentAvg = scoreTrend.slice(0, 5).reduce((sum, s) => sum + s.score, 0) / Math.min(5, scoreTrend.length);
      const trend = recentAvg > avgScore ? 'improving' : recentAvg < avgScore ? 'declining' : 'stable';

      // Calculate routine compliance
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      const recentCompletions = completions?.filter(
        (c) => new Date(c.completed_at) >= last30Days
      ).length || 0;

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

Return as JSON array with:
- insight_type: 'correlation' | 'timing' | 'prediction' | 'comparative'
- title: Short title
- description: Full description
- actionable_recommendation: What they should do
- confidence_score: 0.0-1.0
- data_points: Supporting data (JSON object)

Be specific, actionable, and encouraging.`;

      const completion = await openai.chat.completions.create({
        model: config.openai.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a data analyst providing personalized insights. Be specific, actionable, and encouraging.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const aiInsights = JSON.parse(completion.choices[0].message.content);
      const insights = Array.isArray(aiInsights.insights)
        ? aiInsights.insights
        : aiInsights.insight
        ? [aiInsights.insight]
        : [];

      // Save insights to database
      const savedInsights = [];
      for (const insight of insights.slice(0, 5)) {
        // Set expiration (30 days)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const { data: saved, error } = await supabaseAdmin
          .from('user_insights')
          .insert({
            user_id: userId,
            insight_type: insight.insight_type || 'correlation',
            title: insight.title,
            description: insight.description,
            data_points: insight.data_points || {},
            actionable_recommendation: insight.actionable_recommendation || null,
            confidence_score: Math.min(Math.max(parseFloat(insight.confidence_score) || 0.7, 0), 1),
            expires_at: expiresAt.toISOString(),
          })
          .select()
          .single();

        if (!error && saved) {
          savedInsights.push(saved);
        }
      }

      return res.status(200).json({
        insights: savedInsights,
      });
    } catch (error) {
      console.error('Generate insights error:', error);
      return res.status(500).json({
        error: 'Failed to generate insights',
        message: error.message,
      });
    }
  });
};

