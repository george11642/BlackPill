const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * POST /api/referral/accept
 * Accept a referral code
 */
module.exports = async (req, res) => {
  await verifyAuth(req, res, async () => {
    try {
      const { referral_code } = req.body;

      if (!referral_code) {
        return res.status(400).json({
          error: 'Missing referral code',
        });
      }

      // Find the user who owns this referral code
      const { data: referrer, error: referrerError } = await supabaseAdmin
        .from('users')
        .select('id, username, email')
        .eq('referral_code', referral_code)
        .single();

      if (referrerError || !referrer) {
        return res.status(404).json({
          error: 'Invalid referral code',
        });
      }

      // Check if user is trying to refer themselves
      if (referrer.id === req.user.id) {
        return res.status(403).json({
          error: 'Cannot use your own referral code',
        });
      }

      // Check if user has already used a referral code
      const { data: existingReferral } = await supabaseAdmin
        .from('users')
        .select('referred_by')
        .eq('id', req.user.id)
        .single();

      if (existingReferral?.referred_by) {
        return res.status(409).json({
          error: 'Referral code already used',
          message: 'You have already accepted a referral code',
        });
      }

      // Check device/IP fraud prevention (simplified)
      // In production, you'd implement more sophisticated fraud detection

      const bonusScans = 5;

      // Create referral record
      const { data: referral, error: referralError } = await supabaseAdmin
        .from('referrals')
        .insert({
          from_user_id: referrer.id,
          to_user_id: req.user.id,
          referral_code,
          bonus_scans_given: bonusScans,
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (referralError) {
        throw new Error('Failed to create referral record');
      }

      // Update referred user
      await supabaseAdmin
        .from('users')
        .update({
          referred_by: referrer.id,
          scans_remaining: supabaseAdmin.raw('scans_remaining + ?', [bonusScans]),
        })
        .eq('id', req.user.id);

      // Give bonus scans to referrer
      await supabaseAdmin
        .from('users')
        .update({
          scans_remaining: supabaseAdmin.raw('scans_remaining + ?', [bonusScans]),
        })
        .eq('id', referrer.id);

      // TODO: Send push notifications to both users

      res.status(200).json({
        bonus_scans: bonusScans,
        referrer_name: referrer.username || referrer.email.split('@')[0],
        message: `You got ${bonusScans} free scans from ${referrer.username || 'a friend'}!`,
      });

    } catch (error) {
      console.error('Referral acceptance error:', error);
      res.status(500).json({
        error: 'Failed to accept referral',
        message: error.message,
      });
    }
  });
};

