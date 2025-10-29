const OpenAI = require('openai');
const config = require('./config');

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

/**
 * Moderate content using OpenAI Moderation API
 * PRD Section 3.2, F9: "AI pre-filtering (OpenAI Moderation API)"
 * 
 * @param {string} content - Text content to moderate
 * @returns {Promise<Object>} Moderation result
 */
async function moderateContent(content) {
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
      'blackpill',
      'redpill',
      'bluepill',
      'mog',
      'mogging',
      'foid',
      'femoid',
    ];

    const lowerContent = content.toLowerCase();
    const containsBlockedTerms = blockedTerms.some(term => 
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
      scores: result.category_scores,
    };
  } catch (error) {
    console.error('Moderation error:', error);
    
    // Fallback to simple blocked terms check if API fails
    const blockedTerms = [
      'subhuman', "it's over", 'cope', 'rope', 'beta', 'alpha', 
      'chad', 'incel', 'blackpill', 'redpill', 'bluepill',
    ];
    
    const lowerContent = content.toLowerCase();
    const containsBlockedTerms = blockedTerms.some(term => 
      lowerContent.includes(term)
    );

    return {
      flagged: containsBlockedTerms,
      categories: containsBlockedTerms ? ['blocked terminology'] : [],
      scores: {},
    };
  }
}

module.exports = {
  moderateContent,
};

