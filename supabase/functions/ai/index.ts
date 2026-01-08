/**
 * AI Edge Function - Consolidated AI operations
 *
 * Actions:
 * - analyze: Facial photo analysis (OpenAI Vision + Supabase Storage transforms)
 * - coach: AI coach chat (OpenAI)
 * - recommend: Product recommendations (OpenAI)
 * - insights: Generate user insights (OpenAI)
 * - routines: Generate routines (OpenAI)
 * - transform: AI image transformation (Replicate)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.20.1";
import {
  handleCors,
  getAuthUser,
  getRequestId,
  createResponseWithId,
  createErrorResponse,
  getSupabaseAdmin,
  checkScansRemaining,
  analyzeRateLimit,
  analyzeFacialAttractiveness,
} from "../_shared/index.ts";

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

const model = Deno.env.get("OPENAI_MODEL") || "gpt-4o";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCors();
  }

  const requestId = getRequestId(req);
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    const { user, error } = await getAuthUser(req);
    if (error || !user) {
      return createErrorResponse(error || "Authentication failed", 401, requestId);
    }

    const supabaseAdmin = getSupabaseAdmin();

    switch (action) {
      case "analyze":
        return await handleAnalyze(req, user, supabaseAdmin, requestId);
      case "coach":
        return await handleCoach(req, user, supabaseAdmin, requestId);
      case "recommend":
        return await handleRecommend(req, user, supabaseAdmin, requestId);
      case "insights":
        return await handleInsights(req, user, supabaseAdmin, requestId);
      case "routines":
        return await handleRoutines(req, user, supabaseAdmin, requestId);
      case "transform":
        return await handleTransform(req, user, supabaseAdmin, requestId);
      default:
        return createErrorResponse(
          "Invalid action. Use: analyze, coach, recommend, insights, routines, transform",
          400,
          requestId
        );
    }
  } catch (error) {
    console.error("[ai] Error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500,
      requestId
    );
  }
});

// ============ ANALYZE ============
async function handleAnalyze(
  req: Request,
  user: any,
  supabaseAdmin: any,
  requestId: string
) {
  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405, requestId);
  }

  // Check scans remaining
  const { tier, scansRemaining } = await checkScansRemaining(user.id);

  if (scansRemaining <= 0 && tier !== "elite") {
    return createErrorResponse(
      "Insufficient scans remaining. Please upgrade your subscription to continue.",
      402,
      requestId
    );
  }

  // Check rate limit
  await analyzeRateLimit(user.id, tier);

  // Parse form data
  const formData = await req.formData();
  const imageFile = formData.get("image") as File | null;

  if (!imageFile) {
    return createErrorResponse("No image provided", 400, requestId);
  }

  // Validate file type
  if (!imageFile.type || !imageFile.type.startsWith("image/")) {
    return createErrorResponse("Only image files are allowed", 400, requestId);
  }

  // Validate file size (must be > 0 and < 10MB for raw upload)
  const maxSize = 10 * 1024 * 1024; // 10MB for raw (will be resized via transform)
  if (imageFile.size === 0) {
    return createErrorResponse(
      "Image file is empty. Please try taking the photo again.",
      400,
      requestId
    );
  }

  if (imageFile.size > maxSize) {
    return createErrorResponse("Image must be less than 10MB", 400, requestId);
  }

  // Convert File to Uint8Array for Supabase upload
  const arrayBuffer = await imageFile.arrayBuffer();
  const imageData = new Uint8Array(arrayBuffer);

  // Generate unique filename
  const fileId = crypto.randomUUID();
  const fileName = `${user.id}/${fileId}.jpg`;

  // Upload raw image to Supabase Storage
  const { error: uploadError } = await supabaseAdmin.storage
    .from("analyses")
    .upload(fileName, imageData, {
      contentType: imageFile.type,
      cacheControl: "3600",
    });

  if (uploadError) {
    console.error("[analyze] Upload error:", uploadError);
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  // Get signed URL with transform for OpenAI (resize to 1920x1920, contain)
  // TTL: 7 days (604800 seconds) to prevent expired URLs in history
  const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
    .from("analyses")
    .createSignedUrl(fileName, 604800, {
      transform: {
        width: 1920,
        height: 1920,
        resize: "contain",
        quality: 85,
      },
    });

  if (signedUrlError || !signedUrlData) {
    throw new Error(`Failed to create signed URL: ${signedUrlError?.message || "Unknown error"}`);
  }

  const imageUrl = signedUrlData.signedUrl;

  // Analyze with OpenAI Vision API
  const analysisResult = await analyzeFacialAttractiveness(imageUrl);

  // Get signed URL with transform for thumbnail (200x200, cover)
  // TTL: 7 days (604800 seconds) to prevent expired URLs in history
  const { data: thumbSignedUrlData, error: thumbSignedUrlError } = await supabaseAdmin.storage
    .from("analyses")
    .createSignedUrl(fileName, 604800, {
      transform: {
        width: 200,
        height: 200,
        resize: "cover",
        quality: 80,
      },
    });

  let thumbnailUrl: string | null = null;
  if (!thumbSignedUrlError && thumbSignedUrlData) {
    thumbnailUrl = thumbSignedUrlData.signedUrl;
  }

  // Save analysis to database
  const { data: analysis, error: dbError } = await supabaseAdmin
    .from("analyses")
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

  // Decrement scans remaining (unless elite)
  if (tier !== "elite") {
    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("total_scans_used")
      .eq("id", user.id)
      .single();

    const currentTotalScans = currentUser?.total_scans_used || 0;

    await supabaseAdmin
      .from("users")
      .update({
        scans_remaining: scansRemaining - 1,
        total_scans_used: currentTotalScans + 1,
      })
      .eq("id", user.id);
  }

  // Get updated scans remaining
  const { data: userData } = await supabaseAdmin
    .from("users")
    .select("scans_remaining")
    .eq("id", user.id)
    .single();

  // Check if this is user's first scan
  const { count: analysisCount } = await supabaseAdmin
    .from("analyses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const isFirstScan = (analysisCount || 0) === 1;

  // Check and unlock achievements
  const unlockedAchievements = await checkAchievements(
    supabaseAdmin,
    user.id,
    analysis.score,
    isFirstScan
  );

  // Update goals based on analysis
  const goalUpdateResult = await updateGoals(
    supabaseAdmin,
    user.id,
    analysis.score,
    analysis.breakdown
  );

  return createResponseWithId(
    {
      analysis_id: analysis.id,
      score: analysis.score,
      breakdown: analysis.breakdown,
      tips: analysis.tips,
      scans_remaining: userData?.scans_remaining || 0,
      goals_updated: goalUpdateResult.updatedGoals.length > 0,
      completed_milestones: goalUpdateResult.completedMilestones,
      completed_goals: goalUpdateResult.updatedGoals
        .filter((g: any) => g.goal_completed)
        .map((g: any) => g.id),
      unlocked_achievements: unlockedAchievements,
    },
    200,
    requestId
  );
}

// Helper: Check and unlock achievements
async function checkAchievements(
  supabaseAdmin: any,
  userId: string,
  score: number,
  isFirstScan: boolean
) {
  const unlocked: Array<{ key: string; name: string; emoji: string; description: string }> = [];

  try {
    // Get user's current achievements
    const { data: existingAchievements } = await supabaseAdmin
      .from("user_achievements")
      .select("achievement_key")
      .eq("user_id", userId);

    const existingKeys = new Set((existingAchievements || []).map((a: any) => a.achievement_key));

    // Define achievement checks
    const achievementChecks = [
      {
        key: "first_scan",
        name: "First Steps",
        emoji: "📸",
        description: "Complete your first analysis",
        condition: isFirstScan,
      },
      {
        key: "score_8_plus",
        name: "Rising Star",
        emoji: "⭐",
        description: "Achieve a score of 8.0 or higher",
        condition: score >= 8.0,
      },
      {
        key: "score_9_plus",
        name: "Elite Status",
        emoji: "👑",
        description: "Achieve a score of 9.0 or higher",
        condition: score >= 9.0,
      },
    ];

    for (const check of achievementChecks) {
      if (check.condition && !existingKeys.has(check.key)) {
        await supabaseAdmin.from("user_achievements").insert({
          user_id: userId,
          achievement_key: check.key,
        });
        unlocked.push({
          key: check.key,
          name: check.name,
          emoji: check.emoji,
          description: check.description,
        });
      }
    }

    // Check scan count achievements
    const { count: scanCount } = await supabaseAdmin
      .from("analyses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const scanAchievements = [
      { key: "scans_5", name: "Getting Started", emoji: "📊", description: "Complete 5 analyses", threshold: 5 },
      { key: "scans_10", name: "Committed", emoji: "🎯", description: "Complete 10 analyses", threshold: 10 },
      { key: "scans_25", name: "Dedicated", emoji: "💪", description: "Complete 25 analyses", threshold: 25 },
      { key: "scans_50", name: "Obsessed", emoji: "🔥", description: "Complete 50 analyses", threshold: 50 },
    ];

    for (const sa of scanAchievements) {
      if ((scanCount || 0) >= sa.threshold && !existingKeys.has(sa.key)) {
        await supabaseAdmin.from("user_achievements").insert({
          user_id: userId,
          achievement_key: sa.key,
        });
        unlocked.push({
          key: sa.key,
          name: sa.name,
          emoji: sa.emoji,
          description: sa.description,
        });
      }
    }
  } catch (error) {
    console.error("[analyze] Achievement check error:", error);
  }

  return unlocked;
}

// Helper: Update goals based on analysis
async function updateGoals(
  supabaseAdmin: any,
  userId: string,
  score: number,
  breakdown: Record<string, number>
) {
  const updatedGoals: any[] = [];
  const completedMilestones: any[] = [];

  try {
    // Get active goals for user
    const { data: goals } = await supabaseAdmin
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active");

    if (!goals || goals.length === 0) {
      return { updatedGoals, completedMilestones };
    }

    for (const goal of goals) {
      let currentValue = score;

      // If goal targets specific breakdown category
      if (goal.target_category && breakdown[goal.target_category] !== undefined) {
        currentValue = breakdown[goal.target_category];
      }

      // Update progress
      const progress = Math.min((currentValue / goal.target_value) * 100, 100);
      const isCompleted = currentValue >= goal.target_value;

      const { data: updatedGoal } = await supabaseAdmin
        .from("goals")
        .update({
          current_value: currentValue,
          progress_percentage: progress,
          status: isCompleted ? "completed" : "active",
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq("id", goal.id)
        .select()
        .single();

      if (updatedGoal) {
        updatedGoals.push({ ...updatedGoal, goal_completed: isCompleted });
      }

      // Check milestones
      const { data: milestones } = await supabaseAdmin
        .from("goal_milestones")
        .select("*")
        .eq("goal_id", goal.id)
        .eq("is_completed", false)
        .lte("target_value", currentValue);

      for (const milestone of milestones || []) {
        await supabaseAdmin
          .from("goal_milestones")
          .update({ is_completed: true, completed_at: new Date().toISOString() })
          .eq("id", milestone.id);
        completedMilestones.push(milestone);
      }
    }
  } catch (error) {
    console.error("[analyze] Goal update error:", error);
  }

  return { updatedGoals, completedMilestones };
}

// ============ COACH ============
async function handleCoach(
  req: Request,
  user: any,
  supabaseAdmin: any,
  requestId: string
) {
  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405, requestId);
  }

  const body = await req.json();
  const { conversationId, message } = body;

  if (!message || message.trim().length === 0) {
    return createErrorResponse("Message is required", 400, requestId);
  }

  // Get or create conversation
  let conversation;
  if (conversationId) {
    const { data, error } = await supabaseAdmin
      .from("ai_conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      return createErrorResponse("Conversation not found", 404, requestId);
    }
    conversation = data;
  } else {
    const { data, error } = await supabaseAdmin
      .from("ai_conversations")
      .insert({ user_id: user.id, title: message.substring(0, 50) })
      .select()
      .single();
    if (error) throw error;
    conversation = data;
  }

  // Get conversation history
  const { data: messages } = await supabaseAdmin
    .from("ai_messages")
    .select("role, content")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true });

  // Get user context
  const { data: latestAnalysis } = await supabaseAdmin
    .from("analyses")
    .select("score, breakdown")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const weakAreas = latestAnalysis?.breakdown
    ? Object.entries(latestAnalysis.breakdown)
        .filter(([_, value]) => (value as number) < 7.0)
        .map(([key]) => key)
        .join(", ")
    : "none";

  const systemPrompt = `You are a supportive looksmaxxing coach for BlackPill.
User context:
- Latest score: ${latestAnalysis?.score || "N/A"}/10
- Weak areas: ${weakAreas || "none"}
Be constructive, encouraging, and specific. Keep responses concise (2-3 sentences max).`;

  // Save user message
  await supabaseAdmin.from("ai_messages").insert({
    conversation_id: conversation.id,
    role: "user",
    content: message,
  });

  // Call OpenAI
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      ...(messages || []).map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ],
    temperature: 0.7,
    max_tokens: 300,
  });

  const reply = completion.choices[0].message.content || "";

  // Save assistant message
  await supabaseAdmin.from("ai_messages").insert({
    conversation_id: conversation.id,
    role: "assistant",
    content: reply,
    tokens_used: completion.usage?.total_tokens || 0,
  });

  return createResponseWithId(
    { reply, conversationId: conversation.id },
    200,
    requestId
  );
}

// ============ RECOMMEND ============
async function handleRecommend(
  req: Request,
  user: any,
  supabaseAdmin: any,
  requestId: string
) {
  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405, requestId);
  }

  const body = await req.json();
  const { analysisId } = body;

  if (!analysisId) {
    return createErrorResponse("analysisId is required", 400, requestId);
  }

  // Get analysis
  const { data: analysis } = await supabaseAdmin
    .from("analyses")
    .select("score, breakdown")
    .eq("id", analysisId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!analysis) {
    return createErrorResponse("Analysis not found", 404, requestId);
  }

  // Get weak areas
  const weakAreas = Object.entries(analysis.breakdown)
    .filter(([_, value]) => (value as number) < 7.0)
    .map(([key, value]) => ({ category: key, score: value }));

  // Get available products
  const { data: allProducts } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("is_active", true);

  if (!allProducts || allProducts.length === 0) {
    return createResponseWithId(
      { recommendations: [], message: "No products available" },
      200,
      requestId
    );
  }

  const prompt = `Based on this facial analysis:
- Overall score: ${analysis.score}/10
- Weak areas: ${weakAreas.map((a) => `${a.category} (${a.score}/10)`).join(", ")}

Recommend 5-8 products from:
${allProducts.map((p: any) => `- ${p.name} (${p.category}): ${p.description || ""}`).join("\n")}

Return JSON: {"recommendations": [{"product_name": "", "relevance_score": 0.0-1.0, "reason": ""}]}`;

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: "You are a skincare expert. Be honest." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const aiResult = JSON.parse(completion.choices[0].message.content || "{}");
  const recommendations = aiResult.recommendations || [];

  // Match and save recommendations
  const productRecommendations = [];
  for (const rec of recommendations) {
    const product = allProducts.find(
      (p: any) => p.name.toLowerCase() === rec.product_name?.toLowerCase()
    );
    if (product) {
      await supabaseAdmin.from("product_recommendations").insert({
        analysis_id: analysisId,
        product_id: product.id,
        user_id: user.id,
        relevance_score: Math.min(Math.max(parseFloat(rec.relevance_score) || 0.5, 0), 1),
        reason: rec.reason || "Recommended based on your analysis",
      });
      productRecommendations.push({ ...product, recommendation: rec });
    }
  }

  return createResponseWithId({ recommendations: productRecommendations }, 200, requestId);
}

// ============ INSIGHTS ============
async function handleInsights(
  req: Request,
  user: any,
  supabaseAdmin: any,
  requestId: string
) {
  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405, requestId);
  }

  // Get user's analysis history
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: analyses } = await supabaseAdmin
    .from("analyses")
    .select("score, breakdown, created_at")
    .eq("user_id", user.id)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false });

  if (!analyses || analyses.length < 2) {
    return createResponseWithId(
      { insights: [], message: "Need at least 2 analyses" },
      200,
      requestId
    );
  }

  const avgScore = analyses.reduce((sum: number, a: any) => sum + parseFloat(a.score), 0) / analyses.length;
  const trend = parseFloat(analyses[0].score) > avgScore ? "improving" : "stable";

  const prompt = `Generate 3-5 insights for user data:
- ${analyses.length} analyses in 30 days
- Average: ${avgScore.toFixed(1)}/10
- Trend: ${trend}
- Latest: ${analyses[0].score}/10

Return JSON: {"insights": [{"insight_type": "correlation|timing|progress", "title": "", "description": "", "confidence_score": 0.0-1.0}]}`;

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: "You are a data analyst. Be specific and actionable." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const aiResult = JSON.parse(completion.choices[0].message.content || "{}");
  const insights = aiResult.insights || [];

  // Save insights
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  for (const insight of insights.slice(0, 5)) {
    await supabaseAdmin.from("user_insights").insert({
      user_id: user.id,
      insight_type: insight.insight_type || "correlation",
      title: insight.title,
      description: insight.description,
      confidence_score: Math.min(Math.max(parseFloat(insight.confidence_score) || 0.7, 0), 1),
      expires_at: expiresAt.toISOString(),
    });
  }

  return createResponseWithId({ insights }, 200, requestId);
}

// ============ ROUTINES ============
async function handleRoutines(
  req: Request,
  user: any,
  supabaseAdmin: any,
  requestId: string
) {
  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405, requestId);
  }

  const body = await req.json();
  const { analysisId } = body;

  // Get latest analysis
  let analysis;
  if (analysisId) {
    const { data } = await supabaseAdmin
      .from("analyses")
      .select("score, breakdown, tips")
      .eq("id", analysisId)
      .eq("user_id", user.id)
      .maybeSingle();
    analysis = data;
  } else {
    const { data } = await supabaseAdmin
      .from("analyses")
      .select("score, breakdown, tips")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    analysis = data;
  }

  if (!analysis) {
    return createErrorResponse("No analysis found", 404, requestId);
  }

  const weakAreas = Object.entries(analysis.breakdown)
    .filter(([_, value]) => (value as number) < 7.0)
    .map(([key, value]) => `${key}: ${value}/10`)
    .join(", ");

  const prompt = `Create a personalized improvement routine:
Score: ${analysis.score}/10
Weak areas: ${weakAreas}

Return JSON: {
  "routine_name": "",
  "description": "",
  "tasks": [{"name": "", "description": "", "time_of_day": "morning|evening|anytime", "duration_minutes": 5, "category": "skincare|exercise|grooming|nutrition"}]
}`;

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: "You are a looksmaxxing coach. Create practical routines." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const aiResult = JSON.parse(completion.choices[0].message.content || "{}");

  // Create routine
  const { data: routine, error: routineError } = await supabaseAdmin
    .from("routines")
    .insert({
      user_id: user.id,
      name: aiResult.routine_name || "Custom Routine",
      description: aiResult.description,
      is_active: true,
      is_ai_generated: true,
    })
    .select()
    .single();

  if (routineError) throw routineError;

  // Create tasks
  const tasks = aiResult.tasks || [];
  for (let i = 0; i < tasks.length; i++) {
    await supabaseAdmin.from("routine_tasks").insert({
      routine_id: routine.id,
      name: tasks[i].name,
      description: tasks[i].description,
      time_of_day: tasks[i].time_of_day || "anytime",
      duration_minutes: tasks[i].duration_minutes || 5,
      category: tasks[i].category || "grooming",
      order_index: i,
    });
  }

  return createResponseWithId({ routine, tasks }, 200, requestId);
}

// ============ TRANSFORM ============
async function handleTransform(
  req: Request,
  user: any,
  supabaseAdmin: any,
  requestId: string
) {
  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405, requestId);
  }

  const body = await req.json();
  const { analysisId, scenario = "formal", app_source } = body;
  const isFemale = app_source === "shemax";

  if (!analysisId) {
    return createErrorResponse("analysisId is required", 400, requestId);
  }

  // Get analysis
  const { data: analysis } = await supabaseAdmin
    .from("analyses")
    .select("image_url")
    .eq("id", analysisId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!analysis) {
    return createErrorResponse("Analysis not found", 404, requestId);
  }

  // Check subscription (Elite only)
  const { data: subscription } = await supabaseAdmin
    .from("subscriptions")
    .select("tier")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (subscription?.tier !== "elite") {
    return createErrorResponse("AI transform requires Elite subscription", 403, requestId);
  }

  const scenarios: Record<string, string> = {
    formal: "wearing elegant black tuxedo, luxury gala, professional lighting",
    casual: "stylish streetwear, confident pose, modern fashion",
    fitness: "fit athletic model, defined muscles, athletic wear",
    professional: "business executive, tailored navy suit, professional headshot",
    beach: "tropical beach, golden hour, confident smile",
  };

  const prompt = scenarios[scenario] || scenarios.formal;
  const replicateApiToken = Deno.env.get("REPLICATE_API_TOKEN");

  if (!replicateApiToken) {
    return createResponseWithId(
      { image_url: `https://placehold.co/1024x1024?text=Transform+Preview` },
      200,
      requestId
    );
  }

  // Call Replicate PhotoMaker
  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${replicateApiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: "ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
      input: {
        input_image: analysis.image_url,
        prompt: `A photo of a ${isFemale ? "woman" : "man"} img, ${prompt}`,
        negative_prompt: "nsfw, lowres, bad anatomy",
        num_steps: 50,
        style_strength_ratio: 20,
      },
    }),
  });

  if (!response.ok) {
    return createErrorResponse("Replicate API error", 500, requestId);
  }

  const prediction = await response.json();

  // Poll for completion
  let result = prediction;
  let attempts = 0;
  while (result.status !== "succeeded" && result.status !== "failed" && attempts < 60) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(result.urls.get, {
      headers: { Authorization: `Bearer ${replicateApiToken}` },
    });
    result = await pollRes.json();
    attempts++;
  }

  const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;

  // Save transformation
  await supabaseAdmin.from("ai_transformations").insert({
    user_id: user.id,
    analysis_id: analysisId,
    scenario,
    transformed_image_url: outputUrl,
    original_image_url: analysis.image_url,
  });

  return createResponseWithId({ image_url: outputUrl, scenario }, 200, requestId);
}
