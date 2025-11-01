const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * GET /api/ai-coach/conversations
 * Get user's AI conversations
 */
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;

      const { data: conversations, error } = await supabaseAdmin
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      return res.status(200).json({
        conversations: conversations || [],
      });
    } catch (error) {
      console.error('Get conversations error:', error);
      return res.status(500).json({
        error: 'Failed to fetch conversations',
        message: error.message,
      });
    }
  });
};

