/**
 * Web-specific video generation using Canvas + MediaRecorder API
 * This avoids FFmpeg.wasm compatibility issues with Expo's Metro bundler
 * Supports optional background music mixing via Web Audio API
 */

export interface VideoGenerationOptions {
  musicUrl?: string;
  musicVolume?: number; // 0-1, default 0.5
}

/**
 * Load an image from URL using fetch to handle CORS properly
 * Fetches as blob and creates an object URL to bypass CORS restrictions
 */
async function loadImageWithFetch(url: string): Promise<HTMLImageElement> {
  try {
    // Fetch the image as a blob to bypass CORS issues
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Don't revoke URL yet - we need it for drawing
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Failed to decode image from: ${url}`));
      };
      img.src = objectUrl;
    });
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    throw new Error(`Failed to load image: ${url}`);
  }
}

/**
 * Fallback: Load image directly (may fail due to CORS)
 */
function loadImageDirect(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Load image with fallback strategies
 */
async function loadImage(url: string): Promise<HTMLImageElement> {
  // Try fetch first (handles CORS better)
  try {
    return await loadImageWithFetch(url);
  } catch (fetchError) {
    console.warn('Fetch method failed, trying direct load:', fetchError);
    // Fallback to direct loading
    return await loadImageDirect(url);
  }
}

/**
 * Load audio file and decode it
 */
async function loadAudio(url: string, audioContext: AudioContext): Promise<AudioBuffer> {
  try {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  } catch (error) {
    console.error('Error loading audio:', error);
    throw new Error(`Failed to load audio: ${url}`);
  }
}

/**
 * Generate a video from image frames using Canvas and MediaRecorder
 * This is a web-only implementation that works without FFmpeg
 * 
 * @param frameUrls Array of image URLs to include in the video
 * @param duration Total video duration in seconds
 * @param options Optional settings including music
 * @returns Blob of the generated WebM video
 */
export async function generateVideoFromFramesWeb(
  frameUrls: string[],
  duration: number,
  options: VideoGenerationOptions = {}
): Promise<Blob> {
  if (frameUrls.length < 2) {
    throw new Error('At least 2 frames required to generate video');
  }

  // Check for MediaRecorder support
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('MediaRecorder API not supported in this browser');
  }

  console.log('Loading images for web video generation...');
  
  // Load all images first
  const images: HTMLImageElement[] = [];
  const objectUrls: string[] = []; // Track for cleanup
  
  for (let i = 0; i < frameUrls.length; i++) {
    console.log(`Loading frame ${i + 1}/${frameUrls.length}`);
    try {
      const img = await loadImage(frameUrls[i]);
      images.push(img);
      // Track the object URL if it's a blob URL
      if (img.src.startsWith('blob:')) {
        objectUrls.push(img.src);
      }
    } catch (error) {
      console.error(`Failed to load frame ${i}:`, error);
      // Cleanup any loaded images
      objectUrls.forEach(url => URL.revokeObjectURL(url));
      throw new Error(`Failed to load frame ${i + 1}`);
    }
  }

  // Determine canvas size from first image
  const width = images[0].naturalWidth || 720;
  const height = images[0].naturalHeight || 720;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    objectUrls.forEach(url => URL.revokeObjectURL(url));
    throw new Error('Failed to get canvas context');
  }

  // Calculate frame timing
  const fps = Math.max(1, Math.round(images.length / duration));
  const frameDuration = 1000 / fps;

  console.log(`Generating video: ${width}x${height} @ ${fps}fps, ${duration}s duration`);

  // Set up audio context and music if provided
  let audioContext: AudioContext | null = null;
  let audioSource: AudioBufferSourceNode | null = null;
  let audioDestination: MediaStreamAudioDestinationNode | null = null;
  
  if (options.musicUrl) {
    try {
      console.log('Loading background music...');
      audioContext = new AudioContext();
      const audioBuffer = await loadAudio(options.musicUrl, audioContext);
      
      // Create audio source
      audioSource = audioContext.createBufferSource();
      audioSource.buffer = audioBuffer;
      audioSource.loop = true; // Loop if video is longer than music
      
      // Create gain node for volume control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = options.musicVolume ?? 0.5;
      
      // Create destination for MediaRecorder
      audioDestination = audioContext.createMediaStreamDestination();
      
      // Connect: source -> gain -> destination
      audioSource.connect(gainNode);
      gainNode.connect(audioDestination);
      
      console.log('Background music loaded successfully');
    } catch (error) {
      console.warn('Failed to load background music, continuing without audio:', error);
      // Continue without music
      audioContext = null;
      audioSource = null;
      audioDestination = null;
    }
  }

  // Set up MediaRecorder with video stream
  const videoStream = canvas.captureStream(fps);
  
  // Combine video and audio streams if audio is available
  let combinedStream: MediaStream;
  if (audioDestination) {
    const audioTrack = audioDestination.stream.getAudioTracks()[0];
    const videoTrack = videoStream.getVideoTracks()[0];
    combinedStream = new MediaStream([videoTrack, audioTrack]);
    console.log('Combined video and audio streams');
  } else {
    combinedStream = videoStream;
  }
  
  // Try to use VP9 with opus audio, fall back to VP8, then default
  let mimeType = 'video/webm;codecs=vp9,opus';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
    }
  }
  
  console.log(`Using codec: ${mimeType}`);

  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality
    audioBitsPerSecond: 128000, // 128 kbps for audio
  });

  const chunks: Blob[] = [];
  
  return new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      console.log('Recording complete, assembling video...');
      
      // Cleanup
      objectUrls.forEach(url => URL.revokeObjectURL(url));
      if (audioSource) {
        audioSource.stop();
      }
      if (audioContext) {
        audioContext.close();
      }
      
      const blob = new Blob(chunks, { type: 'video/webm' });
      console.log(`Video generated: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
      resolve(blob);
    };

    recorder.onerror = (e) => {
      console.error('MediaRecorder error:', e);
      objectUrls.forEach(url => URL.revokeObjectURL(url));
      if (audioSource) {
        audioSource.stop();
      }
      if (audioContext) {
        audioContext.close();
      }
      reject(new Error('Video recording failed'));
    };

    // Start audio playback if available
    if (audioSource) {
      audioSource.start(0);
    }

    // Start recording
    recorder.start();
    console.log('Recording started...');

    // Draw frames sequentially
    let frameIndex = 0;
    
    const drawFrame = () => {
      if (frameIndex < images.length) {
        // Clear canvas and draw current frame
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        
        // Draw image centered/fitted
        const img = images[frameIndex];
        const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight);
        const scaledWidth = img.naturalWidth * scale;
        const scaledHeight = img.naturalHeight * scale;
        const x = (width - scaledWidth) / 2;
        const y = (height - scaledHeight) / 2;
        
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        
        frameIndex++;
        
        // Schedule next frame
        setTimeout(drawFrame, frameDuration);
      } else {
        // All frames drawn, stop recording after a small delay
        // to ensure the last frame is captured
        setTimeout(() => {
          recorder.stop();
          combinedStream.getTracks().forEach(track => track.stop());
        }, 100);
      }
    };

    // Start drawing frames
    drawFrame();
  });
}

/**
 * Download a blob as a file (web only)
 * Uses data URL approach for better Expo Web compatibility
 */
export async function downloadBlobAsFileWeb(blob: Blob, filename: string): Promise<void> {
  const reader = new FileReader();
  
  return new Promise<void>((resolve, reject) => {
    reader.onloadend = () => {
      try {
        const dataUrl = reader.result as string;
        
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        link.setAttribute('download', filename);
        link.style.cssText = 'position:absolute;left:-9999px;top:-9999px;opacity:0;';
        
        document.body.appendChild(link);
        link.offsetHeight; // Trigger reflow
        link.click();
        
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
 * Check if the current environment supports web video generation
 */
export function isWebVideoGenerationSupported(): boolean {
  return (
    typeof document !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.captureStream === 'function'
  );
}
