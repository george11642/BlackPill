/**
 * Client-side video generation with platform-specific implementations
 * 
 * - Web: Uses Canvas + MediaRecorder API (no FFmpeg dependency)
 * - Native: Falls back to server-side generation (FFmpeg.wasm has ESM issues with Metro)
 */

import { Platform } from 'react-native';

export interface VideoGenerationOptions {
  musicUrl?: string;
  musicVolume?: number; // 0-1, default 0.5
}

/**
 * Generate video from frame URLs
 * Routes to appropriate implementation based on platform
 * 
 * @param frameUrls Array of image URLs
 * @param duration Total video duration in seconds
 * @param options Optional settings including music
 * @returns Blob of the generated video (WebM on web, MP4 on native if supported)
 */
export async function generateVideoFromFramesClient(
  frameUrls: string[],
  duration: number,
  options: VideoGenerationOptions = {}
): Promise<Blob> {
  if (frameUrls.length < 2) {
    throw new Error('At least 2 frames required to generate video');
  }

  if (Platform.OS === 'web') {
    // Use web-specific implementation with Canvas + MediaRecorder
    console.log('Using web video generator (Canvas + MediaRecorder)...');
    const { generateVideoFromFramesWeb, isWebVideoGenerationSupported } = await import('./web-video-generator');
    
    if (!isWebVideoGenerationSupported()) {
      throw new Error('Video generation not supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge.');
    }
    
    return generateVideoFromFramesWeb(frameUrls, duration, options);
  }

  // For native platforms (iOS/Android), client-side video generation is not supported
  // The app should use server-generated video_url instead
  // This is a fallback that throws a helpful error
  throw new Error(
    'Client-side video generation is not available on mobile. ' +
    'Please wait for the server to generate the video, or try on web.'
  );
}

/**
 * Download blob as file (works on web only)
 * Uses a data URL approach which works better in Expo Web
 */
export async function downloadBlobAsFile(blob: Blob, filename: string) {
  if (Platform.OS !== 'web') {
    console.warn('downloadBlobAsFile is only supported on web');
    return;
  }
  
  // Check if we can use msSaveOrOpenBlob (IE/Edge legacy)
  const nav = window.navigator as any;
  if (nav.msSaveOrOpenBlob) {
    nav.msSaveOrOpenBlob(blob, filename);
    return;
  }
  
  // Convert blob to data URL - this works more reliably in Expo Web
  const reader = new FileReader();
  
  return new Promise<void>((resolve, reject) => {
    reader.onloadend = () => {
      try {
        const dataUrl = reader.result as string;
        
        // Create download link with data URL
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        link.setAttribute('download', filename);
        
        // Style to ensure it's not visible but still functional
        link.style.cssText = 'position:absolute;left:-9999px;top:-9999px;opacity:0;pointer-events:none;';
        
        // Append to body
        document.body.appendChild(link);
        
        // Force the browser to recognize the element
        link.offsetHeight; // Trigger reflow
        
        // Click to download
        link.click();
        
        // Cleanup after a delay
        setTimeout(() => {
          if (link.parentNode) {
            document.body.removeChild(link);
          }
          resolve();
        }, 1000);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert blob to base64 string for sharing
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Check if client-side video generation is available
 */
export async function isClientVideoGenerationAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') {
    const { isWebVideoGenerationSupported } = await import('./web-video-generator');
    return isWebVideoGenerationSupported();
  }
  // Native platforms don't support client-side generation
  return false;
}
