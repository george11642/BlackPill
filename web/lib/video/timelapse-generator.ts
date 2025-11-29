/// <reference types="node" />
import sharp from 'sharp';
import { supabaseAdmin } from '@/lib/supabase/client';

export interface TimelapseOptions {
  duration?: number; // Total duration in seconds (3-10)
  transitionType?: 'crossfade' | 'slide' | 'zoom';
  showScores?: boolean;
  showDates?: boolean;
  resolution?: { width: number; height: number };
}

export interface Analysis {
  id: string;
  image_url: string;
  score: number;
  created_at: string;
}

/**
 * Download image from Supabase Storage
 */
async function downloadImage(imageUrl: string): Promise<Buffer> {
  try {
    // Extract file path from URL
    let filePath: string | null = null;

    if (imageUrl.includes('/storage/v1/object/sign/analyses/')) {
      const match = imageUrl.match(/\/storage\/v1\/object\/sign\/analyses\/([^?]+)/);
      if (match) {
        filePath = match[1];
      }
    } else if (imageUrl.includes('/storage/v1/object/public/analyses/')) {
      const match = imageUrl.match(/\/storage\/v1\/object\/public\/analyses\/([^?]+)/);
      if (match) {
        filePath = match[1];
      }
    } else if (!imageUrl.startsWith('http')) {
      filePath = imageUrl;
    }

    if (!filePath) {
      // If it's already a full URL, fetch directly
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      return Buffer.from(await response.arrayBuffer());
    }

    // Download from Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('analyses')
      .download(filePath);

    if (error) {
      throw error;
    }

    return Buffer.from(await data.arrayBuffer());
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

/**
 * Create a frame with overlay (score and date)
 */
async function createFrame(
  imageBuffer: Buffer,
  score: number,
  date: string,
  resolution: { width: number; height: number }
): Promise<Buffer> {
  const { width, height } = resolution;

  // Resize and crop image to fit resolution
  const processedImage = await sharp(imageBuffer)
    .resize(width, height, {
      fit: 'cover',
      position: 'center',
    })
    .toBuffer();

  // Create overlay SVG for score and date
  const overlaySvg = `
    <svg width="${width}" height="${height}">
      <defs>
        <linearGradient id="overlayGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:transparent;stop-opacity:0" />
          <stop offset="70%" style="stop-color:black;stop-opacity:0.7" />
          <stop offset="100%" style="stop-color:black;stop-opacity:0.9" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height * 0.3}" y="${height * 0.7}" fill="url(#overlayGradient)" />
      <text x="${width / 2}" y="${height - 80}" font-family="Inter, sans-serif" font-size="48" font-weight="700" fill="#D4AF37" text-anchor="middle">
        ${score.toFixed(1)}
      </text>
      <text x="${width / 2}" y="${height - 30}" font-family="Inter, sans-serif" font-size="24" fill="white" text-anchor="middle">
        ${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </text>
    </svg>
  `;

  // Composite overlay onto image
  const frame = await sharp(processedImage)
    .composite([
      {
        input: Buffer.from(overlaySvg),
        top: 0,
        left: 0,
      },
    ])
    .toBuffer();

  return frame;
}

/**
 * Generate timelapse video from analyses
 * Returns individual frames that can be combined into a video
 */
export async function generateTimelapseVideo(
  analyses: Analysis[],
  options: TimelapseOptions = {}
): Promise<Buffer[]> {
  const {
    duration = Math.min(10, Math.max(3, analyses.length * 0.5)), // 0.5s per image, max 10s
    showScores = true,
    showDates = true,
    resolution = { width: 1080, height: 1080 },
  } = options;

  if (analyses.length < 2) {
    throw new Error('At least 2 analyses are required for timelapse');
  }

  if (analyses.length > 20) {
    throw new Error('Maximum 20 analyses allowed for timelapse');
  }

  const frames: Buffer[] = [];
  const frameDuration = duration / analyses.length;

  // Generate frames for each analysis
  for (const analysis of analyses) {
    try {
      // Download image
      const imageBuffer = await downloadImage(analysis.image_url);

      // Create frame with overlay
      const frame = await createFrame(
        imageBuffer,
        analysis.score,
        analysis.created_at,
        resolution
      );

      frames.push(frame);
    } catch (error) {
      console.error(`Error processing analysis ${analysis.id}:`, error);
      // Continue with other frames even if one fails
    }
  }

  return frames;
}

/**
 * Upload frames to storage and return signed URLs
 * Frames are returned immediately for preview, while video generation
 * happens in the background or on-demand via client-side Canvas/MediaRecorder
 */
export async function uploadFramesToStorage(
  frames: Buffer[],
  userId: string
): Promise<string[]> {
  const urls: string[] = [];
  const timestamp = Date.now();

  for (let i = 0; i < frames.length; i++) {
    const fileName = `timelapses/${userId}/${timestamp}/frame_${i.toString().padStart(3, '0')}.png`;

    const { data, error } = await supabaseAdmin.storage
      .from('timelapses')
      .upload(fileName, frames[i], {
        contentType: 'image/png',
        upsert: false,
      });

    if (error) {
      console.error(`Error uploading frame ${i}:`, error);
      continue;
    }

    // Get signed URL (expires in 1 hour) for private bucket
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('timelapses')
      .createSignedUrl(fileName, 3600); // 1 hour expiry

    if (signedUrlError) {
      console.error(`Error creating signed URL for frame ${i}:`, signedUrlError);
      continue;
    }

    if (signedUrlData?.signedUrl) {
      urls.push(signedUrlData.signedUrl);
    }
  }

  return urls;
}

