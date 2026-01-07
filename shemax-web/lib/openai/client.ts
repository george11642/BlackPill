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
    femininity: FeatureAnalysis;
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
 * Analyze facial beauty using OpenAI Vision API
 * @param imageUrl - URL or base64 of the image
 * @param faceMetrics - Face metrics (optional, not currently used)
 * @returns Analysis result with score, breakdown, and tips
 */
export async function analyzeFacialBeauty(
  imageUrl: string,
  faceMetrics: FaceMetrics = {}
): Promise<AnalysisResult> {
  const prompt = `You are an expert facial analysis AI providing detailed, personalized assessments.

Analyze this person's face and provide DETAILED scores AND descriptions for 8 categories.

For EACH category, provide:
- A score (1-10, with one decimal precision like 5.1, 6.3, 7.8 - use the FULL range of decimals from .0 to .9, not just .0 or .5)
- A personalized 1-2 sentence description specific to THIS person's features
- An actionable improvement tip specific to THIS person's weaknesses in this category

THE 8 CATEGORIES TO ANALYZE:

1. FEMININITY: Overall facial harmony and softness - delicate features, facial symmetry, youthful appearance, doe eyes vs sharp eyes, soft jawline, feminine proportions
   
2. SKIN QUALITY: Texture analysis - pore visibility, acne/scarring, tone evenness, under-eye darkness, hydration appearance, signs of aging, overall clarity

3. JAWLINE: Definition and angularity - gonial angle sharpness, mandible definition, chin projection, jaw width, masseter visibility, submental area tightness

4. CHEEKBONES: Zygomatic prominence - height and projection of cheekbones, hollow beneath them, facial thirds balance, midface structure

5. EYES: Complete eye area - canthal tilt (positive/negative/neutral), eye spacing (IPD), upper eyelid exposure, under-eye support, limbal rings, scleral show, eye shape

6. SYMMETRY: Left-right balance - facial midline alignment, eye level matching, nostril symmetry, lip corners, overall proportional harmony

7. LIPS: Shape and proportion - Cupid's bow definition, vermillion border, upper-to-lower lip ratio, lip fullness, philtrum definition, mouth width to nose ratio

8. HAIR: Complete assessment - density, hairline shape (straight/rounded/receding), temple points, texture quality, current styling effectiveness, color vibrancy

SCORING GUIDELINES (CRITICAL - READ CAREFULLY):
- USE VARIED DECIMALS: Scores can be any decimal like 5.1, 6.3, 7.8 - use the full .0 to .9 range, not just .0 or .5.
- 9-10: Extremely rare, model-tier, top 1% genetics. Almost NEVER assign these.
- 8: Very attractive, top 5%. Rarely assign.
- 7: Above average, top 20%. Noticeable good looks.
- 5-6: AVERAGE. This is where MOST people fall. 50% of faces are 5.0 or below.
- 4: Slightly below average, noticeable flaws.
- 3: Below average, multiple weak features.
- 2: Significantly below average, major structural concerns.
- 1: Severe issues requiring medical attention.

Respond in this exact JSON structure:
{
  "score": <overall 1-10>,
  "breakdown": {
    "femininity": {
      "score": <1-10>,
      "description": "<specific observation about their facial structure strength, brow ridge, angularity>",
      "improvement": "<actionable tip to improve femininity based on their specific weaknesses>"
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
            'You are a brutally honest facial analysis expert. Your purpose is ACCURATE assessment, not flattery. Most people are AVERAGE (score 5). Scores above 6 should be RARE and earned. If you see weak features, flaws, asymmetry, or anything below average, your scores MUST reflect that. Never inflate scores to be nice. Users come here for TRUTH, not validation. If someone is unattractive, say so tactfully but honestly with low scores (1-4 range). Provide constructive, actionable feedback for improvement.',
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

    // Log raw response for debugging
    const rawContent = response.choices[0]?.message?.content;
    if (!rawContent) {
      console.error('[OpenAI] No content in response:', JSON.stringify(response, null, 2));
      throw new Error('OpenAI returned empty response');
    }

    console.log('[OpenAI] Raw response length:', rawContent.length);
    console.log('[OpenAI] Raw response preview (first 500 chars):', rawContent.substring(0, 500));

    // Parse JSON with better error handling
    let result: AnalysisResult;
    try {
      result = JSON.parse(rawContent) as AnalysisResult;
      console.log('[OpenAI] Successfully parsed JSON response');
      console.log('[OpenAI] Parsed result structure:', {
        hasScore: typeof result.score !== 'undefined',
        scoreValue: result.score,
        hasBreakdown: typeof result.breakdown !== 'undefined',
        breakdownKeys: result.breakdown ? Object.keys(result.breakdown) : [],
        hasTips: Array.isArray(result.tips),
        tipsLength: result.tips?.length || 0,
      });
    } catch (parseError) {
      console.error('[OpenAI] JSON parse error:', parseError);
      console.error('[OpenAI] Raw content that failed to parse:', rawContent);
      throw new Error(`Failed to parse OpenAI response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }

    // Validate and sanitize the response
    try {
      validateAnalysisResult(result);
      console.log('[OpenAI] Validation passed successfully');
    } catch (validationError) {
      console.error('[OpenAI] Validation failed:', validationError);
      console.error('[OpenAI] Result that failed validation:', JSON.stringify(result, null, 2));
      // Re-throw with more context
      throw new Error(`OpenAI response validation failed: ${validationError instanceof Error ? validationError.message : String(validationError)}. Response: ${JSON.stringify(result, null, 2).substring(0, 1000)}`);
    }

    return result;
  } catch (error) {
    console.error('[OpenAI] API error:', error);

    // Fallback to rule-based scoring if OpenAI is down or has network issues
    if (
      error instanceof Error &&
      (error.message.includes('timeout') ||
        error.message.includes('unavailable') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('network') ||
        error.message.includes('connection'))
    ) {
      console.warn('[OpenAI] API unavailable, using fallback scoring');
      return calculateFallbackScore(faceMetrics);
    }

    // Re-throw validation/parsing errors with full context
    if (error instanceof Error) {
      throw error;
    }

    throw new Error(`Failed to analyze image with AI: ${String(error)}`);
  }
}

