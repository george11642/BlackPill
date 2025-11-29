
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import {
  withAuth,
  supabaseAdmin,
  handleApiError,
  getRequestId,
  createResponseWithId,
} from '@/lib';

const execAsync = promisify(exec);

/**
 * POST /api/timelapse/generate-video
 * Asynchronously generate MP4 video from timelapse frames
 * This endpoint handles the actual video file creation
 */
export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const { timelapse_id, frame_urls, duration } = body;

    if (!timelapse_id || !frame_urls || frame_urls.length < 2) {
      return createResponseWithId(
        {
          error: 'Invalid request',
          message: 'timelapse_id, frame_urls, and duration are required',
        },
        { status: 400 },
        requestId
      );
    }

    // Verify timelapse belongs to user
    const { data: timelapse, error: fetchError } = await supabaseAdmin
      .from('user_timelapses')
      .select('*')
      .eq('id', timelapse_id)
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

    // If video already generated, return it
    if (timelapse.video_url) {
      return createResponseWithId(
        {
          video_url: timelapse.video_url,
          timelapse_id,
          status: 'ready',
        },
        { status: 200 },
        requestId
      );
    }

    // Try to generate video using FFmpeg
    // This will work if ffmpeg is available in the environment
    try {
      const tempDir = tmpdir();
      const sessionId = uuidv4();
      const frameDir = join(tempDir, `timelapse-${sessionId}`);
      const outputPath = join(tempDir, `timelapse-${sessionId}.mp4`);

      // Create frames directory
      const fs = await import('fs/promises');
      await fs.mkdir(frameDir, { recursive: true });

      // Download frames and save locally
      const frameFilePaths: string[] = [];
      for (let i = 0; i < frame_urls.length; i++) {
        try {
          const response = await fetch(frame_urls[i]);
          if (!response.ok) throw new Error(`Failed to fetch frame ${i}`);

          const buffer = await response.arrayBuffer();
          const filePath = join(frameDir, `frame_${i.toString().padStart(4, '0')}.png`);
          await writeFile(filePath, Buffer.from(buffer));
          frameFilePaths.push(filePath);
        } catch (error) {
          console.error(`Error downloading frame ${i}:`, error);
          // Continue with other frames
        }
      }

      if (frameFilePaths.length < 2) {
        return createResponseWithId(
          {
            error: 'Failed',
            message: 'Could not download enough frames to create video',
          },
          { status: 400 },
          requestId
        );
      }

      // Calculate framerate
      const fps = Math.max(1, Math.round(frameFilePaths.length / duration));

      // Generate video using ffmpeg
      const ffmpegCommand = `ffmpeg -framerate ${fps} -i "${frameDir}/frame_%04d.png" -pix_fmt yuv420p -c:v libx264 -preset ultrafast -crf 28 "${outputPath}"`;

      try {
        await execAsync(ffmpegCommand);
      } catch (ffmpegError: any) {
        console.error('FFmpeg error:', ffmpegError);
        // FFmpeg might not be available - return frames for client-side processing
        return createResponseWithId(
          {
            error: 'Processing',
            message: 'Video generation in progress. Use client-side video generation.',
            status: 'frames_ready',
            timelapse_id,
          },
          { status: 202 },
          requestId
        );
      }

      // Read the generated video
      const videoBuffer = await readFile(outputPath);

      // Upload video to Supabase Storage
      const videoFileName = `timelapses/${user.id}/${timelapse_id}/video.mp4`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('timelapses')
        .upload(videoFileName, videoBuffer, {
          contentType: 'video/mp4',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('timelapses')
        .getPublicUrl(videoFileName);

      const videoUrl = urlData?.publicUrl;

      // Update database with video URL
      await supabaseAdmin
        .from('user_timelapses')
        .update({ video_url: videoUrl })
        .eq('id', timelapse_id);

      // Cleanup temp files
      try {
        for (const filePath of frameFilePaths) {
          await unlink(filePath);
        }
        await unlink(outputPath);
        await fs.rmdir(frameDir);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
        // Don't fail the request if cleanup fails
      }

      return createResponseWithId(
        {
          video_url: videoUrl,
          timelapse_id,
          status: 'ready',
          message: 'Video generated successfully',
        },
        { status: 200 },
        requestId
      );
    } catch (error) {
      console.error('Video generation error:', error);
      // Return fallback response
      return createResponseWithId(
        {
          error: 'Processing',
          message: 'Video generation in progress. Please check back later.',
          status: 'frames_ready',
          timelapse_id,
        },
        { status: 202 },
        requestId
      );
    }
  } catch (error) {
    console.error('Generate video error:', error);
    return handleApiError(error, request);
  }
});

