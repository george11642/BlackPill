/**
 * AI Facial Analysis Engine
 * Uses OpenAI's vision capabilities to analyze facial attractiveness
 * Following SmileScore's architecture and analysis categories
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface FacialAnalysisResult {
  score: number; // 1-10 overall score
  breakdown: {
    symmetry: number; // 1-10
    jawline: number; // 1-10
    eyes: number; // 1-10
    lips: number; // 1-10
    skin: number; // 1-10
    bone_structure: number; // 1-10
    hair: number; // 1-10
  };
  tips: Array<{
    category: string;
    tip: string;
    priority: 'high' | 'medium' | 'low';
    timeframe?: string;
  }>;
  strengths: string[];
  areasForImprovement: string[];
}

/**
 * Analyze a facial photo using OpenAI's Vision API
 */
export async function analyzeFacialPhoto(
  imageBase64: string,
  imageMediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg'
): Promise<FacialAnalysisResult> {
  try {
    const prompt = `You are an expert facial aesthetics consultant. Analyze this facial photo and provide a detailed attractiveness assessment.

Please evaluate the following aspects on a scale of 1-10:
1. Symmetry - how balanced are the facial features?
2. Jawline - definition and structure
3. Eyes - size, shape, and positioning
4. Lips - fullness and proportions
5. Skin Quality - texture, clarity, complexion
6. Bone Structure - overall facial structure and proportions
7. Hair Quality - texture, thickness, hairline, and styling

Provide your analysis in JSON format with:
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
      "timeframe": "realistic timeframe (e.g., '2-4 weeks', '1-3 months')"
    }
  ],
  "strengths": ["strength 1", "strength 2"],
  "areasForImprovement": ["area 1", "area 2"]
}

Be honest but constructive. Focus on objective facial features. Provide at least 3-5 actionable tips prioritized by impact.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${imageMediaType};base64,${imageBase64}`,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });

    // Extract JSON from response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      // Try to find JSON object directly
      const directJsonMatch = content.match(/\{[\s\S]*\}/);
      if (directJsonMatch) {
        jsonStr = directJsonMatch[0];
      }
    }

    const analysis = JSON.parse(jsonStr) as FacialAnalysisResult;

    // Validate scores are in range 1-10
    if (analysis.score < 1 || analysis.score > 10) {
      analysis.score = Math.max(1, Math.min(10, analysis.score));
    }

    Object.keys(analysis.breakdown).forEach((key) => {
      const value = analysis.breakdown[key as keyof typeof analysis.breakdown];
      if (value < 1 || value > 10) {
        analysis.breakdown[key as keyof typeof analysis.breakdown] = Math.max(
          1,
          Math.min(10, value)
        );
      }
    });

    return analysis;
  } catch (error) {
    console.error('Error analyzing facial photo:', error);
    throw new Error(`Failed to analyze photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate image before sending to OpenAI
 */
export function validateImage(
  imageBase64: string,
  maxSizeInMB: number = 2
): { valid: boolean; error?: string } {
  if (!imageBase64) {
    return { valid: false, error: 'Image data is required' };
  }

  // Estimate size from base64
  const sizeInBytes = Buffer.byteLength(imageBase64, 'base64');
  const sizeInMB = sizeInBytes / (1024 * 1024);

  if (sizeInMB > maxSizeInMB) {
    return {
      valid: false,
      error: `Image size (${sizeInMB.toFixed(2)}MB) exceeds maximum of ${maxSizeInMB}MB`,
    };
  }

  return { valid: true };
}

