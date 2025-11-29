
import OpenAI from 'openai';
import {
  withAuth,
  supabaseAdmin,
  handleApiError,
  getRequestId,
  createResponseWithId,
  config,
} from '@/lib';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

/**
 * POST /api/products/recommend
 * Generate AI-powered product recommendations based on analysis
 */
export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const { analysisId } = body;

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

    // Get analysis
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
        },
        { status: 404 },
        requestId
      );
    }

    // Identify weak areas
    const breakdown = analysis.breakdown;
    const weakAreas = Object.entries(breakdown)
      .filter(([key, value]) => (value as number) < 7.0)
      .map(([key, value]) => ({ category: key, score: value }));

    // Get available products
    const { data: allProducts } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('is_active', true);

    if (!allProducts || allProducts.length === 0) {
      return createResponseWithId(
        {
          recommendations: [],
          message: 'No products available yet',
        },
        { status: 200 },
        requestId
      );
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

Return as JSON object with "recommendations" array:
{
  "recommendations": [
    {
      "product_name": "...",
      "relevance_score": 0.0-1.0,
      "reason": "..."
    },
    ...
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content:
            "You are a skincare and grooming expert. Recommend products that match the user's specific needs. Be honest about limitations.",
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const aiRecommendations = JSON.parse(completion.choices[0].message.content || '{}');
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
            user_id: user.id,
            relevance_score: Math.min(
              Math.max(parseFloat(rec.relevance_score) || 0.5, 0),
              1
            ),
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

    return createResponseWithId(
      {
        recommendations: productRecommendations,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Product recommendation error:', error);
    return handleApiError(error, request);
  }
});

