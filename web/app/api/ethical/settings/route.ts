import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * GET /api/ethical/settings
 * Get user's ethical settings
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    // Get user settings or return defaults
    const { data: settings, error } = await supabaseAdmin
      .from('user_ethical_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" - which is fine, we'll return defaults
      console.error('Settings fetch error:', error);
      throw error;
    }

    // Return settings or defaults
    const defaultSettings = {
      age_estimation: true,
      ethnicity_detection: false,
      body_type_inferences: true,
      advanced_features: true,
      disclaimers_acknowledged: false,
      enable_wellness_checks: true,
      check_frequency: 'weekly',
      show_resources_on_low_scores: true,
    };

    return createResponseWithId(
      {
        settings: settings || defaultSettings,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Get ethical settings error:', error);
    return handleApiError(error, request);
  }
});

/**
 * PUT /api/ethical/settings
 * Update user's ethical settings
 */
export const PUT = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const {
      age_estimation,
      ethnicity_detection,
      body_type_inferences,
      advanced_features,
      disclaimers_acknowledged,
      enable_wellness_checks,
      check_frequency,
      show_resources_on_low_scores,
    } = body;

    // Validate check_frequency if provided
    if (check_frequency && !['weekly', 'biweekly', 'monthly'].includes(check_frequency)) {
      return createResponseWithId(
        {
          error: 'Invalid check_frequency',
          message: 'Must be one of: weekly, biweekly, monthly',
        },
        { status: 400 },
        requestId
      );
    }

    // Build update object
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (age_estimation !== undefined) updates.age_estimation = age_estimation;
    if (ethnicity_detection !== undefined) updates.ethnicity_detection = ethnicity_detection;
    if (body_type_inferences !== undefined) updates.body_type_inferences = body_type_inferences;
    if (advanced_features !== undefined) updates.advanced_features = advanced_features;
    if (disclaimers_acknowledged !== undefined) updates.disclaimers_acknowledged = disclaimers_acknowledged;
    if (enable_wellness_checks !== undefined) updates.enable_wellness_checks = enable_wellness_checks;
    if (check_frequency !== undefined) updates.check_frequency = check_frequency;
    if (show_resources_on_low_scores !== undefined) updates.show_resources_on_low_scores = show_resources_on_low_scores;

    // Upsert settings
    const { data: settings, error } = await supabaseAdmin
      .from('user_ethical_settings')
      .upsert(
        {
          user_id: user.id,
          ...updates,
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Settings update error:', error);
      throw error;
    }

    return createResponseWithId(
      {
        settings,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Update ethical settings error:', error);
    return handleApiError(error, request);
  }
});

