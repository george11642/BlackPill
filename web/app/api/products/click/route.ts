
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * POST /api/products/click
 * Track product link click
 */
export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const { productId, analysisId } = body;

    if (!productId) {
      return createResponseWithId(
        {
          error: 'Invalid request',
          message: 'productId is required',
        },
        { status: 400 },
        requestId
      );
    }

    // Verify product exists
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('is_active', true)
      .maybeSingle();

    if (productError || !product) {
      return createResponseWithId(
        {
          error: 'Product not found',
        },
        { status: 404 },
        requestId
      );
    }

    // Record click
    const { data: click, error: clickError } = await supabaseAdmin
      .from('product_clicks')
      .insert({
        product_id: productId,
        user_id: user.id,
        analysis_id: analysisId || null,
      })
      .select()
      .single();

    if (clickError) {
      console.error('Click tracking error:', clickError);
      throw clickError;
    }

    // Get product with affiliate link
    const { data: fullProduct } = await supabaseAdmin
      .from('products')
      .select('affiliate_link')
      .eq('id', productId)
      .maybeSingle();

    return createResponseWithId(
      {
        click,
        affiliate_link: fullProduct?.affiliate_link,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Product click error:', error);
    return handleApiError(error, request);
  }
});

