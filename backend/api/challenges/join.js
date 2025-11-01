const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * POST /api/challenges/join
 * Join a challenge
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;
      const { challengeId, calibrationPhotoUrl } = req.body;

      if (!challengeId) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'challengeId is required',
        });
      }

      // Verify challenge exists
      const { data: challenge, error: challengeError } = await supabaseAdmin
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .eq('is_active', true)
        .single();

      if (challengeError || !challenge) {
        return res.status(404).json({
          error: 'Challenge not found',
        });
      }

      // Check if already participating
      const { data: existing } = await supabaseAdmin
        .from('challenge_participations')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        return res.status(409).json({
          error: 'Already participating',
          message: 'You are already participating in this challenge',
        });
      }

      // Create participation
      const { data: participation, error: participationError } = await supabaseAdmin
        .from('challenge_participations')
        .insert({
          challenge_id: challengeId,
          user_id: userId,
          calibration_photo_url: calibrationPhotoUrl || null,
          status: 'active',
          current_day: 1,
        })
        .select()
        .single();

      if (participationError) {
        console.error('Participation creation error:', participationError);
        throw participationError;
      }

      return res.status(200).json({
        participation: {
          ...participation,
          challenge: challenge,
        },
      });
    } catch (error) {
      console.error('Join challenge error:', error);
      return res.status(500).json({
        error: 'Failed to join challenge',
        message: error.message,
      });
    }
  });
};

