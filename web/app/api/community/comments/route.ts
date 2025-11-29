
import {
  withAuth,
  supabaseAdmin,
  handleApiError,
  getRequestId,
  createResponseWithId,
  moderateContent,
} from '@/lib';

/**
 * GET /api/community/comments?analysis_id=xxx
 * POST /api/community/comments
 *
 * Get or post comments on analyses
 */
export const GET = async (request: Request) => {
  const requestId = getRequestId(request);

  try {
    const { searchParams } = new URL(request.url);
    const analysis_id = searchParams.get('analysis_id');

    if (!analysis_id) {
      return createResponseWithId(
        {
          error: 'analysis_id required',
        },
        { status: 400 },
        requestId
      );
    }

    const { data: comments, error } = await supabaseAdmin
      .from('comments')
      .select(
        `
        *,
        users(username, avatar_url)
      `
      )
      .eq('analysis_id', analysis_id)
      .is('deleted_at', null)
      .eq('is_flagged', false)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return createResponseWithId(
      {
        comments: comments || [],
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Get comments error:', error);
    return handleApiError(error, request);
  }
};

export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const { analysis_id, content, parent_id } = body;

    if (!analysis_id || !content) {
      return createResponseWithId(
        {
          error: 'analysis_id and content required',
        },
        { status: 400 },
        requestId
      );
    }

    // Check if analysis exists and is public
    const { data: analysis } = await supabaseAdmin
      .from('analyses')
      .select('is_public')
      .eq('id', analysis_id)
      .maybeSingle();

    if (!analysis || !analysis.is_public) {
      return createResponseWithId(
        {
          error: 'Cannot comment on private analysis',
        },
        { status: 403 },
        requestId
      );
    }

    // Moderate content using OpenAI Moderation API
    const moderationResult = await moderateContent(content);

    if (moderationResult.flagged) {
      return createResponseWithId(
        {
          error: 'Comment contains inappropriate content',
          message: 'Your comment was flagged for: ' + moderationResult.categories.join(', '),
        },
        { status: 400 },
        requestId
      );
    }

    // Create comment
    const { data: comment, error } = await supabaseAdmin
      .from('comments')
      .insert({
        analysis_id,
        user_id: user.id,
        content,
        parent_id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return createResponseWithId(comment, { status: 201 }, requestId);
  } catch (error) {
    console.error('Post comment error:', error);
    return handleApiError(error, request);
  }
});

