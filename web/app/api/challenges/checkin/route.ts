
import {
  withAuth,
  supabaseAdmin,
  handleApiError,
  getRequestId,
  createResponseWithId,
} from '@/lib';

/**
 * POST /api/challenges/checkin
 * Submit a challenge check-in photo
 */
export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const { participationId, day, photoUrl, verificationData, notes } = body;

    if (!participationId || !day || !photoUrl) {
      return createResponseWithId(
        {
          error: 'Invalid request',
          message: 'participationId, day, and photoUrl are required',
        },
        { status: 400 },
        requestId
      );
    }

    // Verify participation belongs to user
    const { data: participation, error: participationError } = await supabaseAdmin
      .from('challenge_participations')
      .select('challenge_id, current_day, calibration_photo_url')
      .eq('id', participationId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (participationError || !participation) {
      return createResponseWithId(
        {
          error: 'Participation not found',
        },
        { status: 404 },
        requestId
      );
    }

    // Photo verification - use client-side verification data
    const photoVerified = verificationData
      ? verificationData.lighting === 'good' &&
        verificationData.angle === 'good' &&
        verificationData.distance === 'good'
      : false;

    // Create check-in with verification data
    const verificationDataToStore = verificationData || {};

    const { data: checkin, error: checkinError } = await supabaseAdmin
      .from('challenge_checkins')
      .insert({
        participation_id: participationId,
        day: parseInt(day),
        photo_url: photoUrl,
        photo_verified: photoVerified,
        verification_data: verificationDataToStore,
        notes: notes || null,
      })
      .select()
      .single();

    if (checkinError) {
      console.error('Check-in creation error:', checkinError);
      throw checkinError;
    }

    // Update participation current_day if this is the next day
    if (parseInt(day) >= participation.current_day) {
      await supabaseAdmin
        .from('challenge_participations')
        .update({ current_day: parseInt(day) + 1 })
        .eq('id', participationId);
    }

    return createResponseWithId(
      {
        checkin,
        verification: {
          verified: photoVerified,
          data: verificationDataToStore,
        },
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Challenge check-in error:', error);
    return handleApiError(error, request);
  }
});

