
import {
  withAuth,
  supabaseAdmin,
  handleApiError,
  getRequestId,
  createResponseWithId,
} from '@/lib';

/**
 * Calculate invite streak - consecutive days with ≥1 invite
 */
async function calculateInviteStreak(userId: string): Promise<number> {
  try {
    // Get all accepted referrals ordered by date
    const { data: referrals, error } = await supabaseAdmin
      .from('referrals')
      .select('accepted_at')
      .eq('from_user_id', userId)
      .eq('status', 'accepted')
      .not('accepted_at', 'is', null)
      .order('accepted_at', { ascending: false });

    if (error || !referrals || referrals.length === 0) {
      return 0;
    }

    // Group by date (ignore time)
    const datesWithInvites = new Set<string>();
    referrals.forEach((ref) => {
      if (ref.accepted_at) {
        const date = new Date(ref.accepted_at);
        date.setHours(0, 0, 0, 0);
        datesWithInvites.add(date.toISOString().split('T')[0]);
      }
    });

    const sortedDates = Array.from(datesWithInvites)
      .map((d) => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime()); // Most recent first

    if (sortedDates.length === 0) {
      return 0;
    }

    // Check consecutive days starting from today
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      const dateStr = expectedDate.toISOString().split('T')[0];
      const hasInvite = sortedDates.some((d) => d.toISOString().split('T')[0] === dateStr);
      
      if (hasInvite) {
        streak++;
      } else {
        // Streak broken - only count if today has an invite, otherwise streak is 0
        if (i === 0) {
          return 0; // No invite today, streak is 0
        }
        break; // Streak broken on a previous day
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating invite streak:', error);
    return 0;
  }
}

/**
 * GET /api/referral/stats
 * Get referral statistics for the current user
 */
export const GET = withAuth(async (request: Request, user) => {
  const requestId = getRequestId(request);

  try {
    // Get user's referral code
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('referral_code')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return createResponseWithId(
        { error: 'User not found' },
        { status: 404 },
        requestId
      );
    }

    // Get referral statistics
    const { data: referrals, error } = await supabaseAdmin
      .from('referrals')
      .select('*')
      .eq('from_user_id', user.id);

    if (error) {
      throw error;
    }

    const totalInvited = referrals?.length || 0;
    const accepted = referrals?.filter((r) => r.status === 'accepted').length || 0;
    const pending = referrals?.filter((r) => r.status === 'pending').length || 0;
    const totalBonusScans =
      referrals
        ?.filter((r) => r.status === 'accepted')
        .reduce((sum, r) => sum + (r.bonus_scans_given || 0), 0) || 0;

    // Calculate invite streak: consecutive days with ≥1 invite
    const inviteStreak = await calculateInviteStreak(user.id);

    return createResponseWithId(
      {
        referral_code: userData.referral_code,
        total_invited: totalInvited,
        accepted,
        pending,
        total_bonus_scans: totalBonusScans,
        invite_streak: inviteStreak,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    console.error('Referral stats error:', error);
    return handleApiError(error, request);
  }
});

