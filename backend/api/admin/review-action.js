const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * POST /api/admin/review-action
 * Approve or reject flagged content
 */
module.exports = async (req, res) => {
  await verifyAuth(req, res, async () => {
    try {
      // TODO: Add admin role check
      
      const { review_id, action, notes } = req.body;

      if (!['approved', 'rejected'].includes(action)) {
        return res.status(400).json({
          error: 'Invalid action',
          message: 'Action must be "approved" or "rejected"',
        });
      }

      // Update review queue item
      const { data: review, error: updateError } = await supabaseAdmin
        .from('review_queue')
        .update({
          status: action,
          reviewed_by: req.user.id,
          reviewed_at: new Date().toISOString(),
          notes,
        })
        .eq('id', review_id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // If rejected, take action
      if (action === 'rejected') {
        // Soft delete the analysis
        await supabaseAdmin
          .from('analyses')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', review.analysis_id);

        // Issue warning or ban to user
        await issueUserWarning(review.user_id, review.reason);
      }

      res.status(200).json({
        success: true,
        review,
      });

    } catch (error) {
      console.error('Review action error:', error);
      res.status(500).json({
        error: 'Failed to process review action',
        message: error.message,
      });
    }
  });
};

/**
 * Issue warning or ban to user based on violation history
 */
async function issueUserWarning(userId, reason) {
  // Get user's ban history
  const { data: bans } = await supabaseAdmin
    .from('user_bans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const violationCount = bans?.length || 0;

  let banType = 'warning';
  let durationDays = null;
  let expiresAt = null;

  if (violationCount === 0) {
    // First violation: Warning
    banType = 'warning';
  } else if (violationCount === 1) {
    // Second violation: 7-day ban
    banType = 'temporary';
    durationDays = 7;
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
  } else {
    // Third+ violation: Permanent ban
    banType = 'permanent';
  }

  // Create ban record
  await supabaseAdmin
    .from('user_bans')
    .insert({
      user_id: userId,
      reason,
      ban_type: banType,
      duration_days: durationDays,
      expires_at: expiresAt?.toISOString(),
    });

  // If permanent ban, mark user as deleted
  if (banType === 'permanent') {
    await supabaseAdmin
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', userId);
  }

  // TODO: Send email notification about the ban/warning
  console.log(`Issued ${banType} to user ${userId} for: ${reason}`);
}

