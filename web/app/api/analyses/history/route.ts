import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * GET /api/analyses/history
 * Get photo history with filtering and sorting options
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const { searchParams } = new URL(request.url);
    const {
      limit = '50',
      offset = '0',
      sort_by = 'created_at', // 'created_at', 'score'
      order = 'desc', // 'asc', 'desc'
      start_date,
      end_date,
      min_score,
      max_score,
    } = Object.fromEntries(searchParams);

    // Build query
    let query = supabaseAdmin
      .from('analyses')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    // Date filtering
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    // Score filtering
    if (min_score) {
      query = query.gte('score', parseFloat(min_score));
    }
    if (max_score) {
      query = query.lte('score', parseFloat(max_score));
    }

    // Sorting
    const ascending = order === 'asc';
    query = query.order(sort_by, { ascending });

    // Pagination
    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data: analyses, error } = await query;

    if (error) {
      throw error;
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (start_date) {
      countQuery = countQuery.gte('created_at', start_date);
    }
    if (end_date) {
      countQuery = countQuery.lte('created_at', end_date);
    }
    if (min_score) {
      countQuery = countQuery.gte('score', parseFloat(min_score));
    }
    if (max_score) {
      countQuery = countQuery.lte('score', parseFloat(max_score));
    }

    const { count } = await countQuery;

    return createResponseWithId(
      {
        analyses: analyses || [],
        total: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('History fetch error:', error);
    return handleApiError(error, request);
  }
});

