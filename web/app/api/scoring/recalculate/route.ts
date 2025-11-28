import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * POST /api/scoring/recalculate
 * Recalculate score with custom weights
 */
export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const { analysisId, customWeights } = body;

    if (!analysisId) {
      return createResponseWithId(
        {
          error: 'Invalid request',
          message: 'analysisId is required',
        },
        { status: 400 },
        requestId
      );
    }

    // Get original analysis
    const { data: analysis, error: analysisError } = await supabaseAdmin
      .from('analyses')
      .select('score, breakdown')
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (analysisError || !analysis) {
      return createResponseWithId(
        {
          error: 'Analysis not found',
          message: 'The specified analysis does not exist or you do not have access to it',
        },
        { status: 404 },
        requestId
      );
    }

    // Use custom weights or default weights
    const weights = customWeights || {
      symmetry: 18,
      skin: 18,
      jawline: 13,
      eyes: 13,
      lips: 13,
      bone_structure: 13,
      hair: 12,
    };

    // Validate weights sum to 100
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

    // Map category names (handle variations)
    const categoryMap: Record<string, string> = {
      symmetry: 'symmetry',
      skin: 'skin',
      jawline: 'jawline',
      eyes: 'eyes',
      lips: 'lips',
      bone_structure: 'bone_structure',
      boneStructure: 'bone_structure',
      hair: 'hair',
    };

    // Recalculate with custom weights
    const breakdown = analysis.breakdown;
    let newScore = 0;

    for (const [category, score] of Object.entries(breakdown)) {
      const mappedCategory = categoryMap[category] || category;
      const weight = (weights as Record<string, number>)[mappedCategory] || (weights as Record<string, number>)[category] || 0;
      newScore += parseFloat(score as string) * (weight / 100);
    }

    const originalScore = parseFloat(analysis.score);
    const delta = newScore - originalScore;

    return createResponseWithId(
      {
        originalScore,
        customScore: parseFloat(newScore.toFixed(2)),
        delta: parseFloat(delta.toFixed(2)),
        breakdown: breakdown,
        weights: weights,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Recalculate score error:', error);
    return handleApiError(error, request);
  }
});

