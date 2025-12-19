import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email, makeAffiliate } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // Find user by email
    const { data: authUser } = await adminSupabase.auth.admin.listUsers();
    const targetUser = authUser.users.find((u) => u.email === email);

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found with that email' },
        { status: 404 }
      );
    }

    // Check if user already has a profile
    const { data: existingProfile } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('id', targetUser.id)
      .maybeSingle();

    if (!existingProfile) {
      // Create profile if it doesn't exist
      await adminSupabase.from('profiles').insert({
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.user_metadata?.name || null,
      });
    }

    // Generate RevenueCat IDs for app compatibility
    // The mobile app requires RevenueCat IDs to recognize subscriptions, even for admin-granted ones
    const revenuecatSubscriptionId = `admin_granted_${crypto.randomUUID()}`;
    const revenuecatCustomerId = targetUser.id;

    // Grant free subscription (lifetime or long-term)
    const subscriptionData = {
      user_id: targetUser.id,
      status: 'active',
      tier: 'pro',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date('2099-12-31').toISOString(), // Far future date
      payment_provider: 'revenuecat', // Changed from 'admin_granted' to 'revenuecat' for app compatibility
      revenuecat_subscription_id: revenuecatSubscriptionId,
      revenuecat_customer_id: revenuecatCustomerId,
    };

    // Check if subscription already exists
    const { data: existingSubscription } = await adminSupabase
      .from('subscriptions')
      .select('id, revenuecat_subscription_id, revenuecat_customer_id')
      .eq('user_id', targetUser.id)
      .maybeSingle();

    if (existingSubscription) {
      // Update existing subscription, ensuring RevenueCat IDs are set if missing
      const updateData = {
        ...subscriptionData,
        // Preserve existing RevenueCat IDs if they exist, otherwise use new ones
        revenuecat_subscription_id: existingSubscription.revenuecat_subscription_id || revenuecatSubscriptionId,
        revenuecat_customer_id: existingSubscription.revenuecat_customer_id || revenuecatCustomerId,
      };
      await adminSupabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', existingSubscription.id);
    } else {
      // Create new subscription
      await adminSupabase.from('subscriptions').insert(subscriptionData);
    }

    let affiliateCreated = false;
    let referralCode: string | null = null;
    let referralLink: string | null = null;

    // Make affiliate if requested
    if (makeAffiliate) {
      const { data: existingAffiliate } = await adminSupabase
        .from('affiliates')
        .select('id, referral_code')
        .eq('user_id', targetUser.id)
        .maybeSingle();

      if (!existingAffiliate) {
        // Generate referral code using RPC function
        const { data: codeData } = await adminSupabase.rpc('generate_referral_code');
        referralCode = codeData || Math.random().toString(36).substring(2, 10).toUpperCase();
        
        await adminSupabase.from('affiliates').insert({
          user_id: targetUser.id,
          referral_code: referralCode,
          tier: 'base',
          commission_rate: 20.0,
          is_active: true,
        });
        affiliateCreated = true;
      } else {
        // Activate existing affiliate and get their referral code
        await adminSupabase
          .from('affiliates')
          .update({ is_active: true })
          .eq('id', existingAffiliate.id);
        referralCode = existingAffiliate.referral_code;
        affiliateCreated = true;
      }

      // Generate referral link if we have a referral code
      // BlackPill uses ?ref= format instead of /ref/ format
      if (referralCode) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://black-pill.app';
        referralLink = `${baseUrl}?ref=${referralCode}`;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Subscription granted${makeAffiliate && affiliateCreated ? ' and affiliate created' : ''}`,
      userId: targetUser.id,
      referralCode: referralCode || undefined,
      referralLink: referralLink || undefined,
    });
  } catch (error: any) {
    console.error('Grant subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to grant subscription' },
      { status: 500 }
    );
  }
}
