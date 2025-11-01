const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * PUT /api/insights/mark-viewed
 * Mark insight as viewed
 */
module.exports = async (req, res) => {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;
      const { insightId } = req.body;

      if (!insightId) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'insightId is required',
        });
      }

      // Verify insight belongs to user
      const { data: insight, error: insightError } = await supabaseAdmin
        .from('user_insights')
        .select('id')
        .eq('id', insightId)
        .eq('user_id', userId)
        .single();

      if (insightError || !insight) {
        return res.status(404).json({
          error: 'Insight not found',
        });
      }

      // Mark as viewed
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('user_insights')
        .update({ is_viewed: true })
        .eq('id', insightId)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Mark viewed error:', updateError);
        throw updateError;
      }

      return res.status(200).json({
        insight: updated,
      });
    } catch (error) {
      console.error('Mark insight viewed error:', error);
      return res.status(500).json({
        error: 'Failed to mark insight as viewed',
        message: error.message,
      });
    }
  });
};

