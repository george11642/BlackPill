const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * GET /api/analyses/:id - Get single analysis
 * DELETE /api/analyses/:id - Delete analysis
 */
module.exports = async (req, res) => {
  await verifyAuth(req, res, async () => {
    const { id } = req.query;

    if (req.method === 'GET') {
      try {
        const { data: analysis, error } = await supabaseAdmin
          .from('analyses')
          .select('*')
          .eq('id', id)
          .is('deleted_at', null)
          .single();

        if (error || !analysis) {
          return res.status(404).json({
            error: 'Analysis not found',
          });
        }

        // Check if user owns this analysis OR it's public
        if (analysis.user_id !== req.user.id && !analysis.is_public) {
          return res.status(403).json({
            error: 'Not authorized to view this analysis',
          });
        }

        res.status(200).json(analysis);
      } catch (error) {
        console.error('Get analysis error:', error);
        res.status(500).json({
          error: 'Failed to get analysis',
          message: error.message,
        });
      }
    } else if (req.method === 'DELETE') {
      try {
        // Soft delete
        const { error } = await supabaseAdmin
          .from('analyses')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', req.user.id);

        if (error) {
          throw error;
        }

        res.status(200).json({ success: true });
      } catch (error) {
        console.error('Delete analysis error:', error);
        res.status(500).json({
          error: 'Failed to delete analysis',
          message: error.message,
        });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  });
};

