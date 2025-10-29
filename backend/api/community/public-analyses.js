const { createRateLimiter } = require('../../middleware/rate-limit');
const { supabaseAdmin } = require('../../utils/supabase');
const { cacheMiddleware } = require('../../utils/cache');

/**
 * GET /api/community/public-analyses
 * Get public analyses for community feed
 * Cached for 5 minutes
 */
module.exports = async (req, res) => {
  // Apply caching (5 minutes = 300 seconds)
  await cacheMiddleware(300)(req, res, async () => {
    await createRateLimiter('community')(req, res, async () => {
      try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        // Get public analyses with user info
        const { data: analyses, error, count } = await supabaseAdmin
          .from('analyses')
          .select(`
            id,
            score,
            breakdown,
            image_thumbnail_url,
            like_count,
            view_count,
            created_at,
            users!inner (
              id,
              username,
              avatar_url
            )
          `, { count: 'exact' })
          .eq('is_public', true)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) {
          throw error;
        }

        res.status(200).json({
          analyses: analyses || [],
          total: count || 0,
          limit,
          offset,
        });
      } catch (error) {
        console.error('Get public analyses error:', error);
        res.status(500).json({
          error: 'Failed to get public analyses',
          message: error.message,
        });
      }
    });
  });
};

