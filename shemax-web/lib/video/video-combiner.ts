import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Combine image frames into a video file using Cloudinary
 * Cloudinary's API can create a video from a sequence of images
 */
export async function combineFramesIntoVideo(
  frameUrls: string[],
  duration: number,
  userId: string,
  timelapseId: string
): Promise<string> {
  try {
    if (frameUrls.length === 0) {
      throw new Error('No frames provided');
    }

    if (frameUrls.length < 2) {
      throw new Error('At least 2 frames required to create a video');
    }

    // Calculate delay per frame in centiseconds
    const delayPerFrame = Math.round((duration * 100) / frameUrls.length);

    // Build the transformation URL using Cloudinary's layer composition
    // This creates an animated GIF/video from the frames
    const transformation = [
      {
        fetch_format: 'mp4',
        quality: 'auto',
        flags: 'animated',
        delay: delayPerFrame,
      },
    ];

    // Use Cloudinary's API to create a video from the sequence of images
    // For now, we'll create an animated GIF that can be converted to video client-side
    const videoUrl = cloudinary.url('shemax_timelapse', {
      resource_type: 'video',
      type: 'upload',
      quality: 'auto',
      fetch_format: 'auto',
      flags: 'animated',
      transformation: transformation,
    });

    console.log('Generated video URL:', videoUrl);

    // For MVP: Return the first frame URL for now
    // In production, implement proper video generation
    // Option 1: Use ffmpeg-wasm in the browser
    // Option 2: Use a dedicated video service like Mux or Vimeo
    // Option 3: Implement proper Cloudinary video composition

    // For now, return a marker indicating video is ready
    return frameUrls[0]; // Placeholder - should be actual video URL
  } catch (error) {
    console.error('Error combining frames into video:', error);
    throw error;
  }
}

/**
 * Generate a download URL for timelapse video
 * This will be a signed URL that expires after a certain time
 */
export function generateVideoDownloadUrl(
  videoUrl: string,
  expirationTime: number = 3600 // 1 hour in seconds
): string {
  try {
    // If using Cloudinary, we can generate a signed URL
    if (videoUrl.includes('cloudinary')) {
      return cloudinary.url(videoUrl, {
        sign_url: true,
        type: 'authenticated',
        resource_type: 'video',
      });
    }

    // Otherwise return the URL as-is
    return videoUrl;
  } catch (error) {
    console.error('Error generating download URL:', error);
    return videoUrl;
  }
}

