import { NextResponse } from 'next/server';
import { withAuth, supabaseAdmin, getRequestId } from '@/lib';
import { checkLeaderboardAchievements } from '@/lib/achievements/service';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
  'Access-Control-Max-Age': '86400',
};

/**
 * OPTIONS /api/analyses/[id]/visibility - Handle CORS preflight
 */
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * PATCH /api/analyses/[id]/visibility
 * Update analysis public visibility (for leaderboard participation)
 * 
 * Body: { is_public: boolean }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req: Request, user) => {
    const requestId = getRequestId(req);
    const { id } = await params;

    try {
      const body = await req.json();
      const { is_public } = body;

      if (typeof is_public !== 'boolean') {
        return NextResponse.json(
          { error: 'is_public must be a boolean' },
          { status: 400, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
        );
      }

      // Verify the analysis belongs to the user
      const { data: analysis, error: fetchError } = await supabaseAdmin
        .from('analyses')
        .select('id, user_id, is_public')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (fetchError || !analysis) {
        return NextResponse.json(
          { error: 'Analysis not found' },
          { status: 404, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
        );
      }

      if (analysis.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Not authorized to modify this analysis' },
          { status: 403, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
        );
      }

      // If making public, check if user has a username (required for leaderboard)
      if (is_public) {
        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('username')
          .eq('id', user.id)
          .single();

        if (userError || !userData?.username) {
          return NextResponse.json(
            { 
              error: 'Username required',
              message: 'Please set a username in your profile before joining the leaderboard'
            },
            { status: 400, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
          );
        }
      }

      // Update the analysis visibility
      const { error: updateError } = await supabaseAdmin
        .from('analyses')
        .update({ 
          is_public,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      // If making public, check leaderboard rank and unlock achievements
      if (is_public) {
        try {
          // Get user's best public score
          const { data: userAnalysis } = await supabaseAdmin
            .from('analyses')
            .select('score')
            .eq('user_id', user.id)
            .eq('is_public', true)
            .is('deleted_at', null)
            .order('score', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (userAnalysis) {
            // Get all public analyses sorted by score
            const { data: allAnalyses } = await supabaseAdmin
              .from('analyses')
              .select('user_id, score')
              .eq('is_public', true)
              .is('deleted_at', null)
              .order('score', { ascending: false });

            if (allAnalyses) {
              // Group by user and get highest score per user
              const userScores: Record<string, number> = {};
              allAnalyses.forEach((a: any) => {
                if (!userScores[a.user_id] || a.score > userScores[a.user_id]) {
                  userScores[a.user_id] = a.score;
                }
              });

              // Sort users by score
              const sortedUsers = Object.entries(userScores)
                .sort(([, scoreA], [, scoreB]) => scoreB - scoreA);

              // Find user's rank
              const userRank = sortedUsers.findIndex(([userId]) => userId === user.id) + 1;

              if (userRank > 0) {
                // Check and unlock achievements (fire and forget)
                checkLeaderboardAchievements(user.id, userRank).catch((error) => {
                  console.error('Error checking leaderboard achievements:', error);
                });
              }
            }
          }
        } catch (error) {
          console.error('Error checking leaderboard achievements:', error);
          // Don't fail the request if achievement check fails
        }
      }

      return NextResponse.json(
        { 
          success: true, 
          is_public,
          message: is_public 
            ? 'Your score is now visible on the leaderboard!' 
            : 'Your score has been removed from the leaderboard'
        },
        { status: 200, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
      );
    } catch (error) {
      console.error('Update analysis visibility error:', error);
      return NextResponse.json(
        { error: 'Failed to update visibility' },
        { status: 500, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
      );
    }
  })(request);
}

