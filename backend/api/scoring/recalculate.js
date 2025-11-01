const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * POST /api/scoring/recalculate
 * Recalculate score with custom weights
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;
      const { analysisId, customWeights } = req.body;

      if (!analysisId) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'analysisId is required',
        });
      }

      // Get original analysis
      const { data: analysis, error: analysisError } = await supabaseAdmin
        .from('analyses')
        .select('score, breakdown')
        .eq('id', analysisId)
        .eq('user_id', userId)
        .single();

      if (analysisError || !analysis) {
        return res.status(404).json({
          error: 'Analysis not found',
          message: 'The specified analysis does not exist or you do not have access to it',
        });
      }

      // Use custom weights or default weights
      const weights = customWeights || {
        symmetry: 20,
        skin: 20,
        jawline: 15,
        eyes: 15,
        lips: 15,
        bone_structure: 15,
      };

      // Validate weights sum to 100
      const total = Object.values(weights).reduce((sum, val) => sum + val, 0);
      if (total !== 100) {
        return res.status(400).json({
          error: 'Invalid weights',
          message: `Weights must sum to 100, got ${total}`,
        });
      }

      // Map category names (handle variations)
      const categoryMap = {
        symmetry: 'symmetry',
        skin: 'skin',
        jawline: 'jawline',
        eyes: 'eyes',
        lips: 'lips',
        bone_structure: 'bone_structure',
        boneStructure: 'bone_structure',
      };

      // Recalculate with custom weights
      const breakdown = analysis.breakdown;
      let newScore = 0;

      for (const [category, score] of Object.entries(breakdown)) {
        const mappedCategory = categoryMap[category] || category;
        const weight = weights[mappedCategory] || weights[category] || 0;
        newScore += parseFloat(score) * (weight / 100);
      }

      const originalScore = parseFloat(analysis.score);
      const delta = newScore - originalScore;

      return res.status(200).json({
        originalScore,
        customScore: parseFloat(newScore.toFixed(2)),
        delta: parseFloat(delta.toFixed(2)),
        breakdown: breakdown,
        weights: weights,
      });
    } catch (error) {
      console.error('Recalculate score error:', error);
      return res.status(500).json({
        error: 'Failed to recalculate score',
        message: error.message,
      });
    }
  });
};

