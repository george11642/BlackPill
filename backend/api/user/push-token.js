const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * POST /api/user/push-token
 * Store/update user's push notification token
 */
module.exports = async (req, res) => {
  await verifyAuth(req, res, async () => {
    try {
      const { token, platform } = req.body;

      if (!token) {
        return res.status(400).json({
          error: 'Missing token',
          message: 'Push notification token is required',
        });
      }

      // Store token in user metadata or separate table
      // For now, we'll store it in a simple user_device_tokens table
      // In production, you might want to support multiple devices per user
      
      // Check if token already exists for this user
      const { data: existing } = await supabaseAdmin
        .from('user_device_tokens')
        .select('id')
        .eq('user_id', req.user.id)
        .eq('token', token)
        .maybeSingle();

      if (existing) {
        // Update last active
        await supabaseAdmin
          .from('user_device_tokens')
          .update({
            updated_at: new Date().toISOString(),
            platform: platform || 'unknown',
          })
          .eq('id', existing.id);
      } else {
        // Insert new token
        await supabaseAdmin
          .from('user_device_tokens')
          .insert({
            user_id: req.user.id,
            token: token,
            platform: platform || 'unknown',
          });
      }

      res.status(200).json({
        success: true,
        message: 'Push token stored successfully',
      });

    } catch (error) {
      console.error('Push token storage error:', error);
      res.status(500).json({
        error: 'Failed to store push token',
        message: error.message,
      });
    }
  });
};

