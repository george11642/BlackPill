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
    let conversationId = searchParams.get('conversationId');

    // If no conversationId provided, get user's most recent conversation
    if (!conversationId) {
      const { data: recentConversation } = await supabaseAdmin
        .from('ai_conversations')
        .select('id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentConversation) {
        conversationId = recentConversation.id;
      } else {
        // No conversation exists, return empty array
        return createResponseWithId(
          {
            messages: [],
          },
          { status: 200 },
          requestId
        );
      }
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

