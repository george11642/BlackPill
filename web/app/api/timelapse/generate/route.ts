import { Request } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  withAuth,
  supabaseAdmin,
  handleApiError,
  getRequestId,
  createResponseWithId,
} from '@/lib';
import { generateTimelapseVideo, uploadFramesToStorage } from '@/lib/video/timelapse-generator';
import { combineFramesIntoVideo } from '@/lib/video/video-combiner';

/**
 * POST /api/timelapse/generate
 * Generate timelapse video from selected analyses
 */
export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const { analysis_ids, options } = body;

    if (!analysis_ids || !Array.isArray(analysis_ids) || analysis_ids.length < 2) {
      return createResponseWithId(
        {
          error: 'Invalid request',
          message: 'At least 2 analysis IDs are required',
        },
        { status: 400 },
        requestId
      );
    }

    if (analysis_ids.length > 20) {
      return createResponseWithId(
        {
          error: 'Invalid request',
          message: 'Maximum 20 analyses allowed',
        },
        { status: 400 },
        requestId
      );
    }

    // Fetch analyses from database
    const { data: analyses, error: fetchError } = await supabaseAdmin
      .from('analyses')
      .select('id, image_url, score, created_at')
      .eq('user_id', user.id)
      .in('id', analysis_ids)
      .is('deleted_at', null)
      .order('created_at', { ascending: true }); // Oldest first for timelapse

    if (fetchError) {
      throw fetchError;
    }

    if (!analyses || analyses.length < 2) {
      return createResponseWithId(
        {
          error: 'Not found',
          message: 'Could not find valid analyses',
        },
        { status: 404 },
        requestId
      );
    }

    // Generate fresh signed URLs for images
    const analysesWithUrls = await Promise.all(
      analyses.map(async (analysis) => {
        if (analysis.image_url) {
          try {
            let filePath: string | null = null;

            if (analysis.image_url.includes('/storage/v1/object/sign/analyses/')) {
              const match = analysis.image_url.match(/\/storage\/v1\/object\/sign\/analyses\/([^?]+)/);
              if (match) {
                filePath = match[1];
              }
            } else if (analysis.image_url.includes('/storage/v1/object/public/analyses/')) {
              const match = analysis.image_url.match(/\/storage\/v1\/object\/public\/analyses\/([^?]+)/);
              if (match) {
                filePath = match[1];
              }
            } else if (!analysis.image_url.startsWith('http')) {
              filePath = analysis.image_url;
            }

            if (filePath) {
              const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
                .from('analyses')
                .createSignedUrl(filePath, 3600);

              if (!signedUrlError && signedUrlData) {
                return {
                  ...analysis,
                  image_url: signedUrlData.signedUrl,
                };
              }
            }
          } catch (urlError) {
            console.error('Error generating signed URL:', urlError);
          }
        }
        return analysis;
      })
    );

    // Generate timelapse frames
    const duration = options?.duration || Math.min(10, Math.max(3, analyses.length * 0.5));
    const frames = await generateTimelapseVideo(analysesWithUrls, {
      duration: duration,
      showScores: options?.showScores !== false,
      showDates: options?.showDates !== false,
      resolution: options?.resolution || { width: 1080, height: 1080 },
    });

    // Upload frames to storage
    const frameUrls = await uploadFramesToStorage(frames, user.id);

    // Generate timelapse ID
    const timelapseId = uuidv4();

    // Save timelapse record to database with frames
    const { error: dbError } = await supabaseAdmin.from('user_timelapses').insert({
      id: timelapseId,
      user_id: user.id,
      analysis_ids: analysis_ids,
      frame_urls: frameUrls,
      duration: duration,
      created_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error('Error saving timelapse record:', dbError);
      // Continue even if DB save fails
    }

    // Trigger async video generation in the background (non-blocking)
    // This will run independently and update the database when done
    triggerBackgroundVideoGeneration(timelapseId, user.id, frameUrls, duration).catch(error => {
      console.error('Background video generation error:', error);
    });

    return createResponseWithId(
      {
        timelapse_id: timelapseId,
        frame_urls: frameUrls,
        duration: duration,
        frame_count: frameUrls.length,
        message: 'Timelapse frames ready. Video will be generated in the background or on-demand.',
        status: 'frames_ready',
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Generate timelapse error:', error);
    return handleApiError(error, request);
  }
});

/**
 * Trigger background video generation (non-blocking)
 * This runs independently from the main request
 */
async function triggerBackgroundVideoGeneration(
  timelapseId: string,
  userId: string,
  frameUrls: string[],
  duration: number
) {
  try {
    // Queue video generation via the generate-video endpoint
    // This is a non-blocking background task
    const generateVideoUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/timelapse/generate-video`;
    
    await fetch(generateVideoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use a system token or service account if available
      },
      body: JSON.stringify({
        timelapse_id: timelapseId,
        frame_urls: frameUrls,
        duration: duration,
      }),
    }).catch(error => {
      console.error('Failed to trigger background video generation:', error);
      // This is non-critical, so we just log the error
    });
  } catch (error) {
    console.error('Error triggering background video generation:', error);
  }
}

