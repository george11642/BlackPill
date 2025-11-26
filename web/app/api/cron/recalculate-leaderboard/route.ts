import { Request } from 'next/server';
import { supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * Cron job to recalculate weekly leaderboard
 * Should run every Sunday at 00:00 UTC
 *
 * Scheduled via Supabase pg_cron (runs weekly on Sunday at 00:00 UTC)
 * The job is configured in migration 022_setup_supabase_cron_jobs.sql
 */
export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    // Verify this is from Supabase cron (via pg_net) - required
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;
    
    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return createResponseWithId(
        {
          error: 'Unauthorized',
        },
        { status: 401 },
        requestId
      );
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
      .select(
        `
        user_id,
        score,
        created_at,
        users!inner(username)
      `
      )
      .eq('is_public', true)
      .is('deleted_at', null)
      .is('users.deleted_at', null)
      .gte('created_at', weekStart.toISOString());

    if (error) {
      throw error;
    }

    if (!analyses || analyses.length === 0) {
      console.log('No analyses found for this week');
      return createResponseWithId(
        {
          success: true,
          week_starting: weekStart.toISOString(),
          rankings_created: 0,
        },
        { status: 200 },
        requestId
      );
    }

    // Group by user and get highest score
    const userScores: Record<
      string,
      { user_id: string; score: number; created_at: string }
    > = {};
    analyses.forEach((analysis) => {
      const userId = analysis.user_id;

      // Skip users without username (required for leaderboard participation)
      if (!(analysis.users as any)?.username) {
        return;
      }

      if (
        !userScores[userId] ||
        analysis.score > userScores[userId].score ||
        (analysis.score === userScores[userId].score &&
          new Date(analysis.created_at) < new Date(userScores[userId].created_at))
      ) {
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
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
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

    const { error: insertError } = await supabaseAdmin.from('leaderboard_weekly').insert(rankings);

    if (insertError) {
      throw insertError;
    }

    console.log(`Successfully created ${rankings.length} leaderboard entries`);

    return createResponseWithId(
      {
        success: true,
        week_starting: weekStart.toISOString(),
        rankings_created: rankings.length,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Leaderboard recalculation error:', error);
    return handleApiError(error, request);
  }
}

