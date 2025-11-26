import { Request } from 'next/server';
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
  createResponseWithId,
  initRedis,
} from '@/lib';

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
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return createResponseWithId(
        {
          error: 'No image provided',
          message: 'Please upload an image file',
        },
        { status: 400 },
        requestId
      );
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      return createResponseWithId(
        {
          error: 'Invalid file type',
          message: 'Only image files are allowed',
        },
        { status: 400 },
        requestId
      );
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (imageFile.size > maxSize) {
      return createResponseWithId(
        {
          error: 'File too large',
          message: 'Image must be less than 2MB',
        },
        { status: 400 },
        requestId
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

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

    // Get public URL
    const {
      data: { publicUrl: imageUrl },
    } = supabaseAdmin.storage.from('analyses').getPublicUrl(fileName);

    // Analyze with OpenAI Vision API (handles face detection and content moderation)
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
      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from('analyses').getPublicUrl(thumbnailFileName);
      thumbnailUrl = publicUrl;
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

    // Decrement scans remaining (unless unlimited)
    if (tier !== 'unlimited') {
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

    // Return response
    return createResponseWithId(
      {
        analysis_id: analysis.id,
        score: analysis.score,
        breakdown: analysis.breakdown,
        tips: analysis.tips,
        scans_remaining: userData?.scans_remaining || 0,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Analysis error:', {
      error: error instanceof Error ? error.message : String(error),
      user_id: user.id,
      request_id: requestId,
    });

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

    const statusCode = isClientError ? 400 : 500;
    const errorMessage = isClientError
      ? error instanceof Error
        ? error.message
        : 'Invalid photo'
      : 'Our servers encountered an error processing your photo. Please try again in a moment.';

    return createResponseWithId(
      {
        error: isClientError ? 'Invalid photo' : 'Analysis failed',
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' &&
          error instanceof Error && { details: error.message }),
      },
      { status: statusCode },
      requestId
    );
  }
});
