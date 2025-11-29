import { NextResponse } from 'next/server';
import { withAuth, supabaseAdmin, getRequestId } from '@/lib';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
  'Access-Control-Max-Age': '86400',
};

// Transformation scenarios for the "You as a 10/10" feature
const TRANSFORMATION_SCENARIOS = [
  {
    id: 'formal',
    name: 'Formal Event',
    prompt: 'Transform this person into their most attractive version wearing an elegant black suit at a high-end casino or gala event. Improve facial features to be more symmetrical and defined. Professional lighting, confident expression.',
  },
  {
    id: 'casual',
    name: 'Casual Cool',
    prompt: 'Transform this person into their most attractive version in casual streetwear, looking confident and stylish. Improve facial features, clear skin, well-groomed. Natural daylight, urban background.',
  },
  {
    id: 'fitness',
    name: 'Fitness Model',
    prompt: 'Transform this person into their most attractive fitness model version with athletic build, defined jawline, clear skin. Gym or outdoor fitness setting, confident pose.',
  },
  {
    id: 'professional',
    name: 'Business Executive',
    prompt: 'Transform this person into their most attractive version as a successful business executive. Sharp suit, confident expression, improved facial features. Modern office or city skyline background.',
  },
  {
    id: 'beach',
    name: 'Beach Lifestyle',
    prompt: 'Transform this person into their most attractive version at a tropical beach. Athletic build, tanned skin, confident smile. Golden hour lighting, luxury beach setting.',
  },
];

/**
 * OPTIONS /api/ai-transform - Handle CORS preflight
 */
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * POST /api/ai-transform - Generate AI-transformed "10/10" images
 * 
 * Body: {
 *   analysisId: string,
 *   scenario?: 'formal' | 'casual' | 'fitness' | 'professional' | 'beach',
 *   generateAll?: boolean
 * }
 */
