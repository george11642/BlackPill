/**
 * OpenAI utilities for Edge Functions
 */

import OpenAI from "https://esm.sh/openai@4.70.0";

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

export interface FacialAnalysisResult {
  score: number;
  breakdown: {
    symmetry: number;
    jawline: number;
    eyes: number;
    lips: number;
    skin: number;
    bone_structure: number;
    hair: number;
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
 * Analyze facial attractiveness using OpenAI Vision API
 */
export async function analyzeFacialAttractiveness(
  imageUrl: string
): Promise<FacialAnalysisResult> {
  const openai = getOpenAI();

  const prompt = `You are an expert facial aesthetics consultant. Analyze this facial photo and provide a detailed attractiveness assessment.

Please evaluate the following aspects on a scale of 1-10:
1. Symmetry - how balanced are the facial features?
2. Jawline - definition and structure
3. Eyes - size, shape, and positioning
4. Lips - fullness and proportions
5. Skin Quality - texture, clarity, complexion
6. Bone Structure - overall facial structure and proportions
7. Hair Quality - texture, thickness, hairline, and styling

IMPORTANT VALIDATION:
- If no face is clearly visible, respond with: {"error": "No face detected", "message": "Please upload a clear photo of your face"}
- If multiple faces are detected, respond with: {"error": "Multiple faces", "message": "Please upload a photo with only one person"}
- If the image is blurred or low quality, respond with: {"error": "blurred", "message": "Please upload a clearer photo"}
- If the image contains inappropriate content, respond with: {"error": "inappropriate content", "message": "Please upload an appropriate photo"}

If the photo is valid, provide your analysis in JSON format with:
{
  "score": (overall 1-10),
  "breakdown": {
    "symmetry": (1-10),
    "jawline": (1-10),
    "eyes": (1-10),
    "lips": (1-10),
    "skin": (1-10),
    "bone_structure": (1-10),
    "hair": (1-10)
  },
  "tips": [
    {
      "category": "category name",
      "tip": "actionable improvement",
      "priority": "high|medium|low",
      "timeframe": "realistic timeframe"
    }
  ],
  "strengths": ["strength 1", "strength 2"],
  "areasForImprovement": ["area 1", "area 2"]
}

Be honest but constructive. Focus on objective facial features. Provide at least 3-5 actionable tips.
NEVER use blackpill, incel, or derogatory terminology. Focus on positive, actionable improvements.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

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

    const analysis = JSON.parse(jsonStr);

    // Check for error responses
    if (analysis.error) {
      throw new Error(analysis.message || analysis.error);
    }

    // Validate required fields exist
    if (typeof analysis.score !== 'number') {
      throw new Error("Invalid analysis: missing score");
    }
    if (!analysis.breakdown || typeof analysis.breakdown !== 'object') {
      throw new Error("Invalid analysis: missing breakdown");
    }

    // Validate and clamp scores
    analysis.score = Math.max(1, Math.min(10, analysis.score));

    // Ensure breakdown has all required fields with defaults
    const requiredBreakdownFields = ['symmetry', 'jawline', 'eyes', 'lips', 'skin', 'bone_structure', 'hair'];
    for (const key of requiredBreakdownFields) {
      if (typeof analysis.breakdown[key] !== 'number') {
        analysis.breakdown[key] = 5.0; // Default to neutral
      } else {
        analysis.breakdown[key] = Math.max(1, Math.min(10, analysis.breakdown[key]));
      }
    }

    // Transform tips to match mobile app expected format
    // OpenAI returns: { category, tip, priority, timeframe }
    // Mobile expects: { title, description, timeframe }
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

    console.log("[OpenAI] Analysis validated successfully");
    return analysis as FacialAnalysisResult;
  } catch (error) {
    console.error("[OpenAI] Analysis error:", error);
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
