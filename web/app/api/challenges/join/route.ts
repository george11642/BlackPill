import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * POST /api/challenges/join
 * Join a challenge
 */
export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const { challengeId, calibrationPhotoUrl } = body;

    if (!challengeId) {
      return createResponseWithId(
        {
          error: 'Invalid request',
          message: 'challengeId is required',
        },
        { status: 400 },
        requestId
      );
    }

    // Verify challenge exists
    const { data: challenge, error: challengeError } = await supabaseAdmin
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .eq('is_active', true)
      .single();

    if (challengeError || !challenge) {
      return createResponseWithId(
        {
          error: 'Challenge not found',
        },
        { status: 404 },
        requestId
      );
    }

    // Check if already participating
    const { data: existing } = await supabaseAdmin
      .from('challenge_participations')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      return createResponseWithId(
        {
          error: 'Already participating',
          message: 'You are already participating in this challenge',
        },
        { status: 409 },
        requestId
      );
    }

    // Create participation
    const { data: participation, error: participationError } = await supabaseAdmin
      .from('challenge_participations')
      .insert({
        challenge_id: challengeId,
        user_id: user.id,
        calibration_photo_url: calibrationPhotoUrl || null,
        status: 'active',
        current_day: 1,
      })
      .select()
      .single();

    if (participationError) {
      console.error('Participation creation error:', participationError);
      throw participationError;
    }

    return createResponseWithId(
      {
        participation: {
          ...participation,
          challenge: challenge,
        },
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Join challenge error:', error);
    return handleApiError(error, request);
  }
});

