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

interface FeatureAnalysis {
  score: number;
  description: string;  // Detailed personalized description of this feature
  improvement: string;  // Actionable improvement tip for this specific category
}

interface AnalysisResult {
  score: number;
  breakdown: {
    masculinity: FeatureAnalysis;
    skin: FeatureAnalysis;
    jawline: FeatureAnalysis;
    cheekbones: FeatureAnalysis;
    eyes: FeatureAnalysis;
    symmetry: FeatureAnalysis;
    lips: FeatureAnalysis;
    hair: FeatureAnalysis;
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
  const prompt = `You are an expert facial analysis AI providing detailed, personalized assessments.

Analyze this person's face and provide DETAILED scores AND descriptions for 8 categories.

For EACH category, provide:
- A score (1-10, one decimal)
- A personalized 1-2 sentence description specific to THIS person's features
- An actionable improvement tip specific to THIS person's weaknesses in this category

THE 8 CATEGORIES TO ANALYZE:

1. MASCULINITY: Overall facial structure strength - brow ridge prominence, facial width-to-height ratio, angular vs soft features, hunter eyes vs prey eyes, forward growth
   
2. SKIN QUALITY: Texture analysis - pore visibility, acne/scarring, tone evenness, under-eye darkness, hydration appearance, signs of aging, overall clarity

3. JAWLINE: Definition and angularity - gonial angle sharpness, mandible definition, chin projection, jaw width, masseter visibility, submental area tightness

4. CHEEKBONES: Zygomatic prominence - height and projection of cheekbones, hollow beneath them, facial thirds balance, midface structure

5. EYES: Complete eye area - canthal tilt (positive/negative/neutral), eye spacing (IPD), upper eyelid exposure, under-eye support, limbal rings, scleral show, eye shape

6. SYMMETRY: Left-right balance - facial midline alignment, eye level matching, nostril symmetry, lip corners, overall proportional harmony

7. LIPS: Shape and proportion - Cupid's bow definition, vermillion border, upper-to-lower lip ratio, lip fullness, philtrum definition, mouth width to nose ratio

8. HAIR: Complete assessment - density, hairline shape (straight/rounded/receding), temple points, texture quality, current styling effectiveness, color vibrancy

SCORING GUIDELINES:
- 9-10: Exceptional/model-tier for this feature
- 7-8: Above average, noticeably attractive
- 5-6: Average, typical
- 3-4: Below average, noticeable weakness
- 1-2: Significant concern
- USE THE FULL RANGE - not everyone is 6-8

Respond in this exact JSON structure:
{
  "score": <overall 1-10>,
  "breakdown": {
    "masculinity": {
      "score": <1-10>,
      "description": "<specific observation about their facial structure strength, brow ridge, angularity>",
      "improvement": "<actionable tip to improve masculinity based on their specific weaknesses>"
    },
    "skin": {
      "score": <1-10>,
      "description": "<specific observation about their skin texture, clarity, tone>",
      "improvement": "<actionable tip to improve skin quality based on their specific issues>"
    },
    "jawline": {
      "score": <1-10>,
      "description": "<specific observation about their jaw definition, angle, chin>",
      "improvement": "<actionable tip to improve jawline definition based on their specific weaknesses>"
    },
    "cheekbones": {
      "score": <1-10>,
      "description": "<specific observation about their zygomatic structure, midface>",
      "improvement": "<actionable tip to enhance cheekbone prominence based on their specific structure>"
    },
    "eyes": {
      "score": <1-10>,
      "description": "<specific observation about eye shape, tilt, spacing, area>",
      "improvement": "<actionable tip to improve eye area appeal based on their specific features>"
    },
    "symmetry": {
      "score": <1-10>,
      "description": "<specific observation about facial balance and harmony>",
      "improvement": "<actionable tip to improve facial symmetry based on their specific imbalances>"
    },
    "lips": {
      "score": <1-10>,
      "description": "<specific observation about lip shape, fullness, proportion>",
      "improvement": "<actionable tip to improve lip appearance based on their specific features>"
    },
    "hair": {
      "score": <1-10>,
      "description": "<specific observation about hairline, density, styling>",
      "improvement": "<actionable tip to improve hair quality and styling based on their specific hair characteristics>"
    }
  },
  "tips": [
    {
      "title": "<actionable tip title>",
      "description": "<detailed personalized advice based on their specific weaknesses - be comprehensive and specific>",
      "timeframe": "<realistic timeframe>"
    }
  ]
  
IMPORTANT: Provide 5-7 comprehensive, actionable tips in the tips array. Focus on their biggest areas for improvement based on the scores. Each tip should be:
- Highly personalized to their specific facial features and weaknesses
- Actionable with clear steps they can take
- Realistic with achievable timeframes
- Cover different aspects: skincare, grooming, fitness, styling, etc.
}`;

  try {
    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content:
            'You are a professional facial analysis expert. You MUST analyze each face individually and provide UNIQUE, ACCURATE scores based on what you actually observe. Different people have different features - your scores should reflect real differences. Avoid defaulting to average scores (6-8 range) for everything. Use the full 1-10 scale appropriately. Provide constructive, actionable feedback focused on self-improvement.',
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
      max_tokens: 5000,
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

  const requiredCategories = ['masculinity', 'skin', 'jawline', 'cheekbones', 'eyes', 'symmetry', 'lips', 'hair'];
  for (const category of requiredCategories) {
    const feature = result.breakdown[category as keyof typeof result.breakdown];
    if (!feature || typeof feature !== 'object') {
      throw new Error(`Missing ${category} in AI response`);
    }
    if (!feature.score || feature.score < 1 || feature.score > 10) {
      throw new Error(`Invalid ${category} score in AI response`);
    }
    if (!feature.description || typeof feature.description !== 'string' || feature.description.length < 10) {
      throw new Error(`Invalid ${category} description in AI response`);
    }
    if (!feature.improvement || typeof feature.improvement !== 'string' || feature.improvement.length < 20) {
      throw new Error(`Invalid ${category} improvement tip in AI response`);
    }
  }

  if (!Array.isArray(result.tips) || result.tips.length < 5) {
    throw new Error('Insufficient tips in AI response - need at least 5 comprehensive tips');
  }
  
  // Validate each tip has required fields
  for (let i = 0; i < result.tips.length; i++) {
    const tip = result.tips[i];
    if (!tip.title || typeof tip.title !== 'string' || tip.title.length < 5) {
      throw new Error(`Invalid tip title at index ${i} in AI response`);
    }
    if (!tip.description || typeof tip.description !== 'string' || tip.description.length < 30) {
      throw new Error(`Invalid tip description at index ${i} in AI response`);
    }
    if (!tip.timeframe || typeof tip.timeframe !== 'string' || tip.timeframe.length < 5) {
      throw new Error(`Invalid tip timeframe at index ${i} in AI response`);
    }
  }

  // Check for banned terms (incel/blackpill terminology)
  // These are terms that are ALWAYS inappropriate regardless of context
  const bannedTerms = [
    'subhuman',
    "it's over",
    'its over',
    'incel',
    'blackpill',
    'looksmaxing',
    'mogging',
    'foid',
    'stacy',
    'becky',
  ];
  
  // Terms that need word boundary matching to avoid false positives
  // (e.g., "jump rope" is fine, "rope" alone is not; "microscope" is fine)
  const wordBoundaryTerms = [
    'beta male',
    'alpha male',
    'chad',
    'cope',   // Allow "microscope", "horoscope", etc.
    'rope',   // Allow "jump rope", "tightrope", etc.
    'mog',    // Allow "mogul", etc.
  ];
  
  const fullText = JSON.stringify(result).toLowerCase();
  
  for (const term of bannedTerms) {
    if (fullText.includes(term)) {
      console.warn(`Banned term detected: "${term}" in AI response`);
      throw new Error('AI response contains inappropriate terminology');
    }
  }
  
  // Check word boundary terms with regex
  for (const term of wordBoundaryTerms) {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    if (regex.test(fullText)) {
      console.warn(`Banned term detected: "${term}" in AI response`);
      throw new Error('AI response contains inappropriate terminology');
    }
  }
}

