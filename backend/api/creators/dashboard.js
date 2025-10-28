const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * GET /api/creators/dashboard
 * Get creator dashboard data
 */
module.exports = async (req, res) => {
  await verifyAuth(req, res, async () => {
    try {
      // Get creator record
      const { data: creator, error } = await supabaseAdmin
        .from('creators')
        .select('*')
        .eq('user_id', req.user.id)
        .single();

      if (error || !creator) {
        return res.status(404).json({
          error: 'Creator not found',
          message: 'You must apply and be approved first',
        });
      }

      if (creator.status !== 'approved') {
        return res.status(403).json({
          error: 'Not approved',
          status: creator.status,
        });
      }

      // Get total clicks
      const { count: totalClicks } = await supabaseAdmin
        .from('affiliate_clicks')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creator.id);

      // Get total conversions
      const { count: totalConversions } = await supabaseAdmin
        .from('affiliate_conversions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creator.id);

      // Get revenue this month
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data: monthlyConversions } = await supabaseAdmin
        .from('affiliate_conversions')
        .select('commission_earned')
        .eq('creator_id', creator.id)
        .gte('created_at', monthStart.toISOString());

      const revenueThisMonth = monthlyConversions?.reduce(
        (sum, c) => sum + parseFloat(c.commission_earned || 0),
        0
      ) || 0;

      // Get pending payout
      const { data: pendingConversions } = await supabaseAdmin
        .from('affiliate_conversions')
        .select('commission_earned')
        .eq('creator_id', creator.id)
        .eq('status', 'approved')
        .is('paid_at', null);

      const payoutPending = pendingConversions?.reduce(
        (sum, c) => sum + parseFloat(c.commission_earned || 0),
        0
      ) || 0;

      // Calculate conversion rate
      const conversionRate = totalClicks > 0
        ? (totalConversions / totalClicks) * 100
        : 0;

      // Next payout date (15th of next month)
      const nextPayout = new Date();
      nextPayout.setMonth(nextPayout.getMonth() + 1);
      nextPayout.setDate(15);

      res.status(200).json({
        creator_id: creator.id,
        affiliate_link: `https://${creator.affiliate_link}`,
        tier: creator.tier,
        commission_rate: creator.commission_rate,
        stats: {
          total_clicks: totalClicks || 0,
          total_conversions: totalConversions || 0,
          conversion_rate: conversionRate.toFixed(2),
          revenue_this_month: revenueThisMonth.toFixed(2),
          payout_pending: payoutPending.toFixed(2),
          next_payout_date: nextPayout.toISOString().split('T')[0],
        },
      });

    } catch (error) {
      console.error('Creator dashboard error:', error);
      res.status(500).json({
        error: 'Failed to get dashboard data',
        message: error.message,
      });
    }
  });
};

