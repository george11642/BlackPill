const { createRateLimiter } = require('../../middleware/rate-limit');
const { supabaseAdmin } = require('../../utils/supabase');
const { cacheMiddleware } = require('../../utils/cache');

/**
 * GET /api/leaderboard
 * Get score leaderboard (weekly or all-time)
 * Cached for 15 minutes as per PRD Section 4.4
 */
module.exports = async (req, res) => {
  // Apply caching first (15 minutes = 900 seconds)
  await cacheMiddleware(900)(req, res, async () => {
    await createRateLimiter('leaderboard')(req, res, async () => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;
      const filter = req.query.filter || 'this_week'; // this_week, all_time, by_location

      let query = supabaseAdmin
        .from('analyses')
        .select(`
          user_id,
          score,
          created_at,
          users!inner (
            username,
            avatar_url,
            location
          )
        `)
        .eq('is_public', true)
        .is('deleted_at', null);

      // Apply filter
      if (filter === 'this_week') {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        query = query.gte('created_at', weekStart.toISOString());
      }

      // Get data
      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Group by user and get highest score
      const userScores = {};
      data?.forEach(analysis => {
        const userId = analysis.user_id;
        if (!userScores[userId] || analysis.score > userScores[userId].score) {
          userScores[userId] = {
            user_id: userId,
            score: analysis.score,
            username: analysis.users.username || 'Anonymous',
            avatar_url: analysis.users.avatar_url,
            location: analysis.users.location,
            created_at: analysis.created_at,
          };
        }
      });

      // Convert to array and sort
      const leaderboard = Object.values(userScores)
        .sort((a, b) => {
          // Sort by score descending
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          // Tie-breaker: earliest timestamp
          return new Date(a.created_at) - new Date(b.created_at);
        })
        .slice(offset, offset + limit)
        .map((item, index) => ({
          rank: offset + index + 1,
          user_id: item.user_id,
          username: item.username,
          avatar_url: item.avatar_url,
          location: item.location,
          score: item.score,
        }));

      res.status(200).json({ leaderboard });

    } catch (error) {
      console.error('Get leaderboard error:', error);
      res.status(500).json({
        error: 'Failed to get leaderboard',
        message: error.message,
      });
    }
    });
  });
};

