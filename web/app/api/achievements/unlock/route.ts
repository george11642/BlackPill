
import {
  withAuth,
  supabaseAdmin,
  handleApiError,
  getRequestId,
  createResponseWithId,
} from '@/lib';

/**
 * POST /api/achievements/unlock
 * Unlock an achievement (typically called internally by other services)
 */
export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const { achievement_key } = body;

    if (!achievement_key) {
      return createResponseWithId(
        {
          error: 'Invalid request',
          message: 'achievement_key is required',
        },
        { status: 400 },
        requestId
      );
    }

    // Check if already unlocked
    const { data: existing } = await supabaseAdmin
      .from('user_achievements')
      .select('id')
      .eq('user_id', user.id)
      .eq('achievement_key', achievement_key)
      .single();

    if (existing) {
      return createResponseWithId(
        {
          success: true,
          already_unlocked: true,
        },
        { status: 200 },
        requestId
      );
    }

    // Unlock achievement
    const { data, error } = await supabaseAdmin
      .from('user_achievements')
      .insert({
        user_id: user.id,
        achievement_key,
        unlocked_at: new Date().toISOString(),
        reward_claimed: false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return createResponseWithId(
      {
        success: true,
        achievement: data,
        newly_unlocked: true,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Unlock achievement error:', error);
    return handleApiError(error, request);
  }
});

