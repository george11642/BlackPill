import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * Calculate correlation coefficient
 */
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
  const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * POST /api/wellness/correlations
 * Analyze correlations between wellness data and aesthetic scores
 */
export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    // Get last 30 days of analyses
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: analyses } = await supabaseAdmin
      .from('analyses')
      .select('score, breakdown, created_at')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    // Get wellness data for same period
    const { data: wellnessData } = await supabaseAdmin
      .from('user_wellness_data')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (!analyses || analyses.length < 5 || !wellnessData || wellnessData.length < 5) {
      return createResponseWithId(
        {
          correlations: [],
          message: 'Need at least 5 data points to calculate correlations',
        },
        { status: 200 },
        requestId
      );
    }

    // Match wellness data to analysis dates
    const matchedData: Array<{ analysis: any; wellness: any }> = [];
    for (const analysis of analyses) {
      const analysisDate = new Date(analysis.created_at).toISOString().split('T')[0];
      const wellness = wellnessData.find((w) => w.date === analysisDate);

      if (wellness) {
        matchedData.push({
          analysis,
          wellness,
        });
      }
    }

    if (matchedData.length < 5) {
      return createResponseWithId(
        {
          correlations: [],
          message: 'Not enough matched data points',
        },
        { status: 200 },
        requestId
      );
    }

    // Calculate correlations
    const correlations: any[] = [];

    // Sleep correlation
    const sleepHours = matchedData
      .map((d) => parseFloat(d.wellness.sleep_hours) || 0)
      .filter((h) => h > 0);
    const skinScores = matchedData
      .map((d, i) => (parseFloat(d.wellness.sleep_hours) || 0) > 0 ? parseFloat(matchedData[i].analysis.breakdown.skin) : null)
      .filter((s): s is number => s !== null);

    if (sleepHours.length >= 5 && skinScores.length >= 5) {
      const sleepCorr = calculateCorrelation(sleepHours.slice(0, skinScores.length), skinScores);
      if (Math.abs(sleepCorr) > 0.3) {
        const avgSleep = sleepHours.reduce((a, b) => a + b, 0) / sleepHours.length;
        correlations.push({
          metric_type: 'sleep',
          correlation_score: sleepCorr,
          category_affected: 'skin',
          insight_text:
            sleepCorr > 0
              ? `Your skin score is ${(sleepCorr * 100).toFixed(0)}% higher on days you sleep ${avgSleep >= 7.5 ? '7.5+' : 'more'} hours`
              : `Your skin score decreases when sleep is insufficient`,
          confidence: Math.min(Math.abs(sleepCorr), 0.9),
        });
      }
    }

    // Hydration correlation
    const hydrationOunces = matchedData
      .map((d) => parseFloat(d.wellness.hydration_ounces) || 0)
      .filter((h) => h > 0);
    const hydrationSkinScores = matchedData
      .map((d, i) => (parseFloat(d.wellness.hydration_ounces) || 0) > 0 ? parseFloat(matchedData[i].analysis.breakdown.skin) : null)
      .filter((s): s is number => s !== null);

    if (hydrationOunces.length >= 5 && hydrationSkinScores.length >= 5) {
      const hydrationCorr = calculateCorrelation(
        hydrationOunces.slice(0, hydrationSkinScores.length),
        hydrationSkinScores
      );
      if (Math.abs(hydrationCorr) > 0.3) {
        correlations.push({
          metric_type: 'hydration',
          correlation_score: hydrationCorr,
          category_affected: 'skin',
          insight_text:
            hydrationCorr > 0
              ? `Your skin score improves when you drink more water`
              : `Hydration may be affecting your skin quality`,
          confidence: Math.min(Math.abs(hydrationCorr), 0.9),
        });
      }
    }

    // Exercise correlation
    const exerciseMinutes = matchedData.map((d) => d.wellness.exercise_minutes || 0).filter((m) => m > 0);
    const overallScores = matchedData
      .map((d, i) => (d.wellness.exercise_minutes || 0) > 0 ? parseFloat(matchedData[i].analysis.score) : null)
      .filter((s): s is number => s !== null);

    if (exerciseMinutes.length >= 5 && overallScores.length >= 5) {
      const exerciseCorr = calculateCorrelation(
        exerciseMinutes.slice(0, overallScores.length),
        overallScores
      );
      if (Math.abs(exerciseCorr) > 0.3) {
        correlations.push({
          metric_type: 'exercise',
          correlation_score: exerciseCorr,
          category_affected: 'overall',
          insight_text:
            exerciseCorr > 0
              ? `Your overall score is ${(exerciseCorr * 100).toFixed(0)}% higher on days you exercise`
              : `Exercise may be impacting your appearance scores`,
          confidence: Math.min(Math.abs(exerciseCorr), 0.9),
        });
      }
    }

    // Save correlations
    const savedCorrelations = [];
    for (const corr of correlations) {
      const { data: saved, error } = await supabaseAdmin
        .from('wellness_correlations')
        .upsert(
          {
            user_id: user.id,
            metric_type: corr.metric_type,
            correlation_score: corr.correlation_score,
            category_affected: corr.category_affected,
            insight_text: corr.insight_text,
            confidence: corr.confidence,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,metric_type',
          }
        )
        .select()
        .single();

      if (!error && saved) {
        savedCorrelations.push(saved);
      }
    }

    return createResponseWithId(
      {
        correlations: savedCorrelations,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Calculate correlations error:', error);
    return handleApiError(error, request);
  }
});

