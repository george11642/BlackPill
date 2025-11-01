const vision = require('@google-cloud/vision');
const config = require('./config');

// Create a Vision API client
const client = new vision.ImageAnnotatorClient({
  projectId: config.google.projectId,
  ...(config.google.apiKey ? { apiKey: config.google.apiKey } : { keyFilename: config.google.credentials }),
});

/**
 * Analyze photo conditions using Google Cloud Vision
 * @param {string} photoUrl - URL to the photo
 * @returns {Promise<Object>} Photo analysis results
 */
async function analyzePhotoConditions(photoUrl) {
  try {
    // Face detection for angle, size, and expression
    const [faceResult] = await client.faceDetection(photoUrl);
    const faces = faceResult.faceAnnotations;

    if (!faces || faces.length === 0) {
      throw new Error('No face detected in photo');
    }

    if (faces.length > 1) {
      throw new Error('Multiple faces detected');
    }

    const face = faces[0];
    const boundingBox = face.boundingPoly?.vertices || [];
    
    // Calculate face size as percentage of frame
    // Assuming we know image dimensions, but Vision API doesn't return them
    // We'll use bounding box area as a proxy
    const faceWidth = Math.abs((boundingBox[2]?.x || 0) - (boundingBox[0]?.x || 0));
    const faceHeight = Math.abs((boundingBox[2]?.y || 0) - (boundingBox[0]?.y || 0));
    const faceArea = faceWidth * faceHeight;
    // Rough estimate: assume typical photo is ~1000x1000, so area is 1M
    // Face should be 40-60% of frame, so roughly 400k-600k in area units
    // This is approximate, but gives us relative size
    const estimatedImageArea = 1000000; // Approximate
    const faceSizePercent = (faceArea / estimatedImageArea) * 100;

    // Calculate lighting score from image properties
    // Vision API doesn't directly give lighting, but we can infer from exposure
    let lightingScore = 0.5;
    if (face.underExposedLikelihood === 'VERY_UNLIKELY' || face.underExposedLikelihood === 'UNLIKELY') {
      lightingScore = 0.8;
    } else if (face.underExposedLikelihood === 'VERY_LIKELY' || face.underExposedLikelihood === 'LIKELY') {
      lightingScore = 0.2;
    }

    // Face angle calculation
    const rollAngle = Math.abs(face.rollAngle || 0);
    const panAngle = Math.abs(face.panAngle || 0);
    const tiltAngle = Math.abs(face.tiltAngle || 0);
    const totalAngle = Math.sqrt(rollAngle ** 2 + panAngle ** 2 + tiltAngle ** 2);

    // Expression check - neutral expression preferred
    const isNeutral = 
      face.joyLikelihood === 'VERY_UNLIKELY' &&
      face.sorrowLikelihood === 'VERY_UNLIKELY' &&
      face.angerLikelihood === 'VERY_UNLIKELY' &&
      face.surpriseLikelihood === 'VERY_UNLIKELY';

    // Background clutter - use label detection as proxy
    const [labelResult] = await client.labelDetection(photoUrl);
    const labels = labelResult.labelAnnotations || [];
    
    // Count relevant background labels (clutter indicators)
    const clutterIndicators = ['Furniture', 'Room', 'Indoor', 'Wall', 'Door', 'Window'];
    const clutterCount = labels.filter(l => 
      clutterIndicators.some(indicator => 
        l.description?.toLowerCase().includes(indicator.toLowerCase())
      )
    ).length;
    
    // Clutter score (0-1, lower is better)
    const backgroundClutter = Math.min(clutterCount / 5, 1.0);

    return {
      lighting: {
        score: lightingScore,
        quality: lightingScore > 0.7 ? 'good' : lightingScore > 0.4 ? 'fair' : 'poor',
      },
      faceSize: Math.min(Math.max(faceSizePercent, 0), 100),
      faceAngle: totalAngle,
      rollAngle: rollAngle,
      panAngle: panAngle,
      tiltAngle: tiltAngle,
      backgroundClutter: backgroundClutter,
      expression: {
        neutral: isNeutral,
        joy: face.joyLikelihood,
        sorrow: face.sorrowLikelihood,
      },
    };
  } catch (error) {
    console.error('Photo analysis error:', error);
    throw error;
  }
}

