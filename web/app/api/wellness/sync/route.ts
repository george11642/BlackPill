import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * POST /api/wellness/sync
 * Sync wellness data from wearables (Apple Health, Google Fit)
 */
export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const {
      date,
      sleep_hours,
      sleep_quality,
      sleep_source,
      hydration_ounces,
      hydration_goal,
      hydration_source,
      hrv,
      resting_hr,
      stress_level,
      stress_source,
      exercise_minutes,
      exercise_intensity,
      exercise_type,
      exercise_calories,
      exercise_source,
      calories_consumed,
      protein_grams,
      water_intake,
      nutrition_source,
    } = body;

    if (!date) {
      return createResponseWithId(
        {
          error: 'Invalid request',
          message: 'date is required',
        },
        { status: 400 },
        requestId
      );
    }

    // Upsert wellness data
    const { data: wellnessData, error } = await supabaseAdmin
      .from('user_wellness_data')
      .upsert(
        {
          user_id: user.id,
          date: date,
          sleep_hours: sleep_hours || null,
          sleep_quality: sleep_quality || null,
          sleep_source: sleep_source || null,
          hydration_ounces: hydration_ounces || null,
          hydration_goal: hydration_goal || null,
          hydration_source: hydration_source || null,
          hrv: hrv || null,
          resting_hr: resting_hr || null,
          stress_level: stress_level || null,
          stress_source: stress_source || null,
          exercise_minutes: exercise_minutes || null,
          exercise_intensity: exercise_intensity || null,
          exercise_type: exercise_type || null,
          exercise_calories: exercise_calories || null,
          exercise_source: exercise_source || null,
          calories_consumed: calories_consumed || null,
          protein_grams: protein_grams || null,
          water_intake: water_intake || null,
          nutrition_source: nutrition_source || null,
        },
        {
          onConflict: 'user_id,date',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Wellness sync error:', error);
      throw error;
    }

    return createResponseWithId(
      {
        wellnessData,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Sync wellness data error:', error);
    return handleApiError(error, request);
  }
});

