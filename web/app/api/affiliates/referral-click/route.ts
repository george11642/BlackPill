import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/affiliates/referral-click
 * Track a referral link click and create a referral record
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { referralCode } = body;

    if (!referralCode) {
      return NextResponse.json(
        { error: 'Missing referral code' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Find affiliate by referral code
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id, is_active')
      .eq('referral_code', referralCode.toUpperCase())
      .single();

    if (!affiliate || !affiliate.is_active) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    // Create affiliate referral click record (no user_id yet - they haven't signed up)
    await supabase.from('affiliate_referrals').insert({
      affiliate_id: affiliate.id,
      referred_user_id: null,
      click_timestamp: new Date().toISOString(),
    });

    // Set cookie for attribution (30 days)
    const cookieStore = await cookies();
    cookieStore.set('affiliate_referral_code', referralCode.toUpperCase(), {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Affiliate referral click error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

