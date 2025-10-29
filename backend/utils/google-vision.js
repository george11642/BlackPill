const vision = require('@google-cloud/vision');
const config = require('./config');
const { flagContentForReview } = require('./flag-content');

// Create a Vision API client
const client = new vision.ImageAnnotatorClient({
  projectId: config.google.projectId,
  ...(config.google.apiKey ? { apiKey: config.google.apiKey } : { keyFilename: config.google.credentials }),
});

/**
 * Detect faces in an image and extract metrics
 * @param {string} imageUri - URI or path to the image
 * @returns {Promise<Object>} Face detection results with metrics
 */
async function detectFaces(imageUri) {
  try {
    const [result] = await client.faceDetection(imageUri);
    const faces = result.faceAnnotations;

    if (!faces || faces.length === 0) {
      throw new Error('No face detected in the image');
    }

    if (faces.length > 1) {
      throw new Error('Multiple faces detected. Please use a photo with only one person.');
    }

    const face = faces[0];

    // Extract face landmarks for symmetry calculation
    const landmarks = extractLandmarks(face.landmarks);
    
    // Calculate face metrics
    const metrics = {
      confidence: face.detectionConfidence,
      boundingBox: face.boundingPoly,
      landmarks: landmarks,
      headAngles: {
        roll: face.rollAngle,
        pan: face.panAngle,
        tilt: face.tiltAngle,
      },
      likelihood: {
        joy: face.joyLikelihood,
        sorrow: face.sorrowLikelihood,
        anger: face.angerLikelihood,
        surprise: face.surpriseLikelihood,
        underExposed: face.underExposedLikelihood,
        blurred: face.blurredLikelihood,
        headwear: face.headwearLikelihood,
      },
    };

    // Validate image quality
    validateImageQuality(metrics);

    return metrics;
  } catch (error) {
    console.error('Google Vision API error:', error);
    throw error;
  }
}

/**
 * Extract key facial landmarks
 */
function extractLandmarks(landmarks) {
  const landmarkMap = {};
  
  landmarks.forEach((landmark) => {
    landmarkMap[landmark.type] = {
      x: landmark.position.x,
      y: landmark.position.y,
      z: landmark.position.z || 0,
    };
  });

  return landmarkMap;
}

/**
 * Validate image quality for analysis
 */
function validateImageQuality(metrics) {
  // Check if image is too blurred
  if (metrics.likelihood.blurred === 'VERY_LIKELY' || metrics.likelihood.blurred === 'LIKELY') {
    throw new Error('Image is too blurred. Please use a clearer photo.');
  }

  // Check if image is under-exposed
  if (metrics.likelihood.underExposed === 'VERY_LIKELY') {
    throw new Error('Image is too dark. Please use better lighting.');
  }

  // Check head angles (face should be relatively straight)
  if (Math.abs(metrics.headAngles.roll) > 30 || 
      Math.abs(metrics.headAngles.pan) > 30 || 
      Math.abs(metrics.headAngles.tilt) > 30) {
    throw new Error('Face angle is not optimal. Please face the camera directly.');
  }

  // Check confidence
  if (metrics.confidence < 0.7) {
    throw new Error('Face detection confidence is too low. Please use a clearer photo.');
  }
}

/**
 * Check for explicit content using SafeSearch
 * @param {string} imageUri - Image URI
 * @param {string} userId - User ID (for flagging)
 * @param {string} analysisId - Analysis ID (for flagging)
 */
async function checkSafeSearch(imageUri, userId = null, analysisId = null) {
  try {
    const [result] = await client.safeSearchDetection(imageUri);
    const detections = result.safeSearchAnnotation;

    // Check for explicit content
    if (detections.adult === 'VERY_LIKELY' || detections.adult === 'LIKELY') {
      // Flag for review if we have IDs
      if (userId && analysisId) {
        await flagContentForReview(
          analysisId,
          userId,
          `Explicit content detected (${detections.adult})`,
          'system_safesearch'
        );
      }
      throw new Error('Image contains inappropriate content');
    }

    if (detections.violence === 'VERY_LIKELY') {
      if (userId && analysisId) {
        await flagContentForReview(
          analysisId,
          userId,
          `Violent content detected`,
          'system_safesearch'
        );
      }
      throw new Error('Image contains violent content');
    }

    // Flag for manual review if possibly problematic
    if (userId && analysisId) {
      if (detections.adult === 'POSSIBLE' || detections.violence === 'POSSIBLE') {
        await flagContentForReview(
          analysisId,
          userId,
          `Possibly inappropriate content (adult: ${detections.adult}, violence: ${detections.violence})`,
          'system_safesearch'
        );
      }
    }

    return detections;
  } catch (error) {
    console.error('SafeSearch error:', error);
    throw error;
  }
}

module.exports = {
  detectFaces,
  checkSafeSearch,
};

