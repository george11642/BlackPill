/**
 * Timelapse Edge Function - Generate timelapse videos from analyses
 *
 * Actions (via query param ?action=):
 * - generate: Create timelapse from selected analyses
 * - get: Get timelapse status/data
 * - list: List user's timelapses
 * - music: Get available music tracks
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  handleCors,
  getAuthUser,
  getRequestId,
  createResponseWithId,
  createErrorResponse,
  getSupabaseAdmin,
} from "../_shared/index.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCors();
  }

  const requestId = getRequestId(req);
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return createErrorResponse(authError || "Authentication failed", 401, requestId);
    }

    const supabaseAdmin = getSupabaseAdmin();

    switch (action) {
      case "generate":
        return await handleGenerate(req, user, supabaseAdmin, requestId);
      case "get":
        return await handleGet(req, user, supabaseAdmin, requestId);
      case "list":
        return await handleList(user, supabaseAdmin, requestId);
      case "music":
        return await handleMusic(supabaseAdmin, requestId);
      default:
        return createErrorResponse(
          "Invalid action. Use: generate, get, list, music",
          400,
          requestId
        );
    }
  } catch (error) {
    console.error("[timelapse] Error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500,
      requestId
    );
  }
});

// ============ GENERATE TIMELAPSE ============
async function handleGenerate(
  req: Request,
  user: any,
  supabaseAdmin: any,
  requestId: string
) {
  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405, requestId);
  }

  const body = await req.json();
  const { analysis_ids, options } = body;

  if (!analysis_ids || !Array.isArray(analysis_ids) || analysis_ids.length < 2) {
    return createErrorResponse("At least 2 analysis IDs are required", 400, requestId);
  }

  if (analysis_ids.length > 20) {
    return createErrorResponse("Maximum 20 analyses allowed", 400, requestId);
  }

  // Fetch analyses from database
  const { data: analyses, error: fetchError } = await supabaseAdmin
    .from("analyses")
    .select("id, image_url, overall_score, created_at")
    .eq("user_id", user.id)
    .in("id", analysis_ids)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (fetchError) {
    throw fetchError;
  }

  if (!analyses || analyses.length < 2) {
    return createErrorResponse("Could not find valid analyses", 404, requestId);
  }

  // Generate signed URLs for each image
  const framesWithUrls = await Promise.all(
    analyses.map(async (analysis: any) => {
      if (analysis.image_url) {
        try {
          let filePath: string | null = null;

          // Extract file path from various URL formats
          if (analysis.image_url.includes("/storage/v1/object/sign/analyses/")) {
            const match = analysis.image_url.match(/\/storage\/v1\/object\/sign\/analyses\/([^?]+)/);
            if (match) filePath = match[1];
          } else if (analysis.image_url.includes("/storage/v1/object/public/analyses/")) {
            const match = analysis.image_url.match(/\/storage\/v1\/object\/public\/analyses\/([^?]+)/);
            if (match) filePath = match[1];
          } else if (!analysis.image_url.startsWith("http")) {
            filePath = analysis.image_url;
          }

          if (filePath) {
            const { data: signedUrlData } = await supabaseAdmin.storage
              .from("analyses")
              .createSignedUrl(filePath, 3600);

            if (signedUrlData) {
              return {
                ...analysis,
                frame_url: signedUrlData.signedUrl,
              };
            }
          }
        } catch (error) {
          console.error("Error generating signed URL:", error);
        }
      }
      return { ...analysis, frame_url: analysis.image_url };
    })
  );

  // Calculate duration
  const duration = options?.duration || Math.min(10, Math.max(3, analyses.length * 0.5));

  // Generate timelapse ID
  const timelapseId = crypto.randomUUID();

  // Prepare frame data for client-side rendering
  const frames = framesWithUrls.map((f: any, index: number) => ({
    index,
    url: f.frame_url,
    score: f.overall_score,
    date: f.created_at,
  }));

  // Save timelapse record
  const { error: dbError } = await supabaseAdmin.from("user_timelapses").insert({
    id: timelapseId,
    user_id: user.id,
    analysis_ids: analysis_ids,
    frame_urls: frames.map((f: any) => f.url),
    duration: duration,
    status: "frames_ready",
    created_at: new Date().toISOString(),
  });

  if (dbError) {
    console.error("Error saving timelapse:", dbError);
  }

  // Try to generate video via Cloudinary if configured
  const cloudinaryCloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
  const cloudinaryApiKey = Deno.env.get("CLOUDINARY_API_KEY");
  const cloudinaryApiSecret = Deno.env.get("CLOUDINARY_API_SECRET");

  let videoUrl: string | null = null;

  if (cloudinaryCloudName && cloudinaryApiKey && cloudinaryApiSecret) {
    try {
      // Upload frames to Cloudinary and create slideshow
      videoUrl = await createCloudinarySlideshow(
        frames,
        {
          cloudName: cloudinaryCloudName,
          apiKey: cloudinaryApiKey,
          apiSecret: cloudinaryApiSecret,
        },
        user.id,
        duration
      );

      if (videoUrl) {
        await supabaseAdmin
          .from("user_timelapses")
          .update({ video_url: videoUrl, status: "ready" })
          .eq("id", timelapseId);
      }
    } catch (cloudinaryError) {
      console.error("Cloudinary error:", cloudinaryError);
      // Continue without video - client will do slideshow
    }
  }

  return createResponseWithId(
    {
      timelapse_id: timelapseId,
      frames,
      duration,
      frame_count: frames.length,
      video_url: videoUrl,
      status: videoUrl ? "ready" : "frames_ready",
      message: videoUrl
        ? "Timelapse video ready"
        : "Frames ready for client-side slideshow",
    },
    200,
    requestId
  );
}

// ============ GET TIMELAPSE ============
async function handleGet(
  req: Request,
  user: any,
  supabaseAdmin: any,
  requestId: string
) {
  const url = new URL(req.url);
  const timelapseId = url.searchParams.get("id");

  if (!timelapseId) {
    return createErrorResponse("Timelapse ID required", 400, requestId);
  }

  const { data: timelapse, error } = await supabaseAdmin
    .from("user_timelapses")
    .select("*")
    .eq("id", timelapseId)
    .eq("user_id", user.id)
    .single();

  if (error || !timelapse) {
    return createErrorResponse("Timelapse not found", 404, requestId);
  }

  // Refresh signed URLs if needed
  if (timelapse.frame_urls && timelapse.frame_urls.length > 0) {
    const refreshedUrls = await Promise.all(
      timelapse.frame_urls.map(async (url: string) => {
        // Check if URL is expired or needs refresh
        if (url.includes("token=") && !url.includes("supabase.co")) {
          return url; // Already a valid URL
        }
        // Try to create new signed URL
        try {
          const match = url.match(/analyses\/([^?]+)/);
          if (match) {
            const { data } = await supabaseAdmin.storage
              .from("analyses")
              .createSignedUrl(match[1], 3600);
            return data?.signedUrl || url;
          }
        } catch {
          // Keep original URL
        }
        return url;
      })
    );
    timelapse.frame_urls = refreshedUrls;
  }

  return createResponseWithId(timelapse, 200, requestId);
}

// ============ LIST TIMELAPSES ============
async function handleList(
  user: any,
  supabaseAdmin: any,
  requestId: string
) {
  const { data: timelapses, error } = await supabaseAdmin
    .from("user_timelapses")
    .select("id, created_at, duration, status, video_url")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }

  return createResponseWithId({ timelapses: timelapses || [] }, 200, requestId);
}

// ============ MUSIC TRACKS ============
async function handleMusic(supabaseAdmin: any, requestId: string) {
  // Return available music tracks from database or static list
  const { data: tracks, error } = await supabaseAdmin
    .from("timelapse_music")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    // Fallback to static tracks
    return createResponseWithId(
      {
        tracks: [
          { id: "epic", name: "Epic Journey", duration: 30, url: null },
          { id: "motivational", name: "Motivational", duration: 30, url: null },
          { id: "cinematic", name: "Cinematic", duration: 30, url: null },
          { id: "none", name: "No Music", duration: 0, url: null },
        ],
      },
      200,
      requestId
    );
  }

  return createResponseWithId({ tracks: tracks || [] }, 200, requestId);
}

// ============ CLOUDINARY HELPER ============
async function createCloudinarySlideshow(
  frames: { url: string; score: number; date: string }[],
  config: { cloudName: string; apiKey: string; apiSecret: string },
  userId: string,
  duration: number
): Promise<string | null> {
  try {
    const { cloudName, apiKey, apiSecret } = config;
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `blackpill/timelapses/${userId}`;

    // Upload frames to Cloudinary
    const uploadedIds: string[] = [];

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const publicId = `${folder}/frame_${timestamp}_${i.toString().padStart(3, "0")}`;

      // Fetch the image
      const imageResponse = await fetch(frame.url);
      if (!imageResponse.ok) continue;

      const imageBlob = await imageResponse.blob();
      const imageBase64 = await blobToBase64(imageBlob);

      // Generate signature for upload
      const paramsToSign = `folder=${folder}&public_id=frame_${timestamp}_${i.toString().padStart(3, "0")}&timestamp=${timestamp}`;
      const signature = await generateCloudinarySignature(paramsToSign, apiSecret);

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", `data:image/jpeg;base64,${imageBase64}`);
      formData.append("folder", folder);
      formData.append("public_id", `frame_${timestamp}_${i.toString().padStart(3, "0")}`);
      formData.append("timestamp", timestamp.toString());
      formData.append("api_key", apiKey);
      formData.append("signature", signature);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        uploadedIds.push(result.public_id);
      }
    }

    if (uploadedIds.length < 2) {
      return null;
    }

    // Generate slideshow URL using Cloudinary transformations
    const durationPerImage = duration / uploadedIds.length;
    const videoUrl = `https://res.cloudinary.com/${cloudName}/video/upload/` +
      `w_1080,h_1080,c_fill,du_${durationPerImage},e_loop/` +
      `${uploadedIds[0]}.mp4`;

    return videoUrl;
  } catch (error) {
    console.error("Cloudinary slideshow error:", error);
    return null;
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function generateCloudinarySignature(
  paramsToSign: string,
  apiSecret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(paramsToSign + apiSecret);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
