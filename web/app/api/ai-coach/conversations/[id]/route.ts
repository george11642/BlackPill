import { NextRequest } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * DELETE /api/ai-coach/conversations/[id]
 * Delete a specific conversation and its messages
 */
export const DELETE = withAuth(async (request: NextRequest, user) => {
  const requestId = getRequestId(request);

  try {
    // Extract conversation ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const conversationId = pathParts[pathParts.length - 1];

    if (!conversationId) {
      return createResponseWithId(
        { error: 'Conversation ID is required' },
        { status: 400 },
        requestId
      );
    }

    // Verify the conversation belongs to the user
    const { data: conversation, error: fetchError } = await supabaseAdmin
      .from('ai_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !conversation) {
      return createResponseWithId(
        { error: 'Conversation not found' },
        { status: 404 },
        requestId
      );
    }

    // Delete all messages in the conversation first
    const { error: messagesError } = await supabaseAdmin
      .from('ai_messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
      throw messagesError;
    }

    // Delete the conversation
    const { error: deleteError } = await supabaseAdmin
      .from('ai_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting conversation:', deleteError);
      throw deleteError;
    }

    return createResponseWithId(
      { success: true, message: 'Conversation deleted' },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Delete conversation error:', error);
    return handleApiError(error, request);
  }
});

/**
 * GET /api/ai-coach/conversations/[id]
 * Get a specific conversation with its messages
 */
export const GET = withAuth(async (request: NextRequest, user) => {
  const requestId = getRequestId(request);

  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const conversationId = pathParts[pathParts.length - 1];

    if (!conversationId) {
      return createResponseWithId(
        { error: 'Conversation ID is required' },
        { status: 400 },
        requestId
      );
    }

    // Get conversation
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('ai_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (convError || !conversation) {
      return createResponseWithId(
        { error: 'Conversation not found' },
        { status: 404 },
        requestId
      );
    }

    // Get messages
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) {
      throw msgError;
    }

    return createResponseWithId(
      {
        conversation,
        messages: messages || [],
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Get conversation error:', error);
    return handleApiError(error, request);
  }
});

