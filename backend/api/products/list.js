const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * GET /api/products
 * List products with filtering and recommendations
 */
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const { category, recommended_for, featured, limit = 50, offset = 0 } = req.query;

      let query = supabaseAdmin
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

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

      return res.status(200).json({
        products: products || [],
        total: products?.length || 0,
      });
    } catch (error) {
      console.error('List products error:', error);
      return res.status(500).json({
        error: 'Failed to fetch products',
        message: error.message,
      });
    }
  });
};

