
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * POST /api/creators/apply
 * Apply for creator program
 */
export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const {
      name,
      instagram_handle,
      tiktok_handle,
      instagram_follower_count,
      tiktok_follower_count,
      bio,
    } = body;

    // Validate
    if (!name || (!instagram_handle && !tiktok_handle)) {
      return createResponseWithId(
        {
          error: 'Name and at least one social handle required',
        },
        { status: 400 },
        requestId
      );
    }

    // Check if already applied
    const { data: existing } = await supabaseAdmin
      .from('creators')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      return createResponseWithId(
        {
          error: 'Already applied',
          status: existing.status,
        },
        { status: 409 },
        requestId
      );
    }

    // Determine tier based on follower count
    const totalFollowers = (instagram_follower_count || 0) + (tiktok_follower_count || 0);
    let tier = 'nano';
    let commissionRate = 0.3;

    if (totalFollowers >= 100000) {
      tier = 'macro';
      commissionRate = 0.2;
    } else if (totalFollowers >= 10000) {
      tier = 'micro';
      commissionRate = 0.25;
    }

    // Generate affiliate link
    const handle = instagram_handle || tiktok_handle;
    const affiliateLink = `bp.app/ref/${handle.replace('@', '')}`;

    // Create application
    const { data: creator, error } = await supabaseAdmin
      .from('creators')
      .insert({
        user_id: user.id,
        name,
        instagram_handle,
        tiktok_handle,
        instagram_follower_count,
        tiktok_follower_count,
        affiliate_link: affiliateLink,
        tier,
        commission_rate: commissionRate,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return createResponseWithId(
      {
        application_id: creator.id,
        status: 'pending',
        message: "Application submitted! We'll review within 48 hours.",
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Creator application error:', error);
    return handleApiError(error, request);
  }
});

