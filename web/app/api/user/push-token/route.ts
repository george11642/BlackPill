import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * POST /api/user/push-token
 * Store/update user's push notification token
 * Uses profiles.push_token (like SmileScore) instead of separate device_tokens table
 */
export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return createResponseWithId(
        {
          error: 'Missing token',
          message: 'Push notification token is required',
        },
        { status: 400 },
        requestId
      );
    }

    // Update user's push token in profiles table (like SmileScore)
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        push_token: token,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating push token:', error);
      return createResponseWithId(
        {
          error: 'Failed to store push token',
          message: error.message,
        },
        { status: 500 },
        requestId
      );
    }

    return createResponseWithId(
      {
        success: true,
        message: 'Push token stored successfully',
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Push token storage error:', error);
    return handleApiError(error, request);
  }
});

