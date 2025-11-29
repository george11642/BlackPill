import { NextResponse } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * POST /api/user/onboarding
 * Save onboarding data and mark onboarding as completed
 */
export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const { username, avatarUri, goals } = body;

    // Prepare update data
    const updateData: Record<string, any> = {
      onboarding_completed: true,
      onboarding_goals: goals || [],
    };

    // Only update username if provided and not empty
    if (username && username.trim()) {
      // Check if username is already taken
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('username', username.trim())
        .neq('id', user.id)
        .single();

      if (existingUser) {
        return createResponseWithId(
          { error: 'Username is already taken' },
          { status: 400 },
          requestId
        );
      }

      updateData.username = username.trim();
    }

    // Handle avatar upload if provided
    if (avatarUri && avatarUri.startsWith('file://') || avatarUri?.startsWith('blob:')) {
      // Avatar will be uploaded separately via a different endpoint
      // For now, we just note that we need to handle this
      console.log('[Onboarding] Avatar URI provided, would need separate upload:', avatarUri?.substring(0, 50));
    }

    // Update user record
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('[Onboarding] Failed to update user:', updateError);
      throw updateError;
    }

    console.log(`[Onboarding] Completed for user ${user.id}, goals: ${goals?.join(', ')}`);

    return createResponseWithId(
      { 
        success: true,
        message: 'Onboarding completed successfully',
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('[Onboarding] Error:', error);
    return handleApiError(error, request);
  }
});

/**
 * GET /api/user/onboarding
 * Check onboarding status
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('onboarding_completed, onboarding_goals')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('[Onboarding] Failed to fetch user:', error);
      throw error;
    }

    return createResponseWithId(
      {
        onboarding_completed: userData?.onboarding_completed || false,
        onboarding_goals: userData?.onboarding_goals || [],
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('[Onboarding] Error:', error);
    return handleApiError(error, request);
  }
});

