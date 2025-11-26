import { Request } from 'next/server';
import {
  withAuth,
  supabaseAdmin,
  config,
  generateShareCardImage,
  createRateLimiter,
  initRedis,
  handleApiError,
  getRequestId,
  createResponseWithId,
} from '@/lib';

/**
 * GET /api/share/generate-card
 * Generate share card image for analysis
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    // Initialize Redis for rate limiting
    await initRedis();

    // Check rate limit
    await createRateLimiter('share')(request, user.id);

    const { searchParams } = new URL(request.url);
    const analysis_id = searchParams.get('analysis_id');

    if (!analysis_id) {
      return createResponseWithId(
        {
          error: 'Missing analysis_id',
        },
        { status: 400 },
        requestId
      );
    }

    // Get analysis
    const { data: analysis, error } = await supabaseAdmin
      .from('analyses')
      .select('*')
      .eq('id', analysis_id)
      .eq('user_id', user.id)
      .single();

    if (error || !analysis) {
      return createResponseWithId(
        {
          error: 'Analysis not found',
        },
        { status: 404 },
        requestId
      );
    }

    // Get user's referral code
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('referral_code')
      .eq('id', user.id)
      .single();

    // Prepare share data
    const shareData = {
      analysis_id: analysis.id,
      score: parseFloat(String(analysis.score)),
      breakdown: (analysis.breakdown as Record<string, number>) || {},
      referral_code: userData?.referral_code || '',
      share_url: `${config.app.url}/ref/${userData?.referral_code}`,
      image_url: analysis.image_url,
    };

    // Generate share card PNG image (1080x1920px) using Vercel OG
    const imageArrayBuffer = await generateShareCardImage(shareData);
    const imageBuffer = Buffer.from(imageArrayBuffer);

    // Upload to Supabase Storage
    const fileName = `share-cards/${analysis.id}.png`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('analyses')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '604800', // Cache for 7 days as per PRD
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      throw new Error(`Failed to upload share card: ${uploadError.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('analyses').getPublicUrl(fileName);

    // Log the share event
    await supabaseAdmin.from('share_logs').insert({
      user_id: user.id,
      analysis_id: analysis.id,
      platform: 'generated',
    });

    // Return share card URL
    return createResponseWithId(
      {
        image_url: publicUrl,
        share_url: shareData.share_url,
        analysis_id: analysis.id,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Share card generation error:', error);
    return handleApiError(error, request);
  }
});

