import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * GET /api/challenges
 * List available challenges
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get('difficulty');
    const focus_area = searchParams.get('focus_area');

    let query = supabaseAdmin
      .from('challenges')
      .select('*')
      .eq('is_active', true)
      .order('duration_days', { ascending: true });

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    if (focus_area) {
      query = query.contains('focus_areas', [focus_area]);
    }

    const { data: challenges, error } = await query;

    if (error) {
      console.error('Challenges fetch error:', error);
      throw error;
    }

    return createResponseWithId(
      {
        challenges: challenges || [],
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('List challenges error:', error);
    return handleApiError(error, request);
  }
});

