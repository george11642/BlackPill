import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * GET /api/products
 * List products with filtering and recommendations
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const recommended_for = searchParams.get('recommended_for');
    const featured = searchParams.get('featured');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    if (recommended_for) {
      query = query.contains('recommended_for', [recommended_for]);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Products fetch error:', error);
      throw error;
    }

    return createResponseWithId(
      {
        products: products || [],
        total: products?.length || 0,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('List products error:', error);
    return handleApiError(error, request);
  }
});