export async function POST(request: Request) {
  return withAuth(async (req: Request, user) => {
    const requestId = getRequestId(req);

    try {
      const body = await req.json();
      const { analysisId, scenario, generateAll = false } = body;

      if (!analysisId) {
        return NextResponse.json(
          { error: 'Analysis ID is required' },
          { status: 400, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
        );
      }

      // Get the analysis and verify ownership
      const { data: analysis, error: analysisError } = await supabaseAdmin
        .from('analyses')
        .select('*')
        .eq('id', analysisId)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single();

      if (analysisError || !analysis) {
        return NextResponse.json(
          { error: 'Analysis not found' },
          { status: 404, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
        );
      }

      // Check subscription tier for AI generation limits
      const { data: subscription } = await supabaseAdmin
        .from('subscriptions')
        .select('tier, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      const tier = subscription?.tier || 'free';
      
      // Rate limiting based on tier
      const limits: { [key: string]: number } = {
        free: 0,      // No AI generation for free users
        pro: 0,       // Exclusive to Elite users
        elite: 50,    // 50 generations per month
      };

      if (tier === 'free') {
        return NextResponse.json(
          { 
            error: 'AI transformation requires a subscription',
            upgrade_required: true,
          },
          { status: 403, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
        );
      }

      // Check monthly usage
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: monthlyUsage } = await supabaseAdmin
        .from('ai_transformations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      if ((monthlyUsage || 0) >= limits[tier]) {
        return NextResponse.json(
          { 
            error: 'Monthly AI transformation limit reached',
            limit: limits[tier],
            used: monthlyUsage,
          },
          { status: 429, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
        );
      }

      // Determine which scenarios to generate
      const scenariosToGenerate = generateAll 
        ? TRANSFORMATION_SCENARIOS 
        : [TRANSFORMATION_SCENARIOS.find(s => s.id === (scenario || 'formal')) || TRANSFORMATION_SCENARIOS[0]];

      // Generate transformations
      // Note: In production, this would call an actual AI image generation API
      // like Replicate, Stability AI, or similar
      const transformations = await Promise.all(
        scenariosToGenerate.map(async (s) => {
          // Placeholder for actual AI generation
          // In production: call Replicate/Stability API with the analysis image and prompt
          const transformedImageUrl = await generateTransformation(
            analysis.image_url,
            s.prompt,
            requestId
          );

          // Store the transformation
          const { data: transformation, error: insertError } = await supabaseAdmin
            .from('ai_transformations')
            .insert({
              user_id: user.id,
              analysis_id: analysisId,
              scenario: s.id,
              scenario_name: s.name,
              original_image_url: analysis.image_url,
              transformed_image_url: transformedImageUrl,
              prompt_used: s.prompt,
            })
            .select()
            .single();

          if (insertError) {
            console.error('Failed to store transformation:', insertError);
          }

          return {
            id: transformation?.id,
            scenario: s.id,
            scenario_name: s.name,
            image_url: transformedImageUrl,
          };
        })
      );

      return NextResponse.json(
        {
          success: true,
          transformations,
          remaining_this_month: limits[tier] - (monthlyUsage || 0) - transformations.length,
        },
        { status: 200, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
      );
    } catch (error) {
      console.error('AI transformation error:', error);
      return NextResponse.json(
        { error: 'Failed to generate transformation' },
        { status: 500, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
      );
    }
  })(request);
}

/**
 * Generate AI transformation using image generation API
 * In production, this would call Replicate, Stability AI, or similar
 */
async function generateTransformation(
  originalImageUrl: string,
  prompt: string,
  requestId: string
): Promise<string> {
  // Check if we have Replicate API key configured
  const replicateApiKey = process.env.REPLICATE_API_KEY;
  
  if (!replicateApiKey) {
    // Return placeholder if no API key configured
    console.log(`[${requestId}] Replicate API key not configured, returning placeholder`);
    return `https://placehold.co/1024x1024/1a1a2e/d4af37?text=AI+Transformation+Preview`;
  }

  try {
    // Call Replicate API for image-to-image transformation
    // Using a model like SDXL or similar for face enhancement
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Using a face enhancement/transformation model
        version: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
        input: {
          image: originalImageUrl,
          prompt: prompt,
          negative_prompt: 'ugly, disfigured, low quality, blurry, nsfw',
          strength: 0.6,
          guidance_scale: 7.5,
          num_inference_steps: 30,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.status}`);
    }

    const prediction = await response.json();
    
    // Poll for completion
    let result = prediction;
    while (result.status !== 'succeeded' && result.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pollResponse = await fetch(result.urls.get, {
        headers: {
          'Authorization': `Token ${replicateApiKey}`,
        },
      });
      result = await pollResponse.json();
    }

    if (result.status === 'failed') {
      throw new Error('Image generation failed');
    }

    // Return the generated image URL
    return result.output?.[0] || originalImageUrl;
  } catch (error) {
    console.error(`[${requestId}] AI generation error:`, error);
    // Return placeholder on error
    return `https://placehold.co/1024x1024/1a1a2e/d4af37?text=Generation+Failed`;
  }
}

/**
 * GET /api/ai-transform - Get user's transformation history
 */
export async function GET(request: Request) {
  return withAuth(async (req: Request, user) => {
    const requestId = getRequestId(req);

    try {
      const { searchParams } = new URL(req.url);
      const analysisId = searchParams.get('analysisId');

      let query = supabaseAdmin
        .from('ai_transformations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (analysisId) {
        query = query.eq('analysis_id', analysisId);
      }

      const { data: transformations, error } = await query.limit(50);

      if (error) {
        throw error;
      }

      return NextResponse.json(
        { transformations },
        { status: 200, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
      );
    } catch (error) {
      console.error('Get transformations error:', error);
      return NextResponse.json(
        { error: 'Failed to get transformations' },
        { status: 500, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
      );
    }
  })(request);
}

