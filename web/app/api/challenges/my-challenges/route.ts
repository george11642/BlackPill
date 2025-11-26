import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * GET /api/challenges/my-challenges
 * Get user's active challenges
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('challenge_participations')
      .select(
        `
        *,
        challenges (*),
        challenge_checkins (*)
      `
      )
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: participations, error } = await query;

    if (error) {
      console.error('My challenges fetch error:', error);
      throw error;
    }

    return createResponseWithId(
      {
        participations: participations || [],
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Get my challenges error:', error);
    return handleApiError(error, request);
  }
});

