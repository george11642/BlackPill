const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');
const OpenAI = require('openai');
const config = require('../../utils/config');

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

/**
 * POST /api/products/recommend
 * Generate AI-powered product recommendations based on analysis
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;
      const { analysisId } = req.body;

      if (!analysisId) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'analysisId is required',
        });
      }

      // Get analysis
      const { data: analysis, error: analysisError } = await supabaseAdmin
        .from('analyses')
        .select('score, breakdown')
        .eq('id', analysisId)
        .eq('user_id', userId)
        .single();

      if (analysisError || !analysis) {
        return res.status(404).json({
          error: 'Analysis not found',
        });
      }

      // Identify weak areas
      const breakdown = analysis.breakdown;
      const weakAreas = Object.entries(breakdown)
        .filter(([key, value]) => value < 7.0)
        .map(([key, value]) => ({ category: key, score: value }));

      // Get available products
      const { data: allProducts } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (!allProducts || allProducts.length === 0) {
        return res.status(200).json({
          recommendations: [],
          message: 'No products available yet',
        });
      }

      // Generate recommendations with AI
      const prompt = `Based on this facial analysis:
- Overall score: ${analysis.score}/10
- Weak areas: ${weakAreas.map((a) => `${a.category} (${a.score}/10)`).join(', ')}

Recommend 5-8 specific products from this list:
${allProducts.map((p) => `- ${p.name} (${p.category}): ${p.description || 'No description'}`).join('\n')}

For each recommendation, provide:
- product_name (exact match from list above)
- relevance_score (0.0-1.0)
- reason (why this product helps their specific issues)

Return as JSON array.`;

      const completion = await openai.chat.completions.create({
        model: config.openai.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a skincare and grooming expert. Recommend products that match the user\'s specific needs. Be honest about limitations.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      const aiRecommendations = JSON.parse(completion.choices[0].message.content);
      const recommendations = Array.isArray(aiRecommendations.recommendations)
        ? aiRecommendations.recommendations
        : aiRecommendations.recommendations
        ? [aiRecommendations.recommendations]
        : [];

      // Match products and create recommendations
      const productRecommendations = [];
      for (const rec of recommendations) {
        const product = allProducts.find(
          (p) => p.name.toLowerCase() === rec.product_name?.toLowerCase()
        );

        if (product) {
          // Insert recommendation
          const { data: recommendation, error: recError } = await supabaseAdmin
            .from('product_recommendations')
            .insert({
              analysis_id: analysisId,
              product_id: product.id,
              user_id: userId,
              relevance_score: Math.min(Math.max(parseFloat(rec.relevance_score) || 0.5, 0), 1),
              reason: rec.reason || 'Recommended based on your analysis',
            })
            .select()
            .single();

          if (!recError && recommendation) {
            productRecommendations.push({
              ...product,
              recommendation: {
                relevance_score: recommendation.relevance_score,
                reason: recommendation.reason,
              },
            });
          }
        }
      }

      return res.status(200).json({
        recommendations: productRecommendations,
      });
    } catch (error) {
      console.error('Product recommendation error:', error);
      return res.status(500).json({
        error: 'Failed to generate recommendations',
        message: error.message,
      });
    }
  });
};

