import { NextResponse } from 'next/server';
import { withAuth, supabaseAdmin, getRequestId } from '@/lib';
import { v4 as uuidv4 } from 'uuid';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
  'Access-Control-Max-Age': '86400',
};

// Transformation scenarios for the "You as a 10/10" feature
// Using PhotoMaker - prompts optimized for identity preservation
const TRANSFORMATION_SCENARIOS = [
  {
    id: 'formal',
    name: 'Formal Event',
    style: 'Photographic (Default)',
    prompt: 'wearing an elegant black tuxedo, at a luxury gala event, professional studio lighting, confident expression, sharp jawline, clear skin, attractive, solo portrait, no other people in background',
  },
  {
    id: 'casual',
    name: 'Casual Cool',
    style: 'Photographic (Default)',
    prompt: 'wearing stylish casual streetwear, standing alone, plain studio background, confident pose, clear skin, well-groomed, attractive, modern fashion, solo portrait',
  },
  {
    id: 'fitness',
    name: 'Fitness Model',
    style: 'Photographic (Default)',
    prompt: 'as a fit athletic fitness model, defined muscles, athletic wear, confident pose, clear skin, healthy glow, plain gym background, solo portrait, no other people',
  },
  {
    id: 'professional',
    name: 'Business Executive',
    style: 'Photographic (Default)',
    prompt: 'as a successful business executive in a sharp tailored navy suit, plain office background, confident expression, professional headshot, well-groomed, solo portrait',
  },
  {
    id: 'beach',
    name: 'Beach Lifestyle',
    style: 'Cinematic',
    prompt: 'at a tropical beach during golden hour, tanned healthy skin, confident smile, simple beach background, summer vibes, solo portrait, no other people',
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
      
      // Rate limiting based on tier (monthly limits - advertised)
      const monthlyLimits: { [key: string]: number } = {
        free: 0,      // No AI generation for free users
        pro: 0,       // Exclusive to Elite users
        elite: 50,    // 50 generations per month
      };

      // Daily limits (unadvertised - to prevent abuse)
      const dailyLimits: { [key: string]: number } = {
        free: 0,
        pro: 0,
        elite: 5,     // 5 generations per day max
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

      // Check daily usage (unadvertised limit)
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { count: dailyUsage } = await supabaseAdmin
        .from('ai_transformations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfDay.toISOString());

      if ((dailyUsage || 0) >= dailyLimits[tier]) {
        return NextResponse.json(
          { 
            error: 'You\'ve reached your daily limit. Try again tomorrow!',
          },
          { status: 429, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
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

      if ((monthlyUsage || 0) >= monthlyLimits[tier]) {
        return NextResponse.json(
          { 
            error: 'Monthly AI transformation limit reached',
            limit: monthlyLimits[tier],
            used: monthlyUsage,
          },
          { status: 429, headers: { ...corsHeaders, 'X-Request-ID': requestId } }
        );
      }

      // Determine which scenarios to generate
      const scenariosToGenerate = generateAll 
        ? TRANSFORMATION_SCENARIOS 
        : [TRANSFORMATION_SCENARIOS.find(s => s.id === (scenario || 'formal')) || TRANSFORMATION_SCENARIOS[0]];

      // Generate transformations using PhotoMaker model
      const transformations = await Promise.all(
        scenariosToGenerate.map(async (s) => {
          // Generate the transformation
          const replicateImageUrl = await generateTransformation(
            analysis.image_url,
            s.prompt,
            (s as any).style || 'Photographic (Default)',
            requestId
          );

          // Upload to Supabase Storage for permanent storage
          let storagePath: string | null = null;
          let finalImageUrl = replicateImageUrl;
          
          // Only upload if it's a real image (not a placeholder)
          if (!replicateImageUrl.includes('placehold.co')) {
            storagePath = await uploadToStorage(replicateImageUrl, user.id, requestId);
            if (storagePath) {
              // Get signed URL for the stored image
              const signedUrl = await getSignedUrl(storagePath);
              if (signedUrl) {
                finalImageUrl = signedUrl;
              }
            }
          }

          // Store the transformation with storage path
          const { data: transformation, error: insertError } = await supabaseAdmin
            .from('ai_transformations')
            .insert({
              user_id: user.id,
              analysis_id: analysisId,
              scenario: s.id,
              scenario_name: s.name,
              original_image_url: analysis.image_url,
              transformed_image_url: finalImageUrl,
              storage_path: storagePath, // Store the path for future signed URL generation
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
            image_url: finalImageUrl,
          };
        })
      );

      return NextResponse.json(
        {
          success: true,
          transformations,
          remaining_this_month: monthlyLimits[tier] - (monthlyUsage || 0) - transformations.length,
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
 * Generate AI transformation using PhotoMaker model on Replicate
 * PhotoMaker creates photos in any style while preserving your identity
 */
async function generateTransformation(
  originalImageUrl: string,
  prompt: string,
  style: string,
  requestId: string
): Promise<string> {
  const replicateApiToken = process.env.REPLICATE_API_TOKEN;
  
  if (!replicateApiToken) {
    console.log(`[${requestId}] Replicate API token not configured, returning placeholder`);
    return `https://placehold.co/1024x1024/1a1a2e/d4af37?text=AI+Transformation+Preview`;
  }

  try {
    console.log(`[${requestId}] Starting PhotoMaker transformation`);
    console.log(`[${requestId}] Image URL: ${originalImageUrl}`);
    console.log(`[${requestId}] Prompt: ${prompt}`);
    
    // Map style to PhotoMaker style_name
    const styleMap: { [key: string]: string } = {
      '3D': 'Photographic (Default)',
      'Video game': 'Cinematic',
      'Cinematic': 'Cinematic',
      'default': 'Photographic (Default)',
    };
    const styleName = styleMap[style] || 'Photographic (Default)';
    
    // Use PhotoMaker model - preserves identity while changing style
    // Version: ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${replicateApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4',
        input: {
          input_image: originalImageUrl,
          prompt: `A photo of a man img, ${prompt}`,
          negative_prompt: 'nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, ugly, disfigured',
          num_steps: 50,
          style_name: styleName,
          style_strength_ratio: 20, // Lower = more like original face
          guidance_scale: 5,
          num_outputs: 1,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] PhotoMaker API error: ${response.status} - ${errorText}`);
      return `https://placehold.co/1024x1024/1a1a2e/d4af37?text=Generation+Failed`;
    }

    const prediction = await response.json();
    console.log(`[${requestId}] PhotoMaker prediction started: ${prediction.id}`);
    
    // Poll for completion
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 90; // 3 minutes max
    
    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
      
      const pollResponse = await fetch(result.urls.get, {
        headers: {
          'Authorization': `Bearer ${replicateApiToken}`,
        },
      });
      result = await pollResponse.json();
      
      if (attempts % 5 === 0) {
        console.log(`[${requestId}] Poll attempt ${attempts}: ${result.status}`);
      }
    }

    if (result.status === 'failed') {
      console.error(`[${requestId}] PhotoMaker generation failed:`, result.error);
      return `https://placehold.co/1024x1024/1a1a2e/d4af37?text=Generation+Failed`;
    }
    
    if (attempts >= maxAttempts) {
      console.error(`[${requestId}] PhotoMaker generation timed out`);
      return `https://placehold.co/1024x1024/1a1a2e/d4af37?text=Generation+Timeout`;
    }

    const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
    console.log(`[${requestId}] Transformation complete: ${outputUrl}`);
    return outputUrl || originalImageUrl;
    
  } catch (error) {
    console.error(`[${requestId}] AI generation error:`, error);
    return `https://placehold.co/1024x1024/1a1a2e/d4af37?text=Generation+Failed`;
  }
}

/**
 * Upload an image from URL to Supabase Storage
 * Returns the storage path for the uploaded file
 */
async function uploadToStorage(
  imageUrl: string,
  userId: string,
  requestId: string
): Promise<string | null> {
  try {
    // Download the image from Replicate
    console.log(`[${requestId}] Downloading image from: ${imageUrl}`);
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      console.error(`[${requestId}] Failed to download image: ${imageResponse.status}`);
      return null;
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    const extension = contentType.includes('jpeg') ? 'jpg' : 'png';
    
    // Generate unique filename
    const filename = `${userId}/${uuidv4()}.${extension}`;
    
    // Upload to Supabase Storage
    console.log(`[${requestId}] Uploading to storage: ${filename}`);
    const { data, error } = await supabaseAdmin.storage
      .from('ai-transformations')
      .upload(filename, imageBuffer, {
        contentType,
        cacheControl: '31536000', // 1 year cache
        upsert: false,
      });
    
    if (error) {
      console.error(`[${requestId}] Storage upload error:`, error);
      return null;
    }
    
    console.log(`[${requestId}] Upload successful: ${data.path}`);
    return data.path;
    
  } catch (error) {
    console.error(`[${requestId}] Upload to storage failed:`, error);
    return null;
  }
}

/**
 * Get a signed URL for a stored transformation image
 */
async function getSignedUrl(storagePath: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from('ai-transformations')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 day expiry
    
    if (error) {
      console.error('Failed to create signed URL:', error);
      return null;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('Signed URL error:', error);
    return null;
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

      // Map database fields to API response format and generate fresh signed URLs
      const mappedTransformations = await Promise.all(
        (transformations || []).map(async (t: any) => {
          let imageUrl = t.transformed_image_url;
          
          // If we have a storage path, generate a fresh signed URL
          if (t.storage_path) {
            const signedUrl = await getSignedUrl(t.storage_path);
            if (signedUrl) {
              imageUrl = signedUrl;
            }
          }
          
          return {
            id: t.id,
            scenario: t.scenario,
            scenario_name: t.scenario_name,
            image_url: imageUrl,
            original_image_url: t.original_image_url,
            created_at: t.created_at,
          };
        })
      );

      return NextResponse.json(
        { transformations: mappedTransformations },
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

