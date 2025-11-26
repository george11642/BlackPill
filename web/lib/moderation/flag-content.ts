import { supabaseAdmin } from '../supabase/client';

/**
 * Flag content for manual review
 * @param analysisId - Analysis ID
 * @param userId - User ID
 * @param reason - Reason for flagging
 * @param flaggedBy - Who/what flagged it (system, user_report, etc.)
 */
export async function flagContentForReview(
  analysisId: string,
  userId: string,
  reason: string,
  flaggedBy: string = 'system'
): Promise<void> {
  try {
    await supabaseAdmin.from('review_queue').insert({
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
 * @param userId - User ID
 * @returns True if banned
 */
export async function isUserBanned(userId: string): Promise<boolean> {
  try {
    const { data: bans } = await supabaseAdmin
      .from('user_bans')
      .select('*')
      .eq('user_id', userId)
      .or('ban_type.eq.permanent,expires_at.gt.now()')
      .limit(1);

    return bans !== null && bans.length > 0;
  } catch (error) {
    console.error('Error checking ban status:', error);
    return false;
  }
}