/**
 * Compare two photos for consistency
 * @param {Object} baseline - Baseline photo analysis results
 * @param {Object} checkin - Check-in photo analysis results
 * @returns {Object} Comparison results
 */
function comparePhotoConditions(baseline, checkin) {
  // Lighting consistency check
  const lightingDiff = Math.abs(checkin.lighting.score - baseline.lighting.score);
  const lightingPass = lightingDiff < 0.2;

  // Face size consistency (40-60% range, <10% variance)
  const faceSizeDiff = Math.abs(checkin.faceSize - baseline.faceSize);
  const distancePass = faceSizeDiff < 10 && 
                       checkin.faceSize >= 40 && 
                       checkin.faceSize <= 60;

  // Angle consistency (<10 degrees deviation)
  const angleDiff = Math.abs(checkin.faceAngle - baseline.faceAngle);
  const anglePass = angleDiff < 10 && checkin.faceAngle < 10;

  // Background clutter check (<0.3)
  const backgroundPass = checkin.backgroundClutter < 0.3;

  // Expression neutrality check
  const expressionPass = checkin.expression.neutral;

  const allPassed = lightingPass && distancePass && anglePass && backgroundPass && expressionPass;
  const passedChecks = [
    lightingPass,
    distancePass,
    anglePass,
    backgroundPass,
    expressionPass,
  ].filter(Boolean).length;

  return {
    checks: {
      lighting: {
        score: checkin.lighting.score,
        baselineScore: baseline.lighting.score,
        diff: lightingDiff,
        pass: lightingPass,
        suggestion: !lightingPass
          ? `Try to match the lighting from your baseline photo. Current: ${checkin.lighting.quality}, Baseline: ${baseline.lighting.quality}`
          : undefined,
      },
      distance: {
        faceSize: checkin.faceSize,
        baselineFaceSize: baseline.faceSize,
        diff: faceSizeDiff,
        pass: distancePass,
        suggestion: !distancePass
          ? `Hold camera at the same distance as your baseline photo (arm's length). Face should be 40-60% of frame.`
          : undefined,
      },
      angle: {
        deviation: checkin.faceAngle,
        baselineDeviation: baseline.faceAngle,
        diff: angleDiff,
        pass: anglePass,
        suggestion: !anglePass
          ? `Face straight ahead. Current angle: ${checkin.faceAngle.toFixed(1)}°, should be <10°`
          : undefined,
      },
      background: {
        clutter: checkin.backgroundClutter,
        baselineClutter: baseline.backgroundClutter,
        pass: backgroundPass,
        suggestion: !backgroundPass
          ? `Use a plain, uncluttered background`
          : undefined,
      },
      expression: {
        neutral: checkin.expression.neutral,
        pass: expressionPass,
        suggestion: !expressionPass
          ? `Use a neutral expression (no smiling, frowning, etc.)`
          : undefined,
      },
    },
    overallValid: allPassed,
    confidenceScore: passedChecks / 5,
  };
}

/**
 * Validate a progress photo against calibration baseline
 * @param {string} photoUrl - Check-in photo URL
 * @param {string} calibrationPhotoUrl - Baseline calibration photo URL
 * @returns {Promise<Object>} Full validation results
 */
async function validateProgressPhoto(photoUrl, calibrationPhotoUrl) {
  try {
    // Analyze both photos
    const baseline = await analyzePhotoConditions(calibrationPhotoUrl);
    const checkin = await analyzePhotoConditions(photoUrl);

    // Compare
    const comparison = comparePhotoConditions(baseline, checkin);

    return {
      baseline: baseline,
      checkin: checkin,
      ...comparison,
    };
  } catch (error) {
    console.error('Photo validation error:', error);
    throw error;
  }
}

module.exports = {
  analyzePhotoConditions,
  comparePhotoConditions,
  validateProgressPhoto,
};

