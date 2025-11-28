import { NextRequest } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';
import { checkReferralAchievements } from '@/lib/achievements/service';

/**
 * POST /api/referrals/redeem
 * Redeem a referral code and grant bonus credits
 */
export const POST = withAuth(async (request: NextRequest, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const { referral_code } = body;

    if (!referral_code) {
      return createResponseWithId(
        {
          error: 'Invalid request',
          message: 'Referral code is required',
        },
        { status: 400 },
        requestId
      );
    }

    // Look up the referrer by referral code from users table
    const { data: referrer, error: referrerError } = await supabaseAdmin
      .from('users')
      .select('id, referral_code')
      .eq('referral_code', referral_code.toUpperCase())
      .single();

    if (referrerError || !referrer) {
      return createResponseWithId(
        {
          error: 'Invalid code',
          message: 'Referral code not found',
        },
        { status: 404 },
        requestId
      );
    }

    // Check if user is trying to redeem their own code
    if (referrer.id === user.id) {
      return createResponseWithId(
        {
          error: 'Invalid',
          message: 'You cannot redeem your own referral code',
        },
        { status: 400 },
        requestId
      );
    }

    // Check if user already has a referrer
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('referred_by')
      .eq('id', user.id)
      .single();

    if (currentUser?.referred_by) {
      return createResponseWithId(
        {
          error: 'Already redeemed',
          message: 'You have already redeemed a referral code',
        },
        { status: 400 },
        requestId
      );
    }

    // Check if referrer has an active subscription
    const { data: referrerSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', referrer.id)
      .eq('status', 'active')
      .single();

    // Create or get affiliate record if referrer has subscription
    let affiliateId: string | null = null;
    if (referrerSubscription) {
      // Check if affiliate record exists
      const { data: existingAffiliate } = await supabaseAdmin
        .from('affiliates')
        .select('id')
        .eq('user_id', referrer.id)
        .single();

      if (existingAffiliate) {
        affiliateId = existingAffiliate.id;
      } else {
        // Create affiliate record for referrer
        const { data: newAffiliate, error: affiliateError } = await supabaseAdmin
          .from('affiliates')
          .insert({
            user_id: referrer.id,
            referral_code: referrer.referral_code.toUpperCase(),
            tier: 'base',
            commission_rate: 20.0,
            is_active: true,
          })
          .select('id')
          .single();

        if (!affiliateError && newAffiliate) {
          affiliateId = newAffiliate.id;
        }
      }

      // Create affiliate_referral record if affiliate exists
      if (affiliateId) {
        const { data: referral, error: referralError } = await supabaseAdmin
          .from('affiliate_referrals')
          .insert({
            affiliate_id: affiliateId,
            referred_user_id: user.id,
            is_converted: false, // Will be marked true when subscription happens
            conversion_timestamp: null,
          })
          .select('id')
          .single();

        if (referralError) {
          console.error('Error creating affiliate_referral:', referralError);
        }
      }
    }

    // Update user's referred_by field
    await supabaseAdmin
      .from('users')
      .update({ referred_by: referrer.id })
      .eq('id', user.id);

    // Grant bonus credits to both users (immediate reward)
    const BONUS_CREDITS = 1;

    // Add credits to referrer
    await supabaseAdmin.rpc('increment_unblur_credits', {
      user_id: referrer.id,
      amount: BONUS_CREDITS,
    });

    // Add credits to referee (new user)
    await supabaseAdmin.rpc('increment_unblur_credits', {
      user_id: user.id,
      amount: BONUS_CREDITS,
    });

    // Check referral count for achievements (fire and forget)
    Promise.all([
      (async () => {
        try {
          // Count accepted referrals for the referrer
          const { count: referralCount } = await supabaseAdmin
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('referred_by', referrer.id);

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

    return createResponseWithId(
      {
        success: true,
        message: 'Referral code redeemed successfully!',
        credits_earned: BONUS_CREDITS,
        referrer_id: referrer.id,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Referral redeem error:', error);
    return handleApiError(error, request);
  }
});

