import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * GET /api/wellness/data
 * Get user's wellness data
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const { searchParams } = new URL(request.url);
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '30');

    let query = supabaseAdmin
      .from('user_wellness_data')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(limit);

    if (start_date) {
      query = query.gte('date', start_date);
    }

    if (end_date) {
      query = query.lte('date', end_date);
    }

    const { data: wellnessData, error } = await query;

    if (error) {
      console.error('Wellness data fetch error:', error);
      throw error;
    }

    return createResponseWithId(
      {
        wellnessData: wellnessData || [],
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Get wellness data error:', error);
    return handleApiError(error, request);
  }
});

