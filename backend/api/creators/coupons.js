const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * POST /api/creators/coupons
 * Create a discount coupon
 */
module.exports = async (req, res) => {
  await verifyAuth(req, res, async () => {
    try {
      const { code, discount_percent, max_uses, expires_at } = req.body;

      // Validate
      if (!code || !discount_percent) {
        return res.status(400).json({
          error: 'Code and discount_percent required',
        });
      }

      if (discount_percent < 0 || discount_percent > 100) {
        return res.status(400).json({
          error: 'Discount must be between 0 and 100',
        });
      }

      // Get creator record
      const { data: creator } = await supabaseAdmin
        .from('creators')
        .select('id, status')
        .eq('user_id', req.user.id)
        .single();

      if (!creator || creator.status !== 'approved') {
        return res.status(403).json({
          error: 'Not approved creator',
        });
      }

      // Create coupon
      const { data: coupon, error } = await supabaseAdmin
        .from('affiliate_coupons')
        .insert({
          creator_id: creator.id,
          code: code.toUpperCase(),
          discount_percent,
          max_uses: max_uses || 100,
          expires_at: expires_at || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return res.status(409).json({
            error: 'Coupon code already exists',
          });
        }
        throw error;
      }

      // Generate tracking URL
      const trackingUrl = `https://black-pill.app/subscribe?coupon=${coupon.code}`;

      res.status(200).json({
        coupon_id: coupon.id,
        code: coupon.code,
        discount_percent: coupon.discount_percent,
        max_uses: coupon.max_uses,
        tracking_url: trackingUrl,
      });

    } catch (error) {
      console.error('Create coupon error:', error);
      res.status(500).json({
        error: 'Failed to create coupon',
        message: error.message,
      });
    }
  });
};

