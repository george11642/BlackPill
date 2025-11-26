import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * GET /api/user/export
 * Export all user data (GDPR compliance)
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    // Get user data
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // Get analyses
    const { data: analyses } = await supabaseAdmin
      .from('analyses')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    // Get subscription
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Get referrals (sent)
    const { data: referralsSent } = await supabaseAdmin
      .from('referrals')
      .select('*')
      .eq('from_user_id', user.id);

    // Get referrals (received)
    const { data: referralsReceived } = await supabaseAdmin
      .from('referrals')
      .select('*')
      .eq('to_user_id', user.id);

    // Get share logs
    const { data: shareLogs } = await supabaseAdmin
      .from('share_logs')
      .select('*')
      .eq('user_id', user.id);

    // Get support tickets
    const { data: supportTickets } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id);

    // Compile all data
    const exportData = {
      user: userData,
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
    return createResponseWithId(exportData, { status: 200 }, requestId);
  } catch (error) {
    console.error('User export error:', error);
    return handleApiError(error, request);
  }
});

