const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * GET /api/admin/review-queue
 * Get flagged content for manual review
 * 
 * Note: In production, add proper admin role verification
 */
module.exports = async (req, res) => {
  await verifyAuth(req, res, async () => {
    try {
      // TODO: Add admin role check
      // For now, any authenticated user can access (NOT FOR PRODUCTION)
      
      const status = req.query.status || 'pending';
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;

      const { data: queue, error } = await supabaseAdmin
        .from('review_queue')
        .select(`
          *,
          analyses(id, score, image_url),
          users(id, email, username)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      res.status(200).json({
        queue: queue || [],
        total: queue?.length || 0,
      });

    } catch (error) {
      console.error('Review queue error:', error);
      res.status(500).json({
        error: 'Failed to get review queue',
        message: error.message,
      });
    }
  });
};

