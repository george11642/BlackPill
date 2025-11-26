import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * GET /api/ai-coach/messages
 * Get messages for a conversation
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return createResponseWithId(
        {
          error: 'Invalid request',
          message: 'conversationId is required',
        },
        { status: 400 },
        requestId
      );
    }

    // Verify conversation belongs to user
    const { data: conversation } = await supabaseAdmin
      .from('ai_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!conversation) {
      return createResponseWithId(
        {
          error: 'Unauthorized',
        },
        { status: 403 },
        requestId
      );
    }

    // Get messages
    const { data: messages, error } = await supabaseAdmin
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return createResponseWithId(
      {
        messages: messages || [],
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Get messages error:', error);
    return handleApiError(error, request);
  }
});

