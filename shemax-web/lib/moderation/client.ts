import OpenAI from 'openai';
import { config } from '../config';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

interface ModerationResult {
  flagged: boolean;
  categories: string[];
  scores: Record<string, number>;
}

/**
 * Moderate content using OpenAI Moderation API
 * PRD Section 3.2, F9: "AI pre-filtering (OpenAI Moderation API)"
 * 
 * @param content - Text content to moderate
 * @returns Moderation result
 */
export async function moderateContent(content: string): Promise<ModerationResult> {
  try {
    const response = await openai.moderations.create({
      input: content,
    });

    const result = response.results[0];

    // Check against blocked terms list (PRD Section 3.2, F9)
    const blockedTerms = [
      'subhuman',
      "it's over",
      'cope',
      'rope',
      'beta',
      'alpha',
      'chad',
      'incel',
      'shemax',
      'redpill',
      'bluepill',
      'mog',
      'mogging',
      'foid',
      'femoid',
    ];

    const lowerContent = content.toLowerCase();
    const containsBlockedTerms = blockedTerms.some((term) =>
      lowerContent.includes(term)
    );

    return {
      flagged: result.flagged || containsBlockedTerms,
      categories: [
        ...(result.categories.harassment ? ['harassment'] : []),
        ...(result.categories.hate ? ['hate speech'] : []),
        ...(result.categories['sexual/minors'] ? ['sexual/minors'] : []),
        ...(result.categories.violence ? ['violence'] : []),
        ...(containsBlockedTerms ? ['blocked terminology'] : []),
      ],
      scores: result.category_scores as unknown as Record<string, number>,
    };
  } catch (error) {
    console.error('Moderation error:', error);
    
    // Fallback to simple blocked terms check if API fails
    const blockedTerms = [
      'subhuman',
      "it's over",
      'cope',
      'rope',
      'beta',
      'alpha',
      'chad',
      'incel',
      'shemax',
      'redpill',
      'bluepill',
    ];
    
    const lowerContent = content.toLowerCase();
    const containsBlockedTerms = blockedTerms.some((term) =>
      lowerContent.includes(term)
    );

    return {
      flagged: containsBlockedTerms,
      categories: containsBlockedTerms ? ['blocked terminology'] : [],
      scores: {},
    };
  }
}

