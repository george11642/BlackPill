const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * POST /api/products/click
 * Track product link click
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;
      const { productId, analysisId } = req.body;

      if (!productId) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'productId is required',
        });
      }

      // Verify product exists
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (productError || !product) {
        return res.status(404).json({
          error: 'Product not found',
        });
      }

      // Record click
      const { data: click, error: clickError } = await supabaseAdmin
        .from('product_clicks')
        .insert({
          product_id: productId,
          user_id: userId,
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
        .single();

      return res.status(200).json({
        click,
        affiliate_link: fullProduct?.affiliate_link,
      });
    } catch (error) {
      console.error('Product click error:', error);
      return res.status(500).json({
        error: 'Failed to track click',
        message: error.message,
      });
    }
  });
};

