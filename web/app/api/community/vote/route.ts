
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * POST /api/community/vote
 * Upvote or downvote an analysis or comment
 */
export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const { voteable_type, voteable_id, vote_type } = body;

    // Validate input
    if (!['analysis', 'comment'].includes(voteable_type)) {
      return createResponseWithId(
        {
          error: 'Invalid voteable_type',
        },
        { status: 400 },
        requestId
      );
    }

    if (!['upvote', 'downvote'].includes(vote_type)) {
      return createResponseWithId(
        {
          error: 'Invalid vote_type',
        },
        { status: 400 },
        requestId
      );
    }

    // Check if user already voted
    const { data: existingVote } = await supabaseAdmin
      .from('votes')
      .select('*')
      .eq('voteable_type', voteable_type)
      .eq('voteable_id', voteable_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingVote) {
      if (existingVote.vote_type === vote_type) {
        // Remove vote (un-vote)
        await supabaseAdmin.from('votes').delete().eq('id', existingVote.id);

        return createResponseWithId(
          {
            success: true,
            action: 'removed',
          },
          { status: 200 },
          requestId
        );
      } else {
        // Update vote (change from upvote to downvote or vice versa)
        await supabaseAdmin.from('votes').update({ vote_type }).eq('id', existingVote.id);

        return createResponseWithId(
          {
            success: true,
            action: 'updated',
          },
          { status: 200 },
          requestId
        );
      }
    }

    // Create new vote
    const { data: vote, error: voteError } = await supabaseAdmin
      .from('votes')
      .insert({
        voteable_type,
        voteable_id,
        user_id: user.id,
        vote_type,
      })
      .select()
      .single();

    if (voteError) {
      throw voteError;
    }

    // Update like_count if voting on analysis
    if (voteable_type === 'analysis' && vote_type === 'upvote') {
      await supabaseAdmin.rpc('increment_like_count', {
        analysis_id: voteable_id,
      });
    }

    return createResponseWithId(
      {
        success: true,
        action: 'created',
        vote,
      },
      { status: 201 },
      requestId
    );
  } catch (error) {
    console.error('Vote error:', error);
    return handleApiError(error, request);
  }
});

