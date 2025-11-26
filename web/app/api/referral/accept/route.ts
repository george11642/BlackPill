import { Request } from 'next/server';
import {
  withAuth,
  supabaseAdmin,
  sendNotificationToUser,
  handleApiError,
  getRequestId,
  createResponseWithId,
} from '@/lib';

/**
 * POST /api/referral/accept
 * Accept a referral code
 */
export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const { referral_code } = body;

    if (!referral_code) {
      return createResponseWithId(
        {
          error: 'Missing referral code',
        },
        { status: 400 },
        requestId
      );
    }

    // Find the user who owns this referral code
    const { data: referrer, error: referrerError } = await supabaseAdmin
      .from('users')
      .select('id, username, email')
      .eq('referral_code', referral_code)
      .single();

    if (referrerError || !referrer) {
      return createResponseWithId(
        {
          error: 'Invalid referral code',
        },
        { status: 404 },
        requestId
      );
    }

    // Check if user is trying to refer themselves
    if (referrer.id === user.id) {
      return createResponseWithId(
        {
          error: 'Cannot use your own referral code',
        },
        { status: 403 },
        requestId
      );
    }

    // Check if user has already used a referral code
    const { data: existingReferral } = await supabaseAdmin
      .from('users')
      .select('referred_by')
      .eq('id', user.id)
      .single();

    if (existingReferral?.referred_by) {
      return createResponseWithId(
        {
          error: 'Referral code already used',
          message: 'You have already accepted a referral code',
        },
        { status: 409 },
        requestId
      );
    }

    const bonusScans = 5;

    // Create referral record
    const { data: referral, error: referralError } = await supabaseAdmin
      .from('referrals')
      .insert({
        from_user_id: referrer.id,
        to_user_id: user.id,
        referral_code,
        bonus_scans_given: bonusScans,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (referralError) {
      throw new Error('Failed to create referral record');
    }

    // Update referred user - increment scans
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('scans_remaining')
      .eq('id', user.id)
      .single();

    await supabaseAdmin
      .from('users')
      .update({
        referred_by: referrer.id,
        scans_remaining: (currentUser?.scans_remaining || 0) + bonusScans,
      })
      .eq('id', user.id);

    // Give bonus scans to referrer
    const { data: referrerUser } = await supabaseAdmin
      .from('users')
      .select('scans_remaining')
      .eq('id', referrer.id)
      .single();

    await supabaseAdmin
      .from('users')
      .update({
        scans_remaining: (referrerUser?.scans_remaining || 0) + bonusScans,
      })
      .eq('id', referrer.id);

    // Send push notifications to both users
    try {
      // Get referee username/email for referrer notification
      const { data: referee } = await supabaseAdmin
        .from('users')
        .select('username, email')
        .eq('id', user.id)
        .single();

      const refereeName = referee?.username || referee?.email?.split('@')[0] || 'a friend';

      // Send notification to referrer
      await sendNotificationToUser(
        referrer.id,
        'Friend Joined! 🎉',
        `${refereeName} accepted your referral. You got 5 bonus scans!`,
        { type: 'referral_accepted', bonus_scans: bonusScans }
      );

      // Send notification to referee
      await sendNotificationToUser(
        user.id,
        'Welcome to Black Pill! 🚀',
        `You got 5 free scans from ${referrer.username || 'a friend'}!`,
        { type: 'referral_bonus_received', bonus_scans: bonusScans }
      );
    } catch (notificationError) {
      console.error('Error sending push notifications:', notificationError);
      // Don't fail the referral if notifications fail - they're non-critical
    }

    return createResponseWithId(
      {
        bonus_scans: bonusScans,
        referrer_name: referrer.username || referrer.email?.split('@')[0],
        message: `You got ${bonusScans} free scans from ${referrer.username || 'a friend'}!`,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Referral acceptance error:', error);
    return handleApiError(error, request);
  }
});

