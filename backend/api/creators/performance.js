const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * GET /api/creators/performance
 * Get creator performance analytics
 */
module.exports = async (req, res) => {
  await verifyAuth(req, res, async () => {
    try {
      const { start_date, end_date } = req.query;

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

      const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = end_date ? new Date(end_date) : new Date();

      // Get daily clicks
      const { data: clicks } = await supabaseAdmin
        .from('affiliate_clicks')
        .select('created_at')
        .eq('creator_id', creator.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Get daily conversions
      const { data: conversions } = await supabaseAdmin
        .from('affiliate_conversions')
        .select('created_at, commission_earned')
        .eq('creator_id', creator.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Aggregate by day
      const dailyData = {};

      clicks?.forEach(click => {
        const date = click.created_at.split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = { date, clicks: 0, conversions: 0, revenue: 0 };
        }
        dailyData[date].clicks++;
      });

      conversions?.forEach(conversion => {
        const date = conversion.created_at.split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = { date, clicks: 0, conversions: 0, revenue: 0 };
        }
        dailyData[date].conversions++;
        dailyData[date].revenue += parseFloat(conversion.commission_earned || 0);
      });

      // Convert to array and sort
      const daily_data = Object.values(dailyData)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(day => ({
          ...day,
          revenue: parseFloat(day.revenue.toFixed(2)),
        }));

      res.status(200).json({ daily_data });

    } catch (error) {
      console.error('Creator performance error:', error);
      res.status(500).json({
        error: 'Failed to get performance data',
        message: error.message,
      });
    }
  });
};

