import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import {
  withAuth,
  checkScansRemaining,
  analyzeRateLimiter,
  supabaseAdmin,
  analyzeFacialAttractiveness,
  handleApiError,
  getRequestId,
  initRedis,
} from '@/lib';
import {
  checkAnalysisAchievements,
  checkImprovementAchievements,
} from '@/lib/achievements/service';
import { updateGoalsFromAnalysis } from '@/lib/goals/service';

// CORS headers - allow all origins for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
  'Access-Control-Max-Age': '86400',
};

/**
 * OPTIONS /api/analyze
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: Request) {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * POST /api/analyze
 * Analyze a facial photo
 */
export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    // Initialize Redis for rate limiting
    await initRedis();

    // Check scans remaining
    const { tier, scansRemaining } = await checkScansRemaining(user.id);

    // Check rate limit
    await analyzeRateLimiter(request, tier, user.id);

    // Parse form data
    const formData = await request.formData();
    
    // Debug: Log formdata keys
    console.log('[Analyze] FormData keys:', Array.from((formData as any).keys()));
    
    const imageFile = (formData as any).get('image') as File | null;

    if (!imageFile) {
      console.error('[Analyze] No image file found in formdata');
      return NextResponse.json(
        {
          error: 'No image provided',
          message: 'Please upload an image file',
        },
        { 
          status: 400,
          headers: {
            ...corsHeaders,
            'X-Request-ID': requestId,
          },
        }
      );
    }

    // Validate file type
    console.log('[Analyze] Image file info:', { 
      name: imageFile.name, 
      type: imageFile.type, 
      size: imageFile.size 
    });
    
    if (!imageFile.type || !imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        {
          error: 'Invalid file type',
          message: 'Only image files are allowed',
        },
        { 
          status: 400,
          headers: {
            ...corsHeaders,
            'X-Request-ID': requestId,
          },
        }
      );
    }

    // Validate file size (must be > 0 and < 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (imageFile.size === 0) {
      console.error('[Analyze] Image file is empty after reading');
      return NextResponse.json(
        {
          error: 'File is empty',
          message: 'Image file is empty. Please try taking the photo again.',
        },
        { 
          status: 400,
          headers: {
            ...corsHeaders,
            'X-Request-ID': requestId,
          },
        }
      );
    }
    
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        {
          error: 'File too large',
          message: 'Image must be less than 2MB',
        },
        { 
          status: 400,
          headers: {
            ...corsHeaders,
            'X-Request-ID': requestId,
          },
        }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    
    console.log('[Analyze] Buffer created with size:', imageBuffer.length);

    // Process image
    const processedImage = await sharp(imageBuffer)
      .resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Upload to Supabase Storage
    const fileName = `${user.id}/${uuidv4()}.jpg`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('analyses')
      .upload(fileName, processedImage, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
      });

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get signed URL (1 hour expiration) - bucket is now private
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('analyses')
      .createSignedUrl(fileName, 3600); // 1 hour expiration

    if (signedUrlError || !signedUrlData) {
      throw new Error(`Failed to create signed URL: ${signedUrlError?.message || 'Unknown error'}`);
    }

    const imageUrl = signedUrlData.signedUrl;

    // Analyze with OpenAI Vision API (handles face detection and content moderation)
    // Signed URLs work with OpenAI Vision API as long as they're accessible
    const analysisResult = await analyzeFacialAttractiveness(imageUrl);

    // Create thumbnail
    const thumbnail = await sharp(processedImage)
      .resize(200, 200, {
        fit: 'cover',
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    const thumbnailFileName = `${user.id}/${uuidv4()}-thumb.jpg`;
    const { data: thumbUploadData, error: thumbUploadError } = await supabaseAdmin.storage
      .from('analyses')
      .upload(thumbnailFileName, thumbnail, {
        contentType: 'image/jpeg',
      });

    let thumbnailUrl: string | null = null;
    if (thumbUploadError) {
      console.error('Thumbnail upload error:', thumbUploadError);
      // Continue without thumbnail rather than failing the entire request
    } else {
      // Get signed URL for thumbnail (1 hour expiration)
      const { data: thumbSignedUrlData, error: thumbSignedUrlError } = await supabaseAdmin.storage
        .from('analyses')
        .createSignedUrl(thumbnailFileName, 3600); // 1 hour expiration

      if (thumbSignedUrlError || !thumbSignedUrlData) {
        console.error('Thumbnail signed URL error:', thumbSignedUrlError);
        // Continue without thumbnail rather than failing the entire request
      } else {
        thumbnailUrl = thumbSignedUrlData.signedUrl;
      }
    }

    // Save analysis to database
    const { data: analysis, error: dbError } = await supabaseAdmin
      .from('analyses')
      .insert({
        user_id: user.id,
        image_url: imageUrl,
        image_thumbnail_url: thumbnailUrl,
        score: analysisResult.score,
        breakdown: analysisResult.breakdown,
        tips: analysisResult.tips,
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Failed to save analysis: ${dbError.message}`);
    }

    // Decrement scans remaining (unless elite)
    if (tier !== 'elite') {
      // Get current total_scans_used to increment it
      const { data: currentUser } = await supabaseAdmin
        .from('users')
        .select('total_scans_used')
        .eq('id', user.id)
        .single();

      const currentTotalScans = currentUser?.total_scans_used || 0;

      await supabaseAdmin
        .from('users')
        .update({
          scans_remaining: scansRemaining - 1,
          total_scans_used: currentTotalScans + 1,
        })
        .eq('id', user.id);
    }

    // Get updated scans remaining
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('scans_remaining')
      .eq('id', user.id)
      .single();

    // Check if this is user's first scan
    const { count: analysisCount } = await supabaseAdmin
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const isFirstScan = (analysisCount || 0) === 1;
    console.log(`[Analyze] User ${user.id} - analysisCount: ${analysisCount}, isFirstScan: ${isFirstScan}`);

    // Check and unlock achievements - await to ensure they complete
    let unlockedAchievements: Array<{ key: string; name: string; emoji: string; description: string }> = [];
    try {
      const [analysisAchievements] = await Promise.all([
        checkAnalysisAchievements(user.id, analysis.score, isFirstScan),
        checkImprovementAchievements(user.id, analysis.score),
      ]);
      unlockedAchievements = analysisAchievements || [];
      console.log('[Analyze] Achievement checks completed successfully, unlocked:', unlockedAchievements.length);
    } catch (error) {
      console.error('[Analyze] Error checking achievements:', error);
      // Don't throw - achievements are non-critical
    }

    // Update goals based on analysis (fire and forget - don't block response)
    const goalUpdatePromise = updateGoalsFromAnalysis(
      user.id,
      analysis.score,
      analysis.breakdown
    ).catch((error) => {
      console.error('Error updating goals:', error);
      // Don't throw - goal updates are non-critical
      return { updatedGoals: [], completedMilestones: [] };
    });

    // Wait for goal update to complete so we can include it in response
    const goalUpdateResult = await goalUpdatePromise;

    // Return response
    return NextResponse.json(
      {
        analysis_id: analysis.id,
        score: analysis.score,
        breakdown: analysis.breakdown,
        tips: analysis.tips,
        scans_remaining: userData?.scans_remaining || 0,
        goals_updated: goalUpdateResult.updatedGoals.length > 0,
        completed_milestones: goalUpdateResult.completedMilestones,
        completed_goals: goalUpdateResult.updatedGoals.filter(g => g.goal_completed).map(g => g.id),
        unlocked_achievements: unlockedAchievements,
      },
      { 
        status: 200,
        headers: {
          ...corsHeaders,
          'X-Request-ID': requestId,
        },
      }
    );
  } catch (error) {
    console.error('Analysis error:', {
      error: error instanceof Error ? error.message : String(error),
      user_id: user.id,
      request_id: requestId,
    });

    // Check for insufficient scans (402 Payment Required)
    const isInsufficientScans =
      error instanceof Error &&
      error.message.includes('Insufficient scans');

    // Determine if this is a client error (4xx) or server error (5xx)
    const isClientError =
      error instanceof Error &&
      (error.message.includes('No face detected') ||
        error.message.includes('Multiple faces') ||
        error.message.includes('blurred') ||
        error.message.includes('under-exposed') ||
        error.message.includes('Face angle') ||
        error.message.includes('confidence is too low') ||
        error.message.includes('inappropriate content') ||
        error.message.includes('Invalid') ||
        error.message.includes('File too large'));

    const statusCode = isInsufficientScans ? 402 : (isClientError ? 400 : 500);
    const errorMessage = isInsufficientScans
      ? 'Insufficient scans remaining. Please upgrade your subscription to continue.'
      : isClientError
      ? error instanceof Error
        ? error.message
        : 'Invalid photo'
      : 'Our servers encountered an error processing your photo. Please try again in a moment.';

    return NextResponse.json(
      {
        error: isInsufficientScans ? 'Insufficient scans' : (isClientError ? 'Invalid photo' : 'Analysis failed'),
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' &&
          error instanceof Error && { details: error.message }),
      },
      { 
        status: statusCode,
        headers: {
          ...corsHeaders,
          'X-Request-ID': requestId,
        },
      }
    );
  }
});
