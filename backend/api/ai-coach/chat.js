const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');
const OpenAI = require('openai');
const config = require('../../utils/config');

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

/**
 * Get rate limits by tier
 */
function getRateLimit(tier) {
  const limits = {
    free: 5,
    basic: 30,
    pro: 100,
    unlimited: Infinity,
  };
  return limits[tier] || limits.free;
}

/**
 * Check if user has exceeded rate limit
 */
async function checkRateLimit(userId, tier) {
  const limit = getRateLimit(tier);
  if (limit === Infinity) {
    return { allowed: true, remaining: Infinity };
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const { data: usage } = await supabaseAdmin
    .from('ai_usage_tracking')
    .select('messages_sent')
    .eq('user_id', userId)
    .eq('month', monthStart)
    .single();

  const messagesSent = usage?.messages_sent || 0;
  const remaining = Math.max(0, limit - messagesSent);

  return {
    allowed: remaining > 0,
    remaining,
    limit,
  };
}

/**
 * Update usage tracking
 */
async function updateUsage(userId, tokensUsed = 0) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];

  // Get current usage
  const { data: currentUsage } = await supabaseAdmin
    .from('ai_usage_tracking')
    .select('messages_sent, tokens_used')
    .eq('user_id', userId)
    .eq('month', monthStart)
    .single();

  const messagesSent = (currentUsage?.messages_sent || 0) + 1;
  const totalTokens = (currentUsage?.tokens_used || 0) + tokensUsed;

  await supabaseAdmin
    .from('ai_usage_tracking')
    .upsert({
      user_id: userId,
      month: monthStart,
      messages_sent: messagesSent,
      tokens_used: totalTokens,
    }, {
      onConflict: 'user_id,month',
    });
}

/**
 * Get user context for AI prompt
 */
async function getUserContext(userId) {
  // Get latest analysis
  const { data: latestAnalysis } = await supabaseAdmin
    .from('analyses')
    .select('score, breakdown')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Get active routine
  const { data: activeRoutine } = await supabaseAdmin
    .from('routines')
    .select('name, id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .single();

  // Get routine compliance (last 30 days)
  let complianceRate = null;
  if (activeRoutine) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: completions } = await supabaseAdmin
      .from('routine_completions')
      .select('completed_at')
      .eq('routine_id', activeRoutine.id)
      .eq('user_id', userId)
      .gte('completed_at', thirtyDaysAgo.toISOString());

    if (completions && completions.length > 0) {
      const completedDays = new Set(
        completions.map((c) =>
          new Date(c.completed_at).toISOString().split('T')[0]
        )
      ).size;
      complianceRate = ((completedDays / 30) * 100).toFixed(0);
    }
  }

  // Get user tier
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('tier')
    .eq('id', userId)
    .single();

  // Calculate weak areas
  let weakAreas = [];
  if (latestAnalysis?.breakdown) {
    weakAreas = Object.entries(latestAnalysis.breakdown)
      .filter(([key, value]) => value < 7.0)
      .map(([key]) => key);
  }

  return {
    latestScore: latestAnalysis?.score || null,
    weakAreas: weakAreas.join(', ') || 'none',
    activeRoutineName: activeRoutine?.name || 'none',
    complianceRate: complianceRate || '0',
    tier: user?.tier || 'free',
  };
}

/**
 * POST /api/ai-coach/chat
 * Send message to AI coach
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;
      const { conversationId, message } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Message is required',
        });
      }

      // Get user tier
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('tier')
        .eq('id', userId)
        .single();

      const tier = user?.tier || 'free';

      // Check rate limit
      const rateLimit = await checkRateLimit(userId, tier);
      if (!rateLimit.allowed) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: `You've reached your monthly limit of ${rateLimit.limit} messages. Upgrade to send more.`,
          remaining: 0,
        });
      }

      // Get or create conversation
      let conversation;
      if (conversationId) {
        const { data, error } = await supabaseAdmin
          .from('ai_conversations')
          .select('*')
          .eq('id', conversationId)
          .eq('user_id', userId)
          .single();

        if (error || !data) {
          return res.status(404).json({
            error: 'Conversation not found',
          });
        }
        conversation = data;
      } else {
        // Create new conversation
        const { data, error } = await supabaseAdmin
          .from('ai_conversations')
          .insert({
            user_id: userId,
            title: message.substring(0, 50),
          })
          .select()
          .single();

        if (error) throw error;
        conversation = data;
      }

      // Get conversation history
      const { data: messages } = await supabaseAdmin
        .from('ai_messages')
        .select('role, content')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      // Get user context
      const context = await getUserContext(userId);

      // Build system prompt
      const systemPrompt = `You are a supportive looksmaxxing coach for BlackPill.

User context:
- Latest score: ${context.latestScore || 'N/A'}/10
- Weak areas: ${context.weakAreas}
- Current routine: ${context.activeRoutineName}
- Routine compliance: ${context.complianceRate}%
- Subscription: ${context.tier}
- Recent progress: ${context.latestScore ? `Current score is ${context.latestScore}/10` : 'No analyses yet'}

Be constructive, encouraging, and specific. Reference their data when relevant.
Avoid toxic terminology. Focus on actionable advice.
If asked about advanced treatments, recommend consulting professionals.
Keep responses concise (2-3 sentences max).`;

      // Add user message to conversation
      await supabaseAdmin
        .from('ai_messages')
        .insert({
          conversation_id: conversation.id,
          role: 'user',
          content: message,
        });

      // Build messages array for OpenAI
      const openaiMessages = [
        { role: 'system', content: systemPrompt },
        ...(messages || []).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user', content: message },
      ];

      // Call OpenAI
      const completion = await openai.chat.completions.create({
        model: config.openai.model || 'gpt-4o-mini',
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 300,
      });

      const reply = completion.choices[0].message.content;
      const tokensUsed = completion.usage?.total_tokens || 0;

      // Save assistant message
      await supabaseAdmin
        .from('ai_messages')
        .insert({
          conversation_id: conversation.id,
          role: 'assistant',
          content: reply,
          tokens_used: tokensUsed,
        });

      // Update conversation timestamp
      await supabaseAdmin
        .from('ai_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversation.id);

      // Update usage tracking
      await updateUsage(userId, tokensUsed);

      // Re-check rate limit for remaining count
      const updatedRateLimit = await checkRateLimit(userId, tier);

      return res.status(200).json({
        reply,
        conversationId: conversation.id,
        remainingMessages: updatedRateLimit.remaining,
      });
    } catch (error) {
      console.error('AI coach error:', error);
      return res.status(500).json({
        error: 'Failed to get AI response',
        message: error.message,
      });
    }
  });
};

