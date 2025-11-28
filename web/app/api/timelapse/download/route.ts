import { Request } from 'next/server';
import {
  withAuth,
  supabaseAdmin,
  handleApiError,
  getRequestId,
  createResponseWithId,
} from '@/lib';
import { generateVideoDownloadUrl } from '@/lib/video/video-combiner';

/**
 * GET /api/timelapse/download?id=timelapseId
 * Get a downloadable timelapse video URL
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const { searchParams } = new URL(request.url);
    const timelapseId = searchParams.get('id');

    if (!timelapseId) {
      return createResponseWithId(
        {
          error: 'Invalid request',
          message: 'Timelapse ID is required',
        },
        { status: 400 },
        requestId
      );
    }

    // Get timelapse from database
    const { data: timelapse, error: fetchError } = await supabaseAdmin
      .from('user_timelapses')
      .select('*')
      .eq('id', timelapseId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !timelapse) {
      return createResponseWithId(
        {
          error: 'Not found',
          message: 'Timelapse not found',
        },
        { status: 404 },
        requestId
      );
    }

    // If video URL exists, return it with download headers
    if (timelapse.video_url) {
      return createResponseWithId(
        {
          download_url: timelapse.video_url,
          timelapse_id: timelapseId,
          message: 'Download ready',
          status: 'ready',
        },
        { status: 200 },
        requestId
      );
    }

    // If no video yet, return frames for client-side composition
    if (timelapse.frame_urls && timelapse.frame_urls.length > 0) {
      return createResponseWithId(
        {
          frame_urls: timelapse.frame_urls,
          timelapse_id: timelapseId,
          message: 'Video generation in progress. Frames available for preview.',
          status: 'frames_ready',
          duration: timelapse.duration,
        },
        { status: 200 },
        requestId
      );
    }

    return createResponseWithId(
      {
        error: 'Not ready',
        message: 'Timelapse is still being generated',
      },
      { status: 202 }, // 202 Accepted - still processing
      requestId
    );
  } catch (error) {
    console.error('Download timelapse error:', error);
    return handleApiError(error, request);
  }
});

