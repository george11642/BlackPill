import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * GET /api/ai-coach/conversations
 * Get user's AI conversations
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const { data: conversations, error } = await supabaseAdmin
      .from('ai_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return createResponseWithId(
      {
        conversations: conversations || [],
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Get conversations error:', error);
    return handleApiError(error, request);
  }
});

