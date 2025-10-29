const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * GET /api/user/export
 * Export all user data (GDPR compliance)
 */
module.exports = async (req, res) => {
  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;

      // Get user data
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      // Get analyses
      const { data: analyses } = await supabaseAdmin
        .from('analyses')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null);

      // Get subscription
      const { data: subscription } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Get referrals (sent)
      const { data: referralsSent } = await supabaseAdmin
        .from('referrals')
        .select('*')
        .eq('from_user_id', userId);

      // Get referrals (received)
      const { data: referralsReceived } = await supabaseAdmin
        .from('referrals')
        .select('*')
        .eq('to_user_id', userId);

      // Get share logs
      const { data: shareLogs } = await supabaseAdmin
        .from('share_logs')
        .select('*')
        .eq('user_id', userId);

      // Get support tickets
      const { data: supportTickets } = await supabaseAdmin
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId);

      // Compile all data
      const exportData = {
        user,
        analyses: analyses || [],
        subscription,
        referrals: {
          sent: referralsSent || [],
          received: referralsReceived || [],
        },
        share_logs: shareLogs || [],
        support_tickets: supportTickets || [],
        export_date: new Date().toISOString(),
        data_rights_info: {
          gdpr: 'You have the right to access, rectify, delete, and port your data.',
          contact: 'support@black-pill.app',
        },
      };

      // Return as JSON
      res.status(200).json(exportData);

    } catch (error) {
      console.error('User export error:', error);
      res.status(500).json({
        error: 'Failed to export user data',
        message: error.message,
      });
    }
  });
};


