const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * Calculate breakdown deltas between two analyses
 */
function calculateBreakdownDeltas(beforeBreakdown, afterBreakdown) {
  const deltas = {};
  for (const [key, value] of Object.entries(afterBreakdown)) {
    const beforeValue = beforeBreakdown[key] || 0;
    deltas[key] = {
      before: beforeValue,
      after: value,
      delta: value - beforeValue,
      percentChange: beforeValue > 0
        ? (((value / beforeValue) - 1) * 100).toFixed(1)
        : '0.0',
    };
  }
  return deltas;
}

/**
 * GET /api/comparisons/compare
 * Compare two analyses
 */
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const { beforeId, afterId } = req.query;
      const userId = req.user.id;

      if (!beforeId || !afterId) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'beforeId and afterId are required',
        });
      }

      // Get both analyses
      const { data: analyses, error: analysesError } = await supabaseAdmin
        .from('analyses')
        .select('*')
        .in('id', [beforeId, afterId])
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (analysesError || !analyses || analyses.length !== 2) {
        return res.status(404).json({
          error: 'Analyses not found',
          message: 'Both analyses must exist and belong to you',
        });
      }

      // Determine which is before and which is after
      const beforeAnalysis = analyses.find((a) => a.id === beforeId);
      const afterAnalysis = analyses.find((a) => a.id === afterId);

      if (!beforeAnalysis || !afterAnalysis) {
        return res.status(404).json({
          error: 'Analysis not found',
        });
      }

      // Ensure chronological order
      if (new Date(beforeAnalysis.created_at) > new Date(afterAnalysis.created_at)) {
        [beforeAnalysis, afterAnalysis] = [afterAnalysis, beforeAnalysis];
      }

      const daysBetween = Math.floor(
        (new Date(afterAnalysis.created_at) - new Date(beforeAnalysis.created_at)) /
        (1000 * 60 * 60 * 24)
      );

      const breakdownDeltas = calculateBreakdownDeltas(
        beforeAnalysis.breakdown,
        afterAnalysis.breakdown
      );

      // Get active routine during this period (if any)
      const { data: routines } = await supabaseAdmin
        .from('routines')
        .select('id, name')
        .eq('user_id', userId)
        .eq('is_active', true)
        .lte('created_at', afterAnalysis.created_at)
        .gte('created_at', beforeAnalysis.created_at);

      let routineCompliance = null;
      if (routines && routines.length > 0) {
        // Calculate average compliance
        const { data: completions } = await supabaseAdmin
          .from('routine_completions')
          .select('completed_at')
          .eq('user_id', userId)
          .gte('completed_at', beforeAnalysis.created_at)
          .lte('completed_at', afterAnalysis.created_at);

        if (completions && completions.length > 0) {
          const totalDays = Math.max(daysBetween, 1);
          const completedDays = new Set(
            completions.map((c) =>
              new Date(c.completed_at).toISOString().split('T')[0]
            )
          ).size;

          routineCompliance = ((completedDays / totalDays) * 100).toFixed(0);
        }
      }

      // Calculate improvements and declines
      const improvements = Object.entries(breakdownDeltas)
        .filter(([key, data]) => data.delta > 0)
        .map(([key, data]) => ({
          category: key,
          ...data,
        }));

      const declines = Object.entries(breakdownDeltas)
        .filter(([key, data]) => data.delta < 0)
        .map(([key, data]) => ({
          category: key,
          ...data,
        }));

      const scoreDelta = afterAnalysis.score - beforeAnalysis.score;
      const percentChange = beforeAnalysis.score > 0
        ? (((afterAnalysis.score / beforeAnalysis.score) - 1) * 100).toFixed(1)
        : '0.0';

      return res.status(200).json({
        comparison: {
          before_id: beforeAnalysis.id,
          after_id: afterAnalysis.id,
          before_image: beforeAnalysis.image_url,
          before_thumbnail: beforeAnalysis.image_thumbnail_url,
          before_score: beforeAnalysis.score,
          before_breakdown: beforeAnalysis.breakdown,
          before_date: beforeAnalysis.created_at,
          after_image: afterAnalysis.image_url,
          after_thumbnail: afterAnalysis.image_thumbnail_url,
          after_score: afterAnalysis.score,
          after_breakdown: afterAnalysis.breakdown,
          after_date: afterAnalysis.created_at,
          score_delta: scoreDelta,
          days_between: daysBetween,
          percent_change: percentChange,
          breakdownDeltas,
          routineCompliance,
          improvements,
          declines,
        },
      });
    } catch (error) {
      console.error('Comparison error:', error);
      return res.status(500).json({
        error: 'Failed to generate comparison',
        message: error.message,
      });
    }
  });
};

