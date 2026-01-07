/**
 * Share Edge Function - Generate share cards and handle sharing
 *
 * Actions (via query param ?action=):
 * - generate-card: Generate share card image for analysis
 * - log: Log share event
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
      case "generate-card":
        return await handleGenerateCard(req, user, supabaseAdmin, requestId);
      case "log":
        return await handleLog(req, user, supabaseAdmin, requestId);
      default:
        return createErrorResponse(
          "Invalid action. Use: generate-card, log",
          400,
          requestId
        );
    }
  } catch (error) {
    console.error("[share] Error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500,
      requestId
    );
  }
});

// ============ GENERATE SHARE CARD ============
async function handleGenerateCard(
  req: Request,
  user: any,
  supabaseAdmin: any,
  requestId: string
) {
  const url = new URL(req.url);
  const analysisId = url.searchParams.get("analysis_id");

  if (!analysisId) {
    return createErrorResponse("Missing analysis_id", 400, requestId);
  }

  // Get analysis
  const { data: analysis, error } = await supabaseAdmin
    .from("analyses")
    .select("*")
    .eq("id", analysisId)
    .eq("user_id", user.id)
    .single();

  if (error || !analysis) {
    return createErrorResponse("Analysis not found", 404, requestId);
  }

  // Get user's referral code
  const { data: affiliate } = await supabaseAdmin
    .from("affiliates")
    .select("referral_code")
    .eq("user_id", user.id)
    .single();

  const referralCode = affiliate?.referral_code || "";
  const score = analysis.overall_score || analysis.score || 0;
  const breakdown = analysis.facial_features || analysis.breakdown || {};

  // Check if Cloudinary is configured
  const cloudinaryCloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");

  let imageUrl: string;

  if (cloudinaryCloudName) {
    // Generate share card using Cloudinary's dynamic image transformations
    imageUrl = generateCloudinaryShareCard(
      cloudinaryCloudName,
      score,
      breakdown,
      referralCode
    );
  } else {
    // Fallback: Generate a simple SVG-based card stored in Supabase
    const svgCard = generateSvgShareCard(score, breakdown, referralCode);

    // Upload SVG to Supabase Storage
    const fileName = `share-cards/${analysisId}.svg`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("analyses")
      .upload(fileName, svgCard, {
        contentType: "image/svg+xml",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      // Return data for client-side rendering
      return createResponseWithId(
        {
          analysis_id: analysisId,
          score,
          breakdown,
          referral_code: referralCode,
          share_url: `https://black-pill.app/ref/${referralCode}`,
          render_client_side: true,
        },
        200,
        requestId
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("analyses")
      .getPublicUrl(fileName);

    imageUrl = publicUrlData?.publicUrl || "";
  }

  // Log share event
  await supabaseAdmin.from("share_logs").insert({
    user_id: user.id,
    analysis_id: analysisId,
    platform: "generated",
  }).catch((e: any) => console.error("Share log error:", e));

  return createResponseWithId(
    {
      image_url: imageUrl,
      share_url: `https://black-pill.app/ref/${referralCode}`,
      analysis_id: analysisId,
    },
    200,
    requestId
  );
}

// ============ LOG SHARE EVENT ============
async function handleLog(
  req: Request,
  user: any,
  supabaseAdmin: any,
  requestId: string
) {
  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405, requestId);
  }

  const body = await req.json();
  const { analysis_id, platform } = body;

  if (!analysis_id) {
    return createErrorResponse("Missing analysis_id", 400, requestId);
  }

  const { error } = await supabaseAdmin.from("share_logs").insert({
    user_id: user.id,
    analysis_id,
    platform: platform || "unknown",
  });

  if (error) {
    console.error("Share log error:", error);
  }

  return createResponseWithId({ logged: true }, 200, requestId);
}

// ============ CLOUDINARY SHARE CARD ============
function generateCloudinaryShareCard(
  cloudName: string,
  score: number,
  breakdown: Record<string, number>,
  referralCode: string
): string {
  // Build Cloudinary URL with text overlays
  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;

  // Create a dynamic share card using Cloudinary transformations
  // This uses a base template image with text overlays
  const transformations = [
    "w_1080,h_1920,c_fill",
    "b_rgb:0F0F1E", // Background color
    // Score overlay
    `l_text:Inter_180_bold:${score.toFixed(1)},co_rgb:FF0080,g_north,y_300`,
    // Title
    `l_text:Inter_36:Attractiveness%20Score,co_rgb:B8BACC,g_north,y_500`,
  ];

  // Add breakdown scores if available
  const categories = ["symmetry", "jawline", "eyes", "lips", "skin"];
  let yOffset = 650;

  for (const cat of categories) {
    if (breakdown[cat]) {
      transformations.push(
        `l_text:Inter_28:${cat.charAt(0).toUpperCase() + cat.slice(1)}%20${breakdown[cat].toFixed(1)},co_rgb:FFFFFF,g_north_west,x_80,y_${yOffset}`
      );
      yOffset += 80;
    }
  }

  // Add referral code if present
  if (referralCode) {
    transformations.push(
      `l_text:Inter_48_bold:${referralCode},co_rgb:00FF41,g_south,y_200`
    );
    transformations.push(
      `l_text:Inter_24:Use%20my%20referral%20code,co_rgb:B8BACC,g_south,y_280`
    );
  }

  // Footer
  transformations.push(
    `l_text:Inter_24:black-pill.app,co_rgb:808080,g_south,y_60`
  );

  return `${baseUrl}/${transformations.join("/")}/blackpill/share-card-base.png`;
}

// ============ SVG SHARE CARD ============
function generateSvgShareCard(
  score: number,
  breakdown: Record<string, number>,
  referralCode: string
): string {
  const categories = [
    { key: "symmetry", label: "Symmetry" },
    { key: "jawline", label: "Jawline" },
    { key: "eyes", label: "Eyes" },
    { key: "lips", label: "Lips" },
    { key: "skin", label: "Skin Quality" },
    { key: "bone_structure", label: "Bone Structure" },
    { key: "hair", label: "Hair Quality" },
  ];

  const breakdownBars = categories
    .filter((c) => breakdown[c.key])
    .map((c, i) => {
      const catScore = breakdown[c.key] || 0;
      const percentage = (catScore / 10) * 100;
      const y = 500 + i * 100;

      return `
        <text x="80" y="${y}" fill="white" font-size="28">${c.label}</text>
        <text x="1000" y="${y}" fill="#00D9FF" font-size="28" text-anchor="end">${catScore.toFixed(1)}</text>
        <rect x="80" y="${y + 15}" width="920" height="8" rx="4" fill="rgba(255,255,255,0.1)"/>
        <rect x="80" y="${y + 15}" width="${percentage * 9.2}" height="8" rx="4" fill="url(#gradient)"/>
      `;
    })
    .join("");

  const referralSection = referralCode
    ? `
      <text x="540" y="1650" fill="#B8BACC" font-size="24" text-anchor="middle">Use my referral code:</text>
      <rect x="340" y="1680" width="400" height="80" rx="12" fill="rgba(0,255,65,0.1)" stroke="#00FF41" stroke-width="2"/>
      <text x="540" y="1735" fill="#00FF41" font-size="48" font-weight="bold" text-anchor="middle" font-family="monospace">${referralCode}</text>
    `
    : "";

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#0F0F1E"/>
          <stop offset="100%" style="stop-color:#1A1A2E"/>
        </linearGradient>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#FF0080"/>
          <stop offset="100%" style="stop-color:#00D9FF"/>
        </linearGradient>
        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FF0080"/>
          <stop offset="100%" style="stop-color:#00D9FF"/>
        </linearGradient>
      </defs>

      <rect width="1080" height="1920" fill="url(#bg)"/>

      <!-- Score -->
      <text x="540" y="350" fill="url(#scoreGradient)" font-size="180" font-weight="bold" text-anchor="middle" font-family="Inter, sans-serif">${score.toFixed(1)}</text>
      <text x="540" y="420" fill="#B8BACC" font-size="36" text-anchor="middle" font-family="Inter, sans-serif">Attractiveness Score</text>

      <!-- Breakdown -->
      ${breakdownBars}

      <!-- Referral Code -->
      ${referralSection}

      <!-- Footer -->
      <text x="540" y="1860" fill="rgba(184,186,204,0.5)" font-size="24" text-anchor="middle" font-family="Inter, sans-serif">black-pill.app</text>
    </svg>
  `.trim();
}
