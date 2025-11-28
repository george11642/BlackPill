import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

/**
 * GET /api/affiliates/generate-code
 * Generate a unique referral code for a new affiliate
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    // Generate unique referral code
    let referralCode = '';
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      // Generate code: 8 random uppercase letters
      referralCode = Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();

      // Check if code already exists
      const { data: existing } = await supabase
        .from('affiliates')
        .select('id')
        .eq('referral_code', referralCode)
        .single();

      if (!existing) {
        isUnique = true;
      }

      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate unique referral code' },
        { status: 500 }
      );
    }

    return NextResponse.json({ code: referralCode });
  } catch (error: any) {
    console.error('Error generating referral code:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

