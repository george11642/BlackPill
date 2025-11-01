const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');
const { validateProgressPhoto } = require('../../utils/photo-verification');

/**
 * POST /api/challenges/checkin
 * Submit a challenge check-in photo
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;
      const { participationId, day, photoUrl, verificationData, notes } = req.body;

      if (!participationId || !day || !photoUrl) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'participationId, day, and photoUrl are required',
        });
      }

      // Verify participation belongs to user
      const { data: participation, error: participationError } = await supabaseAdmin
        .from('challenge_participations')
        .select('challenge_id, current_day, calibration_photo_url')
        .eq('id', participationId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (participationError || !participation) {
        return res.status(404).json({
          error: 'Participation not found',
        });
      }

      // Full photo verification using Google Cloud Vision
      let verificationResult = null;
      let photoVerified = false;

      if (participation.calibration_photo_url) {
        try {
          verificationResult = await validateProgressPhoto(
            photoUrl,
            participation.calibration_photo_url
          );
          photoVerified = verificationResult.overallValid;
        } catch (error) {
          console.error('Photo verification error:', error);
          // Fallback to basic verification if photo analysis fails
          photoVerified = verificationData
            ? verificationData.lighting === 'good' &&
              verificationData.angle === 'good' &&
              verificationData.distance === 'good'
            : false;
          verificationResult = {
            error: error.message,
            checks: verificationData || {},
          };
        }
      } else {
        // No calibration photo yet, use basic verification
        photoVerified = verificationData
          ? verificationData.lighting === 'good' &&
            verificationData.angle === 'good' &&
            verificationData.distance === 'good'
          : false;
      }

      // Create check-in with detailed verification data
      const verificationDataToStore = verificationResult || verificationData || {};

      const { data: checkin, error: checkinError } = await supabaseAdmin
        .from('challenge_checkins')
        .insert({
          participation_id: participationId,
          day: parseInt(day),
          photo_url: photoUrl,
          photo_verified: photoVerified,
          verification_data: verificationDataToStore,
          notes: notes || null,
        })
        .select()
        .single();

      if (checkinError) {
        console.error('Check-in creation error:', checkinError);
        throw checkinError;
      }

      // Update participation current_day if this is the next day
      if (parseInt(day) >= participation.current_day) {
        await supabaseAdmin
          .from('challenge_participations')
          .update({ current_day: parseInt(day) + 1 })
          .eq('id', participationId);
      }

      return res.status(200).json({
        checkin,
        verification: verificationResult ? {
          overallValid: verificationResult.overallValid,
          confidenceScore: verificationResult.confidenceScore,
          checks: verificationResult.checks,
          suggestions: Object.values(verificationResult.checks)
            .filter(check => !check.pass && check.suggestion)
            .map(check => check.suggestion),
        } : null,
      });
    } catch (error) {
      console.error('Challenge check-in error:', error);
      return res.status(500).json({
        error: 'Failed to submit check-in',
        message: error.message,
      });
    }
  });
};

