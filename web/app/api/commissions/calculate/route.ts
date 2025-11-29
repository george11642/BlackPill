import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { sendCommissionTierUpgradeEmail } from '@/lib/emails/send';

/**
 * POST /api/commissions/calculate
 * Calculate commission for a subscription payment
 * Called when a subscription payment is received
 * 
 * If referrer has active subscription: creates commission record (20% of payment)
 * If referrer has NO subscription: grants unblur credits instead
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscriptionId, amount, referred_user_id, referrer_user_id } = body;

    if (!subscriptionId || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing subscriptionId or amount' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Find subscription (works for both Stripe and RevenueCat)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('user_id, stripe_subscription_id, revenuecat_subscription_id, referred_by_user_id')
      .or(`stripe_subscription_id.eq.${subscriptionId},revenuecat_subscription_id.eq.${subscriptionId}`)
      .maybeSingle();

    if (!subscription?.user_id) {
      return NextResponse.json(
        { success: true, message: 'Subscription not found or no user assigned' }
      );
    }

    // Get referrer - prefer passed referrer_user_id, then check subscription.referred_by_user_id, then user's referred_by
    let referrerUserId: string | null = referrer_user_id || subscription.referred_by_user_id || null;

    if (!referrerUserId) {
      // Check user's referred_by field
      const { data: user } = await supabase
        .from('users')
        .select('referred_by')
        .eq('id', subscription.user_id)
        .single();

      referrerUserId = user?.referred_by || null;
    }

    if (!referrerUserId) {
      return NextResponse.json(
        { success: true, message: 'No referrer found for this subscription' }
      );
    }

    // Check if referrer has an active subscription
    const { data: referrerSubscription } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', referrerUserId)
      .eq('status', 'active')
      .single();

    const referrerHasSubscription = !!referrerSubscription;

    if (referrerHasSubscription) {
      // Referrer has subscription - create commission record
      // Find or create affiliate record
      let { data: affiliate } = await supabase
        .from('affiliates')
        .select('id, commission_rate, tier, user_id')
        .eq('user_id', referrerUserId)
        .single();

      if (!affiliate) {
        // Create affiliate record
        const { data: referrerUser } = await supabase
          .from('users')
          .select('referral_code')
          .eq('id', referrerUserId)
          .single();

        if (!referrerUser) {
          return NextResponse.json(
            { error: 'Referrer user not found' },
            { status: 404 }
          );
        }

        const { data: newAffiliate, error: affiliateError } = await supabase
          .from('affiliates')
          .insert({
            user_id: referrerUserId,
            referral_code: referrerUser.referral_code.toUpperCase(),
            tier: 'base',
            commission_rate: 20.0,
            is_active: true,
          })
          .select('id, commission_rate, tier, user_id')
          .single();

        if (affiliateError || !newAffiliate) {
          console.error('Error creating affiliate:', affiliateError);
          return NextResponse.json(
            { error: 'Failed to create affiliate record' },
            { status: 500 }
          );
        }

        affiliate = newAffiliate;
      }

      // Find or create affiliate_referral record
      let { data: referral } = await supabase
        .from('affiliate_referrals')
        .select('id')
        .eq('affiliate_id', affiliate.id)
        .eq('referred_user_id', subscription.user_id)
        .single();

      if (!referral) {
        // Create affiliate_referral record
        const { data: newReferral, error: referralError } = await supabase
          .from('affiliate_referrals')
          .insert({
            affiliate_id: affiliate.id,
            referred_user_id: subscription.user_id,
            is_converted: true,
            conversion_timestamp: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (referralError || !newReferral) {
          console.error('Error creating affiliate_referral:', referralError);
        } else {
          referral = newReferral;
        }
      } else {
        // Update existing referral to mark as converted
        await supabase
          .from('affiliate_referrals')
          .update({
            is_converted: true,
            conversion_timestamp: new Date().toISOString(),
          })
          .eq('id', referral.id);
      }

      // Calculate commission
      const commissionAmount = (amount * affiliate.commission_rate) / 100;

      // Get current period dates
      const now = new Date();
      const periodStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      ).toISOString();
      const periodEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).toISOString();

      // Create commission record
      if (referral?.id) {
        await supabase.from('commissions').insert({
          affiliate_id: affiliate.id,
          referral_id: referral.id,
          amount: commissionAmount,
          commission_rate: affiliate.commission_rate,
          subscription_revenue: amount,
          status: 'pending',
          period_start: periodStart,
          period_end: periodEnd,
        });
      }

      // Update affiliate commission rate if tier changed
      const { data: activeReferrals } = await supabase
        .from('affiliate_referrals')
        .select('id')
        .eq('affiliate_id', affiliate.id)
        .eq('is_converted', true)
        .eq('is_fraudulent', false);

      const activeCount = activeReferrals?.length || 0;
      let newTier = 'base';
      let newRate = 20.0;

      if (activeCount >= 50) {
        newTier = 'tier_3';
        newRate = 30.0;
      } else if (activeCount >= 10) {
        newTier = 'tier_2';
        newRate = 25.0;
      }

      if (newRate !== affiliate.commission_rate) {
        await supabase
          .from('affiliates')
          .update({
            tier: newTier,
            commission_rate: newRate,
          })
          .eq('id', affiliate.id);

        // Send tier upgrade email
        const { data: affiliateUser } = await supabase
          .from('users')
          .select('email')
          .eq('id', referrerUserId)
          .single();

        if (affiliateUser?.email) {
          try {
            await sendCommissionTierUpgradeEmail(
              affiliateUser.email,
              newTier,
              newRate,
              activeCount
            );
          } catch (emailError) {
            console.error('Failed to send tier upgrade email:', emailError);
          }
        }
      }

      return NextResponse.json({
        success: true,
        type: 'commission',
        commissionAmount,
        affiliateId: affiliate.id,
      });
    } else {
      // Referrer has NO subscription - grant unblur credits instead
      const CREDITS_TO_GRANT = 1;

      await supabase.rpc('increment_unblur_credits', {
        user_id: referrerUserId,
        amount: CREDITS_TO_GRANT,
      });

      return NextResponse.json({
        success: true,
        type: 'credits',
        creditsGranted: CREDITS_TO_GRANT,
        referrerUserId,
      });
    }
  } catch (error: any) {
    console.error('Commission calculation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

