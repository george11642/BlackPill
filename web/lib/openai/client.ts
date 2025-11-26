import OpenAI from 'openai';
import { config } from '../config';
import { calculateFallbackScore } from '../scoring/fallback';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

interface FaceMetrics {
  landmarks?: Record<string, { x: number; y: number; z?: number }>;
  headAngles?: {
    roll?: number;
    pan?: number;
    tilt?: number;
  };
  likelihood?: {
    blurred?: string;
    underExposed?: string;
  };
  confidence?: number;
}

interface AnalysisResult {
  score: number;
  breakdown: {
    symmetry: number;
    jawline: number;
    eyes: number;
    lips: number;
    skin: number;
    bone_structure: number;
  };
  tips: Array<{
    title: string;
    description: string;
    timeframe: string;
  }>;
}

/**
 * Analyze facial attractiveness using OpenAI Vision API
 * @param imageUrl - URL or base64 of the image
 * @param faceMetrics - Face metrics (optional, not currently used)
 * @returns Analysis result with score, breakdown, and tips
 */
export async function analyzeFacialAttractiveness(
  imageUrl: string,
  faceMetrics: FaceMetrics = {}
): Promise<AnalysisResult> {
  const prompt = `You are an expert facial analysis AI that provides constructive, actionable feedback.

Analyze this person's facial features and provide:
1. An overall attractiveness score (1-10, one decimal place)
2. Scores for 6 specific categories (1-10, one decimal):
   - Symmetry
   - Jawline
   - Eyes
   - Lips
   - Skin Quality
   - Bone Structure
3. 3-5 actionable improvement tips with timeframes

IMPORTANT RULES:
- Use ONLY constructive, positive language
- NEVER use terms like: "subhuman", "it's over", "cope", "rope", "beta", "alpha"
- Focus on controllable factors: grooming, fitness, skincare, style
- Include realistic timeframes (e.g., "1-2 weeks", "1-3 months")
- Be honest but kind and motivating

Face metrics detected: ${JSON.stringify(faceMetrics)}

Respond in JSON format:
{
  "score": 7.5,
  "breakdown": {
    "symmetry": 8.0,
    "jawline": 7.0,
    "eyes": 8.5,
    "lips": 7.5,
    "skin": 6.5,
    "bone_structure": 7.0
  },
  "tips": [
    {
      "title": "Improve Skin Health",
      "description": "Start a daily skincare routine with cleanser, moisturizer, and SPF 30+ sunscreen",
      "timeframe": "2-4 weeks for visible results"
    },
    ...
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content:
            'You are a professional facial analysis expert who provides constructive, actionable feedback focused on self-improvement.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}') as AnalysisResult;
    
    // Validate and sanitize the response
    validateAnalysisResult(result);
    
    return result;
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Fallback to rule-based scoring if OpenAI is down
    if (
      error instanceof Error &&
      (error.message.includes('timeout') ||
        error.message.includes('unavailable') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ETIMEDOUT'))
    ) {
      console.warn('OpenAI API unavailable, using fallback scoring');
      return calculateFallbackScore(faceMetrics);
    }
    
    throw new Error('Failed to analyze image with AI');
  }
}

/**
 * Validate analysis result structure
 */
function validateAnalysisResult(result: AnalysisResult): void {
  if (!result.score || result.score < 1 || result.score > 10) {
    throw new Error('Invalid score in AI response');
  }

  const requiredCategories = ['symmetry', 'jawline', 'eyes', 'lips', 'skin', 'bone_structure'];
  for (const category of requiredCategories) {
    if (
      !result.breakdown[category as keyof typeof result.breakdown] ||
      result.breakdown[category as keyof typeof result.breakdown] < 1 ||
      result.breakdown[category as keyof typeof result.breakdown] > 10
    ) {
      throw new Error(`Invalid ${category} score in AI response`);
    }
  }

  if (!Array.isArray(result.tips) || result.tips.length < 3) {
    throw new Error('Insufficient tips in AI response');
  }

  // Check for banned terms
  const bannedTerms = [
    'subhuman',
    "it's over",
    'cope',
    'rope',
    'beta',
    'alpha',
    'chad',
    'incel',
  ];
  const fullText = JSON.stringify(result).toLowerCase();
  
  for (const term of bannedTerms) {
    if (fullText.includes(term)) {
      throw new Error('AI response contains inappropriate terminology');
    }
  }
}