/**
 * Validate analysis result structure
 */
function validateAnalysisResult(result: AnalysisResult): void {
  // Check if result exists
  if (!result || typeof result !== 'object') {
    throw new Error(`Invalid AI response: result is not an object. Received: ${typeof result}`);
  }

  // Validate overall score with detailed error message
  if (typeof result.score === 'undefined' || result.score === null) {
    throw new Error(`Invalid score in AI response: score is missing or null. Result: ${JSON.stringify(result, null, 2).substring(0, 500)}`);
  }

  const scoreValue = typeof result.score === 'number' ? result.score : parseFloat(String(result.score));
  if (isNaN(scoreValue) || scoreValue < 1 || scoreValue > 10) {
    throw new Error(`Invalid score in AI response: score must be between 1 and 10, but got ${result.score} (type: ${typeof result.score})`);
  }

  // Validate breakdown exists
  if (!result.breakdown || typeof result.breakdown !== 'object') {
    throw new Error(`Invalid breakdown in AI response: breakdown is missing or not an object. Received: ${typeof result.breakdown}`);
  }

  const requiredCategories = ['femininity', 'skin', 'jawline', 'cheekbones', 'eyes', 'symmetry', 'lips', 'hair'];
  for (const category of requiredCategories) {
    const feature = result.breakdown[category as keyof typeof result.breakdown];
    if (!feature || typeof feature !== 'object') {
      throw new Error(`Missing ${category} in AI response breakdown. Available keys: ${Object.keys(result.breakdown).join(', ')}`);
    }

    const featureScore = typeof feature.score === 'number' ? feature.score : parseFloat(String(feature.score));
    if (isNaN(featureScore) || featureScore < 1 || featureScore > 10) {
      throw new Error(`Invalid ${category} score in AI response: score must be between 1 and 10, but got ${feature.score} (type: ${typeof feature.score})`);
    }

    if (!feature.description || typeof feature.description !== 'string' || feature.description.length < 10) {
      throw new Error(`Invalid ${category} description in AI response: description is missing, not a string, or too short (${feature.description?.length || 0} chars). Received: ${typeof feature.description}`);
    }

    if (!feature.improvement || typeof feature.improvement !== 'string' || feature.improvement.length < 20) {
      throw new Error(`Invalid ${category} improvement tip in AI response: improvement is missing, not a string, or too short (${feature.improvement?.length || 0} chars). Received: ${typeof feature.improvement}`);
    }
  }

  // Validate tips array
  if (!result.tips) {
    throw new Error('Missing tips array in AI response');
  }

  if (!Array.isArray(result.tips)) {
    throw new Error(`Invalid tips in AI response: tips must be an array, but got ${typeof result.tips}`);
  }

  if (result.tips.length < 5) {
    throw new Error(`Insufficient tips in AI response: need at least 5 comprehensive tips, but got ${result.tips.length}`);
  }

  // Validate each tip has required fields
  for (let i = 0; i < result.tips.length; i++) {
    const tip = result.tips[i];
    if (!tip || typeof tip !== 'object') {
      throw new Error(`Invalid tip at index ${i} in AI response: tip is not an object. Received: ${typeof tip}`);
    }

    if (!tip.title || typeof tip.title !== 'string' || tip.title.length < 5) {
      throw new Error(`Invalid tip title at index ${i} in AI response: title is missing, not a string, or too short (${tip.title?.length || 0} chars). Received: ${typeof tip.title}`);
    }

    if (!tip.description || typeof tip.description !== 'string' || tip.description.length < 30) {
      throw new Error(`Invalid tip description at index ${i} in AI response: description is missing, not a string, or too short (${tip.description?.length || 0} chars). Received: ${typeof tip.description}`);
    }

    if (!tip.timeframe || typeof tip.timeframe !== 'string' || tip.timeframe.length < 5) {
      throw new Error(`Invalid tip timeframe at index ${i} in AI response: timeframe is missing, not a string, or too short (${tip.timeframe?.length || 0} chars). Received: ${typeof tip.timeframe}`);
    }
  }

  // Check for banned terms (incel/shemax terminology)
  // Single-word terms that are ALWAYS inappropriate regardless of context
  const bannedSingleWordTerms = [
    'subhuman',
    'incel',
    'shemax',
    'looksmaxing',
    'mogging',
    'foid',
    'stacy',
    'becky',
  ];

  // Multi-word phrases that need complete phrase matching
  const bannedPhrases = [
    /\b(it'?s\s+over)\b/i,      // "it's over" or "its over" - complete phrase only
    /\bbeta\s+male\b/i,         // "beta male"
    /\balpha\s+male\b/i,        // "alpha male"
  ];

  // Single-word terms that need word boundary matching to avoid false positives
  // (e.g., "microscope" is fine, "cope" alone is not; "jump rope" is fine, "rope" alone is not)
  const wordBoundaryTerms = [
    'chad',
    'cope',   // Allow "microscope", "horoscope", etc.
    'rope',   // Allow "jump rope", "tightrope", etc.
    'mog',    // Allow "mogul", etc.
  ];

  const fullText = JSON.stringify(result).toLowerCase();

  // Check single-word banned terms with word boundaries
  for (const term of bannedSingleWordTerms) {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    if (regex.test(fullText)) {
      console.warn(`Banned term detected: "${term}" in AI response`);
      throw new Error('AI response contains inappropriate terminology');
    }
  }

  // Check multi-word phrase bans
  for (const phraseRegex of bannedPhrases) {
    if (phraseRegex.test(fullText)) {
      console.warn(`Banned phrase detected in AI response`);
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


