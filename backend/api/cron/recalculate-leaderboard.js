const { supabaseAdmin } = require('../../utils/supabase');

/**
 * Cron job to recalculate weekly leaderboard
 * Should run every Sunday at 00:00 UTC as per PRD Section 3.2, F7
 * 
 * Configure in Vercel:
 * vercel.json: {
 *   "crons": [{
 *     "path": "/api/cron/recalculate-leaderboard",
 *     "schedule": "0 0 * * 0"
 *   }]
 * }
 */
module.exports = async (req, res) => {
  try {
    // Verify this is from Vercel cron
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get start of current week (Sunday 00:00)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Go to Sunday
    weekStart.setHours(0, 0, 0, 0);

    console.log(`Recalculating leaderboard for week starting: ${weekStart.toISOString()}`);

    // Get all public analyses from this week
    const { data: analyses, error } = await supabaseAdmin
      .from('analyses')
      .select(`
        user_id,
        score,
        created_at,
        users!inner(username)
      `)
      .eq('is_public', true)
      .is('deleted_at', null)
      .is('users.deleted_at', null)
      .gte('created_at', weekStart.toISOString());

    if (error) {
      throw error;
    }

    if (!analyses || analyses.length === 0) {
      console.log('No analyses found for this week');
      return res.status(200).json({
        success: true,
        week_starting: weekStart.toISOString(),
        rankings_created: 0,
      });
    }

    // Group by user and get highest score
    const userScores = {};
    analyses.forEach((analysis) => {
      const userId = analysis.user_id;
      
      // Skip users without username (required for leaderboard participation)
      if (!analysis.users?.username) {
        return;
      }

      if (!userScores[userId] || 
          analysis.score > userScores[userId].score ||
          (analysis.score === userScores[userId].score && 
           new Date(analysis.created_at) < new Date(userScores[userId].created_at))) {
        userScores[userId] = {
          user_id: userId,
          score: analysis.score,
          created_at: analysis.created_at,
        };
      }
    });

    // Sort by score DESC, then by earliest timestamp
    const sortedUsers = Object.values(userScores).sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(a.created_at) - new Date(b.created_at);
    });

    // Clear existing rankings for this week
    await supabaseAdmin
      .from('leaderboard_weekly')
      .delete()
      .eq('week_starting', weekStart.toISOString().split('T')[0]);

    // Insert new rankings
    const rankings = sortedUsers.map((user, index) => ({
      user_id: user.user_id,
      score: user.score,
      rank: index + 1,
      week_starting: weekStart.toISOString().split('T')[0],
    }));

    const { error: insertError } = await supabaseAdmin
      .from('leaderboard_weekly')
      .insert(rankings);

    if (insertError) {
      throw insertError;
    }

    console.log(`Successfully created ${rankings.length} leaderboard entries`);

    res.status(200).json({
      success: true,
      week_starting: weekStart.toISOString(),
      rankings_created: rankings.length,
    });

  } catch (error) {
    console.error('Leaderboard recalculation error:', error);
    res.status(500).json({
      error: 'Cron job failed',
      message: error.message,
    });
  }
};

