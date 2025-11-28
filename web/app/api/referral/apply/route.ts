import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

/**
 * POST /api/referral/apply
 * Apply a referral code to link a new user to an affiliate
 * Called during signup or from affiliate dashboard
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { referralCode, userId } = body;

    if (!referralCode || !userId) {
      return NextResponse.json(
        { error: 'Missing referral code or user ID' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Find affiliate by referral code
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id, user_id')
      .eq('referral_code', referralCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    // Check if user is trying to use their own referral code
    if (affiliate.user_id === userId) {
      return NextResponse.json(
        { error: 'Cannot use your own referral code' },
        { status: 400 }
      );
    }

    // Check if user already has a referral applied via affiliate system
    const { data: existingReferral } = await supabase
      .from('affiliate_referrals')
      .select('id, is_converted')
      .eq('referred_user_id', userId)
      .single();

    if (existingReferral && existingReferral.is_converted) {
      return NextResponse.json(
        { error: 'You have already applied a referral code' },
        { status: 400 }
      );
    }

    // If there's an unconverted referral, update it with the user ID
    if (existingReferral && !existingReferral.is_converted) {
      await supabase
        .from('affiliate_referrals')
        .update({ referred_user_id: userId })
        .eq('id', existingReferral.id);

      return NextResponse.json({
        success: true,
        message: 'Referral code applied successfully',
      });
    }

    // Otherwise create a new referral record
    const { data: referral, error: referralError } = await supabase
      .from('affiliate_referrals')
      .insert({
        affiliate_id: affiliate.id,
        referred_user_id: userId,
        click_timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (referralError) {
      throw new Error('Failed to apply referral code');
    }

    return NextResponse.json({
      success: true,
      message: 'Referral code applied successfully',
      referralId: referral?.id,
    });
  } catch (error: any) {
    console.error('Referral apply error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

