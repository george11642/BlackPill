const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * POST /api/creators/apply
 * Apply for creator program
 */
module.exports = async (req, res) => {
  await verifyAuth(req, res, async () => {
    try {
      const {
        name,
        instagram_handle,
        tiktok_handle,
        instagram_follower_count,
        tiktok_follower_count,
        bio,
      } = req.body;

      // Validate
      if (!name || (!instagram_handle && !tiktok_handle)) {
        return res.status(400).json({
          error: 'Name and at least one social handle required',
        });
      }

      // Check if already applied
      const { data: existing } = await supabaseAdmin
        .from('creators')
        .select('id, status')
        .eq('user_id', req.user.id)
        .single();

      if (existing) {
        return res.status(409).json({
          error: 'Already applied',
          status: existing.status,
        });
      }

      // Determine tier based on follower count
      const totalFollowers = (instagram_follower_count || 0) + (tiktok_follower_count || 0);
      let tier = 'nano';
      let commissionRate = 0.30;

      if (totalFollowers >= 100000) {
        tier = 'macro';
        commissionRate = 0.20;
      } else if (totalFollowers >= 10000) {
        tier = 'micro';
        commissionRate = 0.25;
      }

      // Generate affiliate link
      const handle = instagram_handle || tiktok_handle;
      const affiliateLink = `bp.app/ref/${handle.replace('@', '')}`;

      // Create application
      const { data: creator, error } = await supabaseAdmin
        .from('creators')
        .insert({
          user_id: req.user.id,
          name,
          instagram_handle,
          tiktok_handle,
          instagram_follower_count,
          tiktok_follower_count,
          affiliate_link: affiliateLink,
          tier,
          commission_rate: commissionRate,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.status(200).json({
        application_id: creator.id,
        status: 'pending',
        message: 'Application submitted! We\'ll review within 48 hours.',
      });

    } catch (error) {
      console.error('Creator application error:', error);
      res.status(500).json({
        error: 'Failed to submit application',
        message: error.message,
      });
    }
  });
};

