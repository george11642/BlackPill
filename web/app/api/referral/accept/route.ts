
import {
  withAuth,
  supabaseAdmin,
  sendNotificationToUser,
  handleApiError,
  getRequestId,
  createResponseWithId,
} from '@/lib';
import { checkReferralAchievements } from '@/lib/achievements/service';

/**
 * POST /api/referral/accept
 * Accept a referral code
 * 
 * @deprecated This endpoint is deprecated. Use /api/referrals/redeem instead.
 * This endpoint is kept for backward compatibility but will be removed in a future version.
 */
export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  // Log deprecation warning
  console.warn('[DEPRECATED] /api/referral/accept is deprecated. Use /api/referrals/redeem instead.');

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

    const bonusCredits = 1;

    // Create referral record
    const { data: referral, error: referralError } = await supabaseAdmin
      .from('referrals')
      .insert({
        from_user_id: referrer.id,
        to_user_id: user.id,
        referral_code,
        bonus_scans_given: 0, // Deprecated field, keep as 0 or remove if possible
        bonus_credits_given: bonusCredits, // New field? Or just handle in logic. Let's assume migration added unblur_credits to user but maybe not to referrals table yet. I'll just track it in user table for now.
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (referralError) {
      throw new Error('Failed to create referral record');
    }

    // Update referred user - increment unblur credits
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('unblur_credits')
      .eq('id', user.id)
      .single();

    await supabaseAdmin
      .from('users')
      .update({
        referred_by: referrer.id,
        unblur_credits: (currentUser?.unblur_credits || 0) + bonusCredits,
      })
      .eq('id', user.id);

    // Give bonus credits to referrer
    const { data: referrerUser } = await supabaseAdmin
      .from('users')
      .select('unblur_credits')
      .eq('id', referrer.id)
      .single();

    await supabaseAdmin
      .from('users')
      .update({
        unblur_credits: (referrerUser?.unblur_credits || 0) + bonusCredits,
      })
      .eq('id', referrer.id);

    // Check referral count for achievements (fire and forget)
    Promise.all([
      (async () => {
        try {
          const { count: referralCount } = await supabaseAdmin
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('from_user_id', referrer.id)
            .eq('status', 'accepted');

          if (referralCount !== null) {
            await checkReferralAchievements(referrer.id, referralCount);
          }
        } catch (error) {
          console.error('Error checking referral achievements:', error);
        }
      })(),
    ]).catch(() => {
      // Ignore errors - achievements are non-critical
    });

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
        `${refereeName} accepted your referral. You got ${bonusCredits} unblur credit!`,
        { type: 'referral_accepted', bonus_credits: bonusCredits }
      );

      // Send notification to referee
      await sendNotificationToUser(
        user.id,
        'Welcome to Black Pill! 🚀',
        `You got ${bonusCredits} unblur credit from ${referrer.username || 'a friend'}!`,
        { type: 'referral_bonus_received', bonus_credits: bonusCredits }
      );
    } catch (notificationError) {
      console.error('Error sending push notifications:', notificationError);
      // Don't fail the referral if notifications fail - they're non-critical
    }

    return createResponseWithId(
      {
        bonus_credits: bonusCredits,
        referrer_name: referrer.username || referrer.email?.split('@')[0],
        message: `You got ${bonusCredits} unblur credit from ${referrer.username || 'a friend'}!`,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Referral acceptance error:', error);
    return handleApiError(error, request);
  }
});

