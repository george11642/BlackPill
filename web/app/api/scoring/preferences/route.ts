import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

// Default weights and methodology
const DEFAULT_METHODOLOGY = {
  symmetry: {
    weight: 20,
    adjustableRange: [15, 25],
    factors: [
      'Face horizontal symmetry (left/right)',
      'Eye alignment and spacing',
      'Nose centering',
      'Mouth symmetry',
    ],
    measurement: 'Facial landmark analysis (68 points)',
    scientificBasis: 'Studies show <5% deviation is ideal (Rhodes et al., 2007)',
  },
  skin: {
    weight: 20,
    adjustableRange: [15, 25],
    factors: ['Texture uniformity', 'Blemish detection', 'Under-eye darkness', 'Overall complexion'],
    measurement: 'Computer vision texture analysis',
    scientificBasis: 'Clear skin correlates with health perception (Fink et al., 2012)',
  },
  jawline: {
    weight: 15,
    adjustableRange: [10, 20],
    factors: [
      'Jaw angle and definition',
      'Chin prominence',
      'Facial width-to-height ratio',
      'Mandible structure',
    ],
    measurement: 'Geometric facial analysis',
    scientificBasis: 'Strong jawline associated with masculinity and health (Fink et al., 2005)',
  },
  eyes: {
    weight: 15,
    adjustableRange: [10, 20],
    factors: [
      'Eye spacing (interpupillary distance)',
      'Eye size and shape',
      'Brow position',
      'Eyelid symmetry',
    ],
    measurement: 'Facial landmark ratios',
    scientificBasis: 'Eye spacing and size contribute to facial attractiveness (Langlois et al., 2000)',
  },
  lips: {
    weight: 15,
    adjustableRange: [10, 20],
    factors: [
      'Lip fullness and symmetry',
      'Lip-to-nose ratio',
      "Cupid's bow definition",
      'Lip color and texture',
    ],
    measurement: 'Facial proportion analysis',
    scientificBasis: 'Fuller lips associated with youth and attractiveness (Fink et al., 2006)',
  },
  bone_structure: {
    weight: 15,
    adjustableRange: [10, 20],
    factors: [
      'Cheekbone prominence',
      'Forehead width and height',
      'Facial harmony and proportions',
      'Overall bone structure balance',
    ],
    measurement: '3D facial structure analysis',
    scientificBasis: 'Facial bone structure contributes to perceived attractiveness (Rhodes, 2006)',
  },
};

/**
 * GET /api/scoring/preferences
 * Get user's scoring preferences and methodology
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    // Get user preferences or return defaults
    const { data: prefs, error } = await supabaseAdmin
      .from('user_scoring_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" - which is fine, we'll return defaults
      console.error('Preferences fetch error:', error);
      throw error;
    }

    // Convert database format to API format
    const preferences = prefs
      ? {
          symmetry_weight: prefs.symmetry_weight,
          skin_weight: prefs.skin_weight,
          jawline_weight: prefs.jawline_weight,
          eyes_weight: prefs.eyes_weight,
          lips_weight: prefs.lips_weight,
          bone_structure_weight: prefs.bone_structure_weight,
        }
      : null;

    return createResponseWithId(
      {
        preferences,
        methodology: DEFAULT_METHODOLOGY,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Get scoring preferences error:', error);
    return handleApiError(error, request);
  }
});

/**
 * PUT /api/scoring/preferences
 * Update user's scoring preferences
 */
export const PUT = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const {
      symmetry_weight,
      skin_weight,
      jawline_weight,
      eyes_weight,
      lips_weight,
      bone_structure_weight,
    } = body;

    // Validate all weights are provided
    const weights = {
      symmetry_weight: symmetry_weight ?? 20,
      skin_weight: skin_weight ?? 20,
      jawline_weight: jawline_weight ?? 15,
      eyes_weight: eyes_weight ?? 15,
      lips_weight: lips_weight ?? 15,
      bone_structure_weight: bone_structure_weight ?? 15,
    };

    // Validate total = 100
    const total = Object.values(weights).reduce((sum, val) => sum + val, 0);
    if (total !== 100) {
      return createResponseWithId(
        {
          error: 'Invalid weights',
          message: `Weights must sum to 100, got ${total}`,
        },
        { status: 400 },
        requestId
      );
    }

    // Validate ranges
    if (
      weights.symmetry_weight < 15 ||
      weights.symmetry_weight > 25 ||
      weights.skin_weight < 15 ||
      weights.skin_weight > 25
    ) {
      return createResponseWithId(
        {
          error: 'Invalid weight range',
          message: 'Symmetry and skin weights must be between 15 and 25',
        },
        { status: 400 },
        requestId
      );
    }

    if (
      weights.jawline_weight < 10 ||
      weights.jawline_weight > 20 ||
      weights.eyes_weight < 10 ||
      weights.eyes_weight > 20 ||
      weights.lips_weight < 10 ||
      weights.lips_weight > 20 ||
      weights.bone_structure_weight < 10 ||
      weights.bone_structure_weight > 20
    ) {
      return createResponseWithId(
        {
          error: 'Invalid weight range',
          message: 'Other category weights must be between 10 and 20',
        },
        { status: 400 },
        requestId
      );
    }

    // Upsert preferences
    const { data, error } = await supabaseAdmin
      .from('user_scoring_preferences')
      .upsert(
        {
          user_id: user.id,
          ...weights,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Preferences update error:', error);
      throw error;
    }

    return createResponseWithId(
      {
        preferences: data,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Update scoring preferences error:', error);
    return handleApiError(error, request);
  }
});

