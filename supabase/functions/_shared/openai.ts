/**
 * AI utilities for Edge Functions
 * Uses Google Gemini for vision analysis, OpenAI for chat
 */

import OpenAI from "https://esm.sh/openai@4.70.0";

// Gemini config for vision analysis
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "AIzaSyDXywy_X3ngpdbPLOKxxMR8-wiQ1gIvWIU";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";

// OpenAI config for chat
let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (_openai) return _openai;

  const apiKey = Deno.env.get("OPENAI_API_KEY");

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  _openai = new OpenAI({ apiKey });
  return _openai;
}

// Feature analysis with score, description, and improvement tip
interface FeatureAnalysis {
  score: number;
  description: string;
  improvement: string;
}

export interface FacialAnalysisResult {
  score: number;
  breakdown: {
    masculinity: FeatureAnalysis;
    symmetry: FeatureAnalysis;
    jawline: FeatureAnalysis;
    cheekbones: FeatureAnalysis;
    eyes: FeatureAnalysis;
    lips: FeatureAnalysis;
    skin: FeatureAnalysis;
    hair: FeatureAnalysis;
  };
  tips: Array<{
    title: string;
    description: string;
    timeframe: string;
    priority?: "high" | "medium" | "low";
  }>;
  strengths?: string[];
  areasForImprovement?: string[];
}

/**
 * Analyze facial features using Google Gemini Vision API
 * @param imageData - Either a URL string or base64 encoded image data
 * @param mimeType - Required when passing base64 data (e.g., "image/jpeg")
 */
