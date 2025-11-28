import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, referralCode } = body;

    // Verify the user ID matches
    if (userId !== user.id) {
      return NextResponse.json({ error: 'User ID mismatch' }, { status: 403 });
    }

    if (!referralCode) {
      return NextResponse.json({ error: 'Referral code required' }, { status: 400 });
    }

    // Verify referral code exists and is active
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id, user_id')
      .eq('referral_code', referralCode)
      .eq('is_active', true)
      .single();

    if (!affiliate) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    // Store referral code in RevenueCat subscriber attributes (will be sent in webhook)
    // For now, we'll just log it - the actual attribution happens in the webhook
    // when the subscription is created
    console.log('Referral attribution:', { userId, referralCode, affiliateId: affiliate.id });

    return NextResponse.json({ attributed: true });
  } catch (error: any) {
    console.error('RevenueCat attribution error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

