const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * GET /api/ai-coach/messages
 * Get messages for a conversation
 */
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const { conversationId } = req.query;
      const userId = req.user.id;

      if (!conversationId) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'conversationId is required',
        });
      }

      // Verify conversation belongs to user
      const { data: conversation } = await supabaseAdmin
        .from('ai_conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (!conversation) {
        return res.status(403).json({
          error: 'Unauthorized',
        });
      }

      // Get messages
      const { data: messages, error } = await supabaseAdmin
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return res.status(200).json({
        messages: messages || [],
      });
    } catch (error) {
      console.error('Get messages error:', error);
      return res.status(500).json({
        error: 'Failed to fetch messages',
        message: error.message,
      });
    }
  });
};

