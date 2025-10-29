const { supabaseAdmin } = require('./supabase');

/**
 * Flag content for manual review
 * @param {string} analysisId - Analysis ID
 * @param {string} userId - User ID
 * @param {string} reason - Reason for flagging
 * @param {string} flaggedBy - Who/what flagged it (system, user_report, etc.)
 */
async function flagContentForReview(analysisId, userId, reason, flaggedBy = 'system') {
  try {
    await supabaseAdmin
      .from('review_queue')
      .insert({
        analysis_id: analysisId,
        user_id: userId,
        reason,
        flagged_by: flaggedBy,
        status: 'pending',
      });

    console.log(`Flagged analysis ${analysisId} for review: ${reason}`);
  } catch (error) {
    console.error('Failed to flag content:', error);
  }
}

/**
 * Check if user is currently banned
 * @param {string} userId - User ID
 * @returns {boolean} - True if banned
 */
async function isUserBanned(userId) {
  try {
    const { data: bans } = await supabaseAdmin
      .from('user_bans')
      .select('*')
      .eq('user_id', userId)
      .or('ban_type.eq.permanent,expires_at.gt.now()')
      .limit(1);

    return bans && bans.length > 0;
  } catch (error) {
    console.error('Error checking ban status:', error);
    return false;
  }
}

module.exports = {
  flagContentForReview,
  isUserBanned,
};