export async function analyzeFacialAttractiveness(
  imageData: string,
  mimeType?: string
): Promise<FacialAnalysisResult> {
  // Determine if input is URL or base64
  const isBase64 = mimeType !== undefined;

  console.log("[Gemini] Image input type:", isBase64 ? "base64" : "url");
  if (isBase64) {
    console.log("[Gemini] Base64 data preview:", imageData.substring(0, 50) + "...");
    console.log("[Gemini] Base64 length:", imageData.length);
  }

  const prompt = `You are an expert facial aesthetics analyst using strict professional standards. Analyze this facial photo and provide a detailed, honest assessment.

SCORING GUIDELINES (be strict - most people score 4.0-6.0):
- 9.0-10.0: Model-tier, exceptional genetics (top 1%)
- 7.5-8.9: Very attractive, well above average (top 10%)
- 6.0-7.4: Above average, good-looking (top 30%)
- 4.5-5.9: Average, typical features (middle 40%)
- 3.0-4.4: Below average (bottom 30%)
- 1.0-2.9: Significant room for improvement

Evaluate these aspects on a scale of 1.0-10.0 (use ONE decimal place, e.g., 5.2, 6.5, 4.8):
1. Masculinity - overall masculine appearance, strong features, dominance signals
2. Symmetry - how balanced are the facial features
3. Jawline - definition and structure
4. Cheekbones - prominence and structure
5. Eyes - size, shape, and positioning
6. Lips - fullness and proportions
7. Skin - texture, clarity, and complexion
8. Hair - quality, texture, and styling

VALIDATION:
- If no face is clearly visible, respond with: {"error": "No face detected", "message": "Please upload a clear photo of your face"}
- If multiple faces are detected, respond with: {"error": "Multiple faces", "message": "Please upload a photo with only one person"}
- If the image is blurry, respond with: {"error": "blurred", "message": "Please upload a clearer photo"}

For valid photos, respond ONLY with this JSON (no other text):
{
  "score": <overall score with 1 decimal, e.g., 7.3>,
  "breakdown": {
    "masculinity": {
      "score": <score with 1 decimal>,
      "description": "<1-2 sentence UNIQUE analysis specific to THIS person's masculine features>",
      "improvement": "<specific actionable tip to improve this feature>"
    },
    "symmetry": {
      "score": <score with 1 decimal>,
      "description": "<1-2 sentence UNIQUE analysis specific to THIS person's symmetry>",
      "improvement": "<specific actionable tip to improve this feature>"
    },
    "jawline": {
      "score": <score with 1 decimal>,
      "description": "<1-2 sentence UNIQUE analysis specific to THIS person's jawline>",
      "improvement": "<specific actionable tip to improve this feature>"
    },
    "cheekbones": {
      "score": <score with 1 decimal>,
      "description": "<1-2 sentence UNIQUE analysis specific to THIS person's cheekbones>",
      "improvement": "<specific actionable tip to improve this feature>"
    },
    "eyes": {
      "score": <score with 1 decimal>,
      "description": "<1-2 sentence UNIQUE analysis specific to THIS person's eyes>",
      "improvement": "<specific actionable tip to improve this feature>"
    },
    "lips": {
      "score": <score with 1 decimal>,
      "description": "<1-2 sentence UNIQUE analysis specific to THIS person's lips>",
      "improvement": "<specific actionable tip to improve this feature>"
    },
    "skin": {
      "score": <score with 1 decimal>,
      "description": "<1-2 sentence UNIQUE analysis specific to THIS person's skin>",
      "improvement": "<specific actionable tip to improve this feature>"
    },
    "hair": {
      "score": <score with 1 decimal>,
      "description": "<1-2 sentence UNIQUE analysis specific to THIS person's hair>",
      "improvement": "<specific actionable tip to improve this feature>"
    }
  },
  "tips": [
    {
      "category": "<category name>",
      "tip": "<specific actionable recommendation>",
      "priority": "high|medium|low",
      "timeframe": "<realistic timeframe>"
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>"],
  "areasForImprovement": ["<area 1>", "<area 2>"]
}

IMPORTANT:
- All scores MUST have exactly one decimal place (e.g., 5.0, 6.5, 4.2). Never use whole numbers.
- Each breakdown feature MUST include score, description, and improvement fields.
- Be STRICT with scoring - avoid inflating scores. Most features should fall in the 4.0-6.0 range for average people.
- Do NOT give scores above 7.5 unless the feature is genuinely exceptional.
- Be honest but constructive. Provide 3-5 actionable tips focusing on skincare, grooming, and styling.`;

  try {
    console.log("[Gemini] Calling Gemini 3 Flash vision API...");

    // Build request body for Gemini API
    const requestBody: any = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    };

    // Add image to the request
    if (isBase64) {
      // For base64, add inline_data
      requestBody.contents[0].parts.unshift({
        inline_data: {
          mime_type: mimeType || "image/jpeg",
          data: imageData,
        },
      });
    } else {
      // For URL, use file_data (note: Gemini may not support all URLs)
      requestBody.contents[0].parts.unshift({
        file_data: {
          file_uri: imageData,
          mime_type: "image/jpeg",
        },
      });
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Gemini] API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("[Gemini] Raw response:", JSON.stringify(data).substring(0, 500));

    // Extract text content from Gemini response
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.error("[Gemini] No content in response:", JSON.stringify(data));
      throw new Error("No response from Gemini");
    }

    console.log("[Gemini] Raw response content:", content.substring(0, 500));

    // Parse JSON from response
    let jsonStr = content;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      const directJsonMatch = content.match(/\{[\s\S]*\}/);
      if (directJsonMatch) {
        jsonStr = directJsonMatch[0];
      }
    }

    // Clean up common JSON issues from LLM output
    jsonStr = jsonStr
      .replace(/,\s*}/g, '}')  // Remove trailing commas before }
      .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
      .replace(/[\x00-\x1F\x7F]/g, ' '); // Remove control characters

    console.log("[Gemini] JSON to parse (first 1000 chars):", jsonStr.substring(0, 1000));

    let analysis;
    try {
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("[Gemini] JSON parse error:", parseError);
      console.error("[Gemini] Full JSON string:", jsonStr);
      throw new Error(`Failed to parse Gemini response: ${parseError}`);
    }

    // Check for error responses
    if (analysis.error) {
      throw new Error(analysis.message || analysis.error);
    }

    // Log raw response types for debugging
    console.log("[Gemini] Raw response type check:", {
      scoreType: typeof analysis.score,
      scoreValue: analysis.score,
      hasBreakdown: !!analysis.breakdown,
    });

    // Validate required fields exist (coerce strings to numbers)
    const score = Number(analysis.score);
    if (isNaN(score)) {
      throw new Error("Invalid analysis: missing or invalid score");
    }
    if (!analysis.breakdown || typeof analysis.breakdown !== 'object') {
      throw new Error("Invalid analysis: missing breakdown");
    }

    // Validate and clamp scores
    analysis.score = Math.max(1, Math.min(10, score));

    // Ensure breakdown has all required fields with defaults
    // Supports both new object format {score, description, improvement} and legacy number format
    const requiredBreakdownFields = ['masculinity', 'symmetry', 'jawline', 'cheekbones', 'eyes', 'lips', 'skin', 'hair'];
    for (const key of requiredBreakdownFields) {
      const field = analysis.breakdown[key];

      if (field && typeof field === 'object') {
        // New object format: {score, description, improvement}
        const score = Number(field.score);
        if (isNaN(score)) {
          field.score = 5.0;
        } else {
          field.score = Math.max(1, Math.min(10, score));
        }
        // Ensure description and improvement exist
        field.description = field.description || '';
        field.improvement = field.improvement || '';
      } else {
        // Legacy number format or missing - convert to object
        const value = Number(field);
        analysis.breakdown[key] = {
          score: isNaN(value) ? 5.0 : Math.max(1, Math.min(10, value)),
          description: '',
          improvement: '',
        };
      }
    }

    // Transform tips to match mobile app expected format
    if (Array.isArray(analysis.tips)) {
      analysis.tips = analysis.tips.map((tip: any) => ({
        title: tip.category || tip.title || 'Improvement',
        description: tip.tip || tip.description || '',
        timeframe: tip.timeframe || 'Ongoing',
        priority: tip.priority || 'medium',
      }));
    } else {
      analysis.tips = [];
    }

    console.log("[Gemini] Analysis validated successfully");
    return analysis as FacialAnalysisResult;
  } catch (error) {
    console.error("[Gemini] Analysis error:", error);
    throw error;
  }
}

/**
 * Generate AI response for chat
 */
export async function generateChatResponse(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  userContext?: string
): Promise<string> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: systemPrompt + (userContext ? `\n\nUser context: ${userContext}` : ""),
      },
      ...messages,
    ],
    max_tokens: 1000,
    temperature: 0.8,
  });

  return response.choices[0]?.message?.content || "I apologize, I couldn't generate a response.";
}
