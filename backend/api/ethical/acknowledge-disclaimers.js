const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * POST /api/ethical/acknowledge-disclaimers
 * Save user's acknowledgment of disclaimers
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;
      const { disclaimers_acknowledged } = req.body;

      if (disclaimers_acknowledged !== true) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'disclaimers_acknowledged must be true',
        });
      }

      // Upsert ethical settings
      const { data: settings, error } = await supabaseAdmin
        .from('user_ethical_settings')
        .upsert(
          {
            user_id: userId,
            disclaimers_acknowledged: true,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          },
        )
        .select()
        .single();

      if (error) {
        console.error('Acknowledge disclaimers error:', error);
        throw error;
      }

      return res.status(200).json({
        settings,
        message: 'Disclaimers acknowledged successfully',
      });
    } catch (error) {
      console.error('Acknowledge disclaimers error:', error);
      return res.status(500).json({
        error: 'Failed to acknowledge disclaimers',
        message: error.message,
      });
    }
  });
};

