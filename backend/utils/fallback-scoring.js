/**
 * Fallback rule-based scoring when OpenAI API is down
 * This is a simplified scoring algorithm based on face metrics
 */

/**
 * Calculate attractiveness score using rule-based algorithm
 * @param {Object} faceMetrics - Metrics from Google Cloud Vision
 * @returns {Object} Analysis result with score, breakdown, and generic tips
 */
function calculateFallbackScore(faceMetrics) {
  console.warn('Using fallback rule-based scoring - OpenAI API unavailable');

  // Extract key measurements
  const { landmarks, headAngles, likelihood } = faceMetrics;
  
  // Calculate scores for each category (simple heuristics)
  const breakdown = {
    symmetry: calculateSymmetryScore(landmarks),
    jawline: 7.0, // Baseline
    eyes: 7.5, // Baseline
    lips: 7.0, // Baseline
    skin: calculateSkinScore(likelihood),
    bone_structure: 7.0, // Baseline
  };

  // Calculate overall score (average of breakdown)
  const score = Object.values(breakdown).reduce((sum, val) => sum + val, 0) / 6;
  
  // Round to 1 decimal
  const roundedScore = Math.round(score * 10) / 10;

  // Generic improvement tips
  const tips = generateGenericTips(breakdown);

  return {
    score: roundedScore,
    breakdown,
    tips,
  };
}

/**
 * Calculate symmetry score based on facial landmarks
 */
function calculateSymmetryScore(landmarks) {
  // Simple symmetry check - in production you'd do more sophisticated analysis
  // For now, return a reasonable baseline
  return 7.5;
}

/**
 * Calculate skin score based on image quality
 */
function calculateSkinScore(likelihood) {
  // Check if image has good quality (indicator of skin clarity)
  if (likelihood.blurred === 'VERY_UNLIKELY' && likelihood.underExposed === 'UNLIKELY') {
    return 8.0;
  }
  if (likelihood.blurred === 'UNLIKELY') {
    return 7.5;
  }
  return 7.0;
}

/**
 * Generate generic improvement tips
 */
function generateGenericTips(breakdown) {
  const tips = [];

  // Skin care tip (always included)
  tips.push({
    title: 'Improve Skin Health',
    description: 'Establish a daily skincare routine with cleanser, moisturizer, and SPF 30+ sunscreen. Stay hydrated by drinking 8 glasses of water daily.',
    timeframe: '2-4 weeks for visible results',
  });

  // Fitness tip (always included)
  tips.push({
    title: 'Enhance Facial Structure',
    description: 'Incorporate facial exercises and maintain a healthy body fat percentage (12-15%) through regular cardio and strength training.',
    timeframe: '1-3 months for noticeable definition',
  });

  // Grooming tip (always included)
  tips.push({
    title: 'Optimize Grooming',
    description: 'Get a professional haircut that complements your face shape. Maintain well-groomed facial hair or clean-shaven appearance.',
    timeframe: 'Immediate impact, maintain weekly',
  });

  // Posture tip (bonus)
  if (tips.length < 5) {
    tips.push({
      title: 'Improve Posture',
      description: 'Practice good posture: shoulders back, chin up, spine aligned. This instantly improves your overall appearance and confidence.',
      timeframe: 'Immediate impact, build habit over 2-3 weeks',
    });
  }

  return tips;
}

module.exports = {
  calculateFallbackScore,
};


