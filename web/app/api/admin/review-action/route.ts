import { Request } from 'next/server';
import { withAuth, supabaseAdmin, handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * Issue warning or ban to user based on violation history
 */
async function issueUserWarning(userId: string, reason: string) {
  // Get user's ban history
  const { data: bans } = await supabaseAdmin
    .from('user_bans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const violationCount = bans?.length || 0;

  let banType = 'warning';
  let durationDays: number | null = null;
  let expiresAt: Date | null = null;

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
  await supabaseAdmin.from('user_bans').insert({
    user_id: userId,
    reason,
    ban_type: banType,
    duration_days: durationDays,
    expires_at: expiresAt?.toISOString() || null,
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

/**
 * POST /api/admin/review-action
 * Approve or reject flagged content
 */
export const POST = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    // TODO: Add admin role check

    const body = await request.json();
    const { review_id, action, notes } = body;

    if (!['approved', 'rejected'].includes(action)) {
      return createResponseWithId(
        {
          error: 'Invalid action',
          message: 'Action must be "approved" or "rejected"',
        },
        { status: 400 },
        requestId
      );
    }

    // Update review queue item
    const { data: review, error: updateError } = await supabaseAdmin
      .from('review_queue')
      .update({
        status: action,
        reviewed_by: user.id,
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
    if (action === 'rejected' && review) {
      // Soft delete the analysis
      await supabaseAdmin
        .from('analyses')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', review.analysis_id);

      // Issue warning or ban to user
      await issueUserWarning(review.user_id, review.reason || 'Content violation');
    }

    return createResponseWithId(
      {
        success: true,
        review,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Review action error:', error);
    return handleApiError(error, request);
  }
});

